import { database } from '../config/firebase';
import { ref, set, get, onValue, off, remove, update, onChildAdded, query, orderByChild, startAt, onDisconnect, push, serverTimestamp } from 'firebase/database';
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
    /**
     * @param forcedRoomId when supplied (ranked matchmaking), the room is created
     * with this exact code so the matched guest can join it. Without it the host
     * generated an unrelated code and the guest could never find the room.
     */
    async createRoom(mode: GameMode, hostName: string, forcedRoomId?: string): Promise<string> {
        if (!this.currentUserId) {
            throw new Error('User not authenticated');
        }

        // Gerar código de sala (6 caracteres). Sem checar colisão, um código
        // repetido sobrescrevia (destruía) a partida de outros dois jogadores.
        if (forcedRoomId) {
            this.currentRoomId = forcedRoomId.toUpperCase();
        } else {
            let candidate = this.generateRoomId();
            for (let attempt = 0; attempt < 5; attempt++) {
                try {
                    const existing = await get(ref(database, `rooms/${candidate}`));
                    if (!existing.exists()) break;
                    candidate = this.generateRoomId();
                } catch {
                    break; // sem conexão para checar — segue com o código gerado
                }
            }
            this.currentRoomId = candidate;
        }
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
        await this.listenToRoom();

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
            await this.listenToRoom();

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
    private async listenToRoom(): Promise<void> {
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

        // Only messages created AFTER we attached should be delivered. The old
        // filter was startAt(Date.now()) on the local clock: if this device ran
        // even slightly ahead of the opponent's, every message they sent for
        // that many seconds sorted below the cutoff and was silently dropped —
        // the board froze on one side only.
        // push() keys sort chronologically, so we remember the newest existing
        // key and simply ignore anything at or below it. No clock involved.
        const messagesNode = this.messagesRef;
        let cursorKey: string | null = null;
        const seenKeys = new Set<string>();

        try {
            const existing = await get(messagesNode);
            if (existing.exists()) {
                existing.forEach(child => {
                    if (child.key && (!cursorKey || child.key > cursorKey)) {
                        cursorKey = child.key;
                    }
                    return false;
                });
            }
        } catch (error) {
            console.log('Could not read message cursor:', error);
        }

        onChildAdded(messagesNode, (snapshot) => {
            if (!snapshot.exists() || !snapshot.key) return;

            // Skip history that predates this listener, and any duplicate
            // delivery of a key we already handled.
            if (cursorKey && snapshot.key <= cursorKey) return;
            if (seenKeys.has(snapshot.key)) return;
            seenKeys.add(snapshot.key);

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
    sendMove(row: number, col: number, player: Player, moveNumber: number, gravityFinalRow?: number): void {
        const payload: MovePayload = {
            row,
            col,
            player,
            moveNumber,
        };
        if (gravityFinalRow !== undefined) {
            payload.gravityFinalRow = gravityFinalRow;
        }
        this.sendMessage({
            type: 'move',
            payload,
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

            // The public lobby advertises the room under its own path, and that
            // entry was only cleared when someone joined. A host who backed out
            // left the ad behind, so the lobby kept listing a room that no
            // longer existed and anyone tapping it got "Room not found".
            try {
                await remove(ref(database, `public_lobby/${this.currentRoomId}`));
            } catch (error) {
                console.log('Failed to clear public lobby entry:', error);
            }
        }

        // Guest: remove ourselves from the room. The onDisconnect handler only
        // fires when the socket actually drops, which never happens while the
        // app stays open — so leaving used to keep the guest slot occupied,
        // the host got no "opponent left", and the room read as full to others.
        if (this.role === 'guest' && this.currentRoomId) {
            try {
                await remove(ref(database, `rooms/${this.currentRoomId}/guest`));
                console.log('👋 Guest slot released');
            } catch (error) {
                console.log('Failed to release guest slot:', error);
            }
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

        // push() generates a unique, chronologically ordered key. The old
        // `messages/${Date.now()}` key meant two messages in the same
        // millisecond OVERWROTE each other — and an overwrite is a
        // child_changed, so onChildAdded never fired and the move vanished.
        const newMessageRef = push(ref(database, `rooms/${this.currentRoomId}/messages`));

        const messageWithSender = {
            ...message,
            senderId: this.currentUserId,
            // Server clock, so ordering doesn't depend on the two devices'
            // clocks agreeing with each other.
            timestamp: serverTimestamp(),
        };

        set(newMessageRef, messageWithSender);
        console.log('📤 Sending message:', message);
    }

    /**
     * Registrar callback para mensagens
     */
    onMessage(callback: MessageCallback | null): void {
        this.messageCallback = callback;
    }

    /**
     * Registrar callback para status de conexão
     */
    onConnectionStatus(callback: ConnectionCallback | null): void {
        this.connectionCallback = callback;
        // Immediate callback with current status
        if (callback && this.currentConnectionStatus) {
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
    onRoomUpdate(callback: RoomUpdateCallback | null): void {
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
