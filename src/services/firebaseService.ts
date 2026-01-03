import { database } from '../config/firebase';
import { ref, set, get, onValue, off, remove, update, onChildAdded, query, orderByChild, startAt, onDisconnect } from 'firebase/database';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { GameMode, Player, GameMove } from '../types/game';
import {
    ConnectionStatus,
    RoomInfo,
    OnlinePlayer,
    PeerMessage,
    JoinPayload,
    MovePayload,
    RoomRole,
    OnlineGameState,
} from '../types/online';

type MessageCallback = (message: PeerMessage) => void;
type ConnectionCallback = (status: ConnectionStatus) => void;
type RoomUpdateCallback = (room: RoomInfo) => void;

class FirebaseService {
    private auth = getAuth();
    private currentUserId: string | null = null;
    private currentRoomId: string | null = null;
    private role: RoomRole | null = null;
    private messageCallback: MessageCallback | null = null;
    private connectionCallback: ConnectionCallback | null = null;
    private roomCallback: RoomUpdateCallback | null = null;
    private roomRef: any = null;
    private messagesRef: any = null;
    private currentConnectionStatus: ConnectionStatus = 'disconnected';

    /**
     * Inicializa autenticação anônima
     */
    async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            let resolved = false;

            // Timeout de segurança
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    reject(new Error('Authentication timeout'));
                }
            }, 10000);

            // Verificar se já está autenticado
            const unsubscribe = onAuthStateChanged(this.auth, async (user) => {
                if (resolved) return; // Já resolveu, ignorar chamadas subsequentes

                if (user) {
                    // Já autenticado
                    resolved = true;
                    clearTimeout(timeout);
                    this.currentUserId = user.uid;
                    console.log('🔥 Firebase user authenticated:', user.uid);
                    this.updateConnectionStatus('disconnected');
                    unsubscribe();
                    resolve();
                } else {
                    // Fazer login anônimo
                    try {
                        const userCredential = await signInAnonymously(this.auth);
                        resolved = true;
                        clearTimeout(timeout);
                        this.currentUserId = userCredential.user.uid;
                        console.log('🔥 Firebase anonymous login successful:', this.currentUserId);
                        this.updateConnectionStatus('disconnected');
                        unsubscribe();
                        resolve();
                    } catch (error) {
                        if (!resolved) {
                            resolved = true;
                            clearTimeout(timeout);
                            console.error('❌ Firebase auth error:', error);
                            this.updateConnectionStatus('error');
                            unsubscribe();
                            reject(error);
                        }
                    }
                }
            });
        });
    }

    /**
     * Cria uma nova sala (HOST)
     */
    async createRoom(mode: GameMode, hostName: string): Promise<string> {
        if (!this.currentUserId) {
            throw new Error('User not authenticated');
        }

        // Gerar código de sala (6 caracteres)
        this.currentRoomId = this.generateRoomId();
        this.role = 'host';

        const roomData: RoomInfo = {
            id: this.currentRoomId,
            mode,
            host: {
                id: this.currentUserId,
                name: hostName,
                symbol: 'X',
                ready: false,
            },
            createdAt: Date.now(),
        };

        // Criar sala no Firebase
        this.roomRef = ref(database, `rooms/${this.currentRoomId}`);
        await set(this.roomRef, roomData);

        // Configurar cleanup automático em caso de desconexão (fechar app, crash)
        onDisconnect(this.roomRef).remove();

        console.log(`🏠 Room created: ${this.currentRoomId}`);
        this.updateConnectionStatus('waiting');

        // Escutar mudanças na sala
        this.listenToRoom();

        return this.currentRoomId;
    }

    /**
     * Entra em uma sala existente (GUEST)
     * Retorna os dados da sala para que o Guest use o modo de jogo correto
     */
    async joinRoom(roomId: string, guestName: string): Promise<RoomInfo> {
        if (!this.currentUserId) {
            throw new Error('User not authenticated');
        }

        this.currentRoomId = roomId.toUpperCase();
        this.role = 'guest';
        this.updateConnectionStatus('connecting');

        try {
            // Verificar se sala existe
            this.roomRef = ref(database, `rooms/${this.currentRoomId}`);
            const snapshot = await get(this.roomRef);

            if (!snapshot.exists()) {
                throw new Error('Room not found');
            }

            const roomData = snapshot.val() as RoomInfo;

            // Verificar se sala já está cheia
            if (roomData.guest) {
                throw new Error('Room is full');
            }

            // Adicionar guest à sala
            const guestData: OnlinePlayer = {
                id: this.currentUserId,
                name: guestName,
                symbol: 'O',
                ready: false,
            };

            // Configurar cleanup automático para guest
            const guestRef = ref(database, `rooms/${this.currentRoomId}/guest`);
            onDisconnect(guestRef).remove();

            await update(this.roomRef, {
                guest: guestData,
            });

            console.log(`🎮 Joined room: ${this.currentRoomId} (Mode: ${roomData.mode})`);
            this.updateConnectionStatus('connected');

            // Escutar mudanças na sala
            this.listenToRoom();

            // Notificar host que guest entrou
            this.sendMessage({
                type: 'join',
                payload: {
                    playerName: guestName,
                } as JoinPayload,
            });

            // Retornar dados da sala para o Guest usar o modo correto
            return roomData;
        } catch (error) {
            console.error('❌ Failed to join room:', error);
            this.updateConnectionStatus('error');
            throw error;
        }
    }

    /**
     * Escutar mudanças na sala em tempo real
     */
    private listenToRoom(): void {
        if (!this.roomRef) return;

        // Escutar mudanças nos dados da sala
        onValue(this.roomRef, (snapshot) => {
            if (!snapshot.exists()) {
                console.log('🔌 Room deleted');
                this.updateConnectionStatus('disconnected');
                return;
            }

            const roomData = snapshot.val() as RoomInfo;


            // Verificar se guest entrou (para host)
            if (this.role === 'host' && roomData.guest) {
                this.updateConnectionStatus('connected');
            }

            if (this.roomCallback) {
                this.roomCallback(roomData);
            }

            console.log('📊 Room updated:', roomData);
        });

        // Escutar mensagens usando onChildAdded para garantir que NENHUMA mensagem seja perdida
        // e que sejam processadas na ordem correta
        this.messagesRef = ref(database, `rooms/${this.currentRoomId}/messages`);

        // Usar query para ouvir apenas novas mensagens a partir de agora
        // Na prática, como salas são efêmeras, podemos ouvir tudo, mas limitByLast ou startAt é mais seguro
        const messagesQuery = query(this.messagesRef, orderByChild('timestamp'), startAt(Date.now()));

        onChildAdded(messagesQuery, (snapshot) => {
            if (!snapshot.exists()) return;

            const message = snapshot.val() as PeerMessage;

            // Ignorar próprias mensagens
            if ((message as any).senderId === this.currentUserId) return;

            console.log('📨 Received message (sequence):', message);
            if (this.messageCallback) {
                this.messageCallback(message);
            }
        });
    }

    /**
     * Envia uma jogada
     */
    sendMove(row: number, col: number, player: Player, moveNumber: number): void {
        this.sendMessage({
            type: 'move',
            payload: {
                row,
                col,
                player,
                moveNumber,
            } as MovePayload,
        });
    }

    /**
     * Marca jogador como pronto
     */
    async sendReady(): Promise<void> {
        if (!this.currentRoomId || !this.role) return;

        const updates: any = {};
        updates[`rooms/${this.currentRoomId}/${this.role}/ready`] = true;

        await update(ref(database), updates);

        // Notify opponent
        this.sendMessage({ type: 'ready' });
    }

    /**
     * Atualiza o status de intenção de jogar novamente (Rematch)
     */
    async updateRematchStatus(wanted: boolean): Promise<void> {
        if (!this.currentRoomId || !this.role) return;

        const updates: any = {};
        updates[`rooms/${this.currentRoomId}/${this.role}/wantRematch`] = wanted;

        await update(ref(database), updates);

        // Notify via message (optional backup)
        if (wanted) {
            this.sendMessage({ type: 'rematch_request' });
        }
    }

    /**
     * Reseta o status de rematch de AMBOS os jogadores (apenas Host deve usar)
     * Isso é usado para garantir que ambos os flags são resetados atomicamente
     */
    async resetBothPlayersRematchStatus(): Promise<void> {
        if (!this.currentRoomId || this.role !== 'host') return;

        const updates: any = {};
        updates[`rooms/${this.currentRoomId}/host/wantRematch`] = false;
        updates[`rooms/${this.currentRoomId}/guest/wantRematch`] = false;

        await update(ref(database), updates);
        console.log('🔄 Reset rematch status for both players');
    }

    /**
     * Sair da sala
     */
    async leaveRoom(): Promise<void> {
        this.sendMessage({ type: 'leave' });
        await this.disconnect();
    }

    /**
     * Desconectar e limpar
     */
    async disconnect(): Promise<void> {
        if (this.roomRef) {
            off(this.roomRef);
            this.roomRef = null;
        }

        if (this.messagesRef) {
            off(this.messagesRef);
            this.messagesRef = null;
        }

        // Se for host, deletar sala
        if (this.role === 'host' && this.currentRoomId) {
            const roomToDelete = ref(database, `rooms/${this.currentRoomId}`);
            await remove(roomToDelete);
            console.log('🗑️ Room deleted');
        }

        this.currentRoomId = null;
        this.role = null;
        this.updateConnectionStatus('disconnected');

        console.log('🔌 Disconnected from room');
    }

    /**
     * Enviar mensagem
     */
    sendMessage(message: PeerMessage): void {
        if (!this.currentRoomId || !this.currentUserId) {
            console.warn('⚠️ Cannot send message: not connected');
            return;
        }

        const messageRef = ref(database, `rooms/${this.currentRoomId}/messages`);
        const newMessageRef = ref(database, `rooms/${this.currentRoomId}/messages/${Date.now()}`);

        const messageWithSender = {
            ...message,
            senderId: this.currentUserId,
            timestamp: Date.now(),
        };

        set(newMessageRef, messageWithSender);
        console.log('📤 Sending message:', message);
    }

    /**
     * Registrar callback para mensagens
     */
    onMessage(callback: MessageCallback): void {
        this.messageCallback = callback;
    }

    /**
     * Registrar callback para status de conexão
     */
    onConnectionStatus(callback: ConnectionCallback): void {
        this.connectionCallback = callback;
        // Immediate callback with current status
        if (this.currentConnectionStatus) {
            callback(this.currentConnectionStatus);
        }
    }

    /**
     * Obter status atual de conexão
     */
    getConnectionStatus(): ConnectionStatus {
        return this.currentConnectionStatus;
    }

    /**
     * Registrar callback para atualizações da sala
     */
    onRoomUpdate(callback: RoomUpdateCallback): void {
        this.roomCallback = callback;
    }

    /**
     * Obter ID da sala atual
     */
    getRoomId(): string | null {
        return this.currentRoomId;
    }

    /**
     * Obter role (host ou guest)
     */
    getRole(): RoomRole | null {
        return this.role;
    }

    /**
     * Verificar se está conectado
     */
    isConnected(): boolean {
        return this.currentRoomId !== null && this.currentUserId !== null;
    }

    /**
     * Atualizar status de conexão
     */
    private updateConnectionStatus(status: ConnectionStatus): void {
        console.log(`📊 Connection status: ${status}`);
        this.currentConnectionStatus = status;
        if (this.connectionCallback) {
            this.connectionCallback(status);
        }
    }

    /**
     * Gerar ID de sala aleatório (6 caracteres)
     */
    private generateRoomId(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Destruir completamente
     */
    async destroy(): Promise<void> {
        await this.disconnect();
        console.log('💀 Firebase service destroyed');
    }
}

// Singleton instance
export const firebaseService = new FirebaseService();
