import Peer, { DataConnection } from 'peerjs';
import { GameMode, Player, GameMove } from '../types/game';
import {
    ConnectionStatus,
    RoomInfo,
    OnlinePlayer,
    PeerMessage,
    JoinPayload,
    MovePayload,
    SyncPayload,
    RoomRole,
    OnlineGameState,
} from '../types/online';

type MessageCallback = (message: PeerMessage) => void;
type ConnectionCallback = (status: ConnectionStatus) => void;
type PlayerJoinCallback = (player: OnlinePlayer) => void;

class PeerService {
    private peer: Peer | null = null;
    private connection: DataConnection | null = null;
    private roomId: string | null = null;
    private role: RoomRole | null = null;
    private messageCallback: MessageCallback | null = null;
    private connectionCallback: ConnectionCallback | null = null;
    private playerJoinCallback: PlayerJoinCallback | null = null;

    /**
     * Inicializa o PeerJS
     */
    async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.peer) {
                resolve();
                return;
            }

            try {
                // Usando servidor público do PeerJS
                this.peer = new Peer({
                    host: 'peerjs-server.herokuapp.com',
                    port: 443,
                    path: '/',
                    secure: true,
                    debug: 2, // Habilitar logs para debug
                });

                this.peer.on('open', (id) => {
                    console.log('🎮 PeerJS initialized with ID:', id);
                    this.updateConnectionStatus('disconnected');
                    resolve();
                });

                this.peer.on('error', (error) => {
                    console.error('❌ PeerJS error:', error);
                    this.updateConnectionStatus('error');
                    reject(error);
                });

                this.peer.on('disconnected', () => {
                    console.log('🔌 PeerJS disconnected');
                    this.updateConnectionStatus('disconnected');
                });

                // Escutar conexões recebidas (quando alguém tenta entrar na sala)
                this.peer.on('connection', (conn) => {
                    console.log('👥 Incoming connection from:', conn.peer);
                    this.handleIncomingConnection(conn);
                });
            } catch (error) {
                console.error('❌ Failed to initialize PeerJS:', error);
                reject(error);
            }
        });
    }

    /**
     * Cria uma nova sala (HOST)
     */
    async createRoom(mode: GameMode, hostName: string): Promise<string> {
        if (!this.peer) {
            throw new Error('PeerJS not initialized');
        }

        // Gerar ID da sala (6 caracteres aleatórios em maiúsculo)
        this.roomId = this.generateRoomId();
        this.role = 'host';

        // Criar peer com ID customizado (roomId)
        await this.reconnectWithCustomId(this.roomId);

        console.log(`🏠 Room created with ID: ${this.roomId}`);
        this.updateConnectionStatus('waiting');

        return this.roomId;
    }

    /**
     * Entra em uma sala existente (GUEST)
     */
    async joinRoom(roomId: string, guestName: string): Promise<void> {
        if (!this.peer) {
            throw new Error('PeerJS not initialized');
        }

        this.roomId = roomId.toUpperCase();
        this.role = 'guest';
        this.updateConnectionStatus('connecting');

        try {
            // Conectar ao host
            this.connection = this.peer.connect(this.roomId, {
                reliable: true,
                serialization: 'json',
            });

            this.setupConnectionHandlers(this.connection);

            // Aguardar conexão abrir
            await new Promise<void>((resolve, reject) => {
                if (!this.connection) {
                    reject(new Error('Connection failed'));
                    return;
                }

                this.connection.on('open', () => {
                    console.log(`🎮 Connected to room: ${this.roomId}`);

                    // Enviar informações do jogador
                    this.sendMessage({
                        type: 'join',
                        payload: {
                            playerName: guestName,
                        } as JoinPayload,
                    });

                    this.updateConnectionStatus('connected');
                    resolve();
                });

                this.connection.on('error', (error) => {
                    console.error('❌ Connection error:', error);
                    this.updateConnectionStatus('error');
                    reject(error);
                });

                // Timeout de 10 segundos
                setTimeout(() => {
                    if (this.connection?.open !== true) {
                        reject(new Error('Connection timeout'));
                    }
                }, 10000);
            });
        } catch (error) {
            console.error('❌ Failed to join room:', error);
            this.updateConnectionStatus('error');
            throw error;
        }
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
     * Envia sincronização do estado do jogo
     */
    sendSync(gameState: OnlineGameState, roomInfo: RoomInfo): void {
        this.sendMessage({
            type: 'sync',
            payload: {
                gameState,
                roomInfo,
            } as SyncPayload,
        });
    }

    /**
     * Marca jogador como pronto
     */
    sendReady(): void {
        this.sendMessage({ type: 'ready' });
    }

    /**
     * Sair da sala
     */
    leaveRoom(): void {
        this.sendMessage({ type: 'leave' });
        this.disconnect();
    }

    /**
     * Disconectar e limpar
     */
    disconnect(): void {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }

        this.roomId = null;
        this.role = null;
        this.updateConnectionStatus('disconnected');

        console.log('🔌 Disconnected from room');
    }

    /**
     * Destruir completamente o peer
     */
    destroy(): void {
        this.disconnect();

        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }

        console.log('💀 PeerJS destroyed');
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
    }

    /**
     * Registrar callback para quando jogador entrar
     */
    onPlayerJoin(callback: PlayerJoinCallback): void {
        this.playerJoinCallback = callback;
    }

    /**
     * Obter ID da sala atual
     */
    getRoomId(): string | null {
        return this.roomId;
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
        return this.connection?.open === true;
    }

    // ========== MÉTODOS PRIVADOS ==========

    /**
     * Lidar com conexão recebida (HOST apenas)
     */
    private handleIncomingConnection(conn: DataConnection): void {
        if (this.role !== 'host') {
            console.warn('⚠️ Received connection but not a host');
            return;
        }

        console.log('✅ Guest connected:', conn.peer);
        this.connection = conn;
        this.setupConnectionHandlers(conn);
        this.updateConnectionStatus('connected');
    }

    /**
     * Configurar handlers da conexão
     */
    private setupConnectionHandlers(conn: DataConnection): void {
        conn.on('data', (data) => {
            console.log('📨 Received message:', data);
            if (this.messageCallback) {
                this.messageCallback(data as PeerMessage);
            }
        });

        conn.on('close', () => {
            console.log('🔌 Connection closed');
            this.updateConnectionStatus('disconnected');
            this.connection = null;
        });

        conn.on('error', (error) => {
            console.error('❌ Connection error:', error);
            this.updateConnectionStatus('error');
        });
    }

    /**
     * Enviar mensagem via conexão P2P
     */
    sendMessage(message: PeerMessage): void {
        if (!this.connection || !this.connection.open) {
            console.warn('⚠️ Cannot send message: not connected');
            return;
        }

        console.log('📤 Sending message:', message);
        this.connection.send(message);
    }

    /**
     * Atualizar status de conexão
     */
    private updateConnectionStatus(status: ConnectionStatus): void {
        console.log(`📊 Connection status: ${status}`);
        if (this.connectionCallback) {
            this.connectionCallback(status);
        }
    }

    /**
     * Reconectar com ID customizado
     */
    private async reconnectWithCustomId(customId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Destruir peer atual
            if (this.peer) {
                this.peer.destroy();
            }

            // Criar novo peer com ID customizado
            this.peer = new Peer(customId, {
                host: 'peerjs-server.herokuapp.com',
                port: 443,
                path: '/',
                secure: true,
                debug: 2,
            });

            this.peer.on('open', (id) => {
                console.log('🎮 PeerJS reconnected with custom ID:', id);
                resolve();
            });

            this.peer.on('error', (error) => {
                console.error('❌ PeerJS reconnection error:', error);
                reject(error);
            });

            // Escutar conexões recebidas
            this.peer.on('connection', (conn) => {
                console.log('👥 Incoming connection from:', conn.peer);
                this.handleIncomingConnection(conn);
            });
        });
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
}

// Singleton instance
export const peerService = new PeerService();
