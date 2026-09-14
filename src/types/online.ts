import { GameMode, Player, GameMove } from './game';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'waiting' | 'playing' | 'error';

export type RoomRole = 'host' | 'guest';

export interface OnlinePlayer {
  id: string;
  name: string;
  symbol: Player;
  ready: boolean;
  wantRematch?: boolean;
}

export interface RoomInfo {
  id: string;
  mode: GameMode;
  host: OnlinePlayer;
  guest?: OnlinePlayer;
  createdAt: number;
}

export interface OnlineGameState {
  board: (Player | null)[][];
  currentPlayer: Player;
  winner: Player | null;
  isDraw: boolean;
  moves: GameMove[];
  moveCount: number;
}

export interface PeerMessage {
  type: 'join' | 'ready' | 'move' | 'restart' | 'leave' | 'sync' | 'start_player' | 'rematch_request' | 'emote';
  payload?: any;
}

export interface EmotePayload {
  emoteId: string;
  emoji: string;
}

export interface JoinPayload {
  playerName: string;
}

export interface MovePayload {
  row: number;
  col: number;
  player: Player;
  moveNumber: number;
  gravityFinalRow?: number; // For gravity mode: pre-determined row after gravity fall (-1 = no fall)
}

export interface SyncPayload {
  gameState: OnlineGameState;
  roomInfo: RoomInfo;
}
