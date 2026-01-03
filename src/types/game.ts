export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = Cell[][];

export interface GameMove {
  row: number;
  col: number;
  player: Player;
  moveNumber: number;
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  winner: Player | null;
  isDraw: boolean;
  moves: GameMove[];
  moveCount: number;
}

export type GameMode = 'classic' | 'infinity' | 'gravity' | 'blind' | 'bigBoard' | 'survival' | 'blitz' | 'reverse';
export type OpponentType = 'ai' | 'human' | 'online';

export interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
}

export interface GameStats {
  playerX: PlayerStats;
  playerO: PlayerStats;
  totalGames: number;
  currentStreak: number;
  bestStreak: number;
}

export type Difficulty = 'noob' | 'mediano' | 'expert' | 'challenger' | 'troll';

export interface AIConfig {
  difficulty: Difficulty;
  isThinking: boolean;
}

export type ThemeType = 'dark' | 'light' | 'cartoon' | 'futuristic' | 'meme' | 'neon' | 'retro' | 'nature' | 'samuel';

export interface GameConfig {
  mode: GameMode;
  opponent: OpponentType;
  difficulty?: Difficulty;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  theme: ThemeType;
  language: string;
}

export interface WinningLine {
  type: 'row' | 'col' | 'diagonal';
  index: number;
  cells: Array<{ row: number; col: number }>;
}

// Estados especiais para diferentes modos
export interface InfinityGameState extends Omit<GameState, 'isDraw'> {
  maxPieces: number;
  oldestMoveIndex: number;
  nextToRemove?: GameMove;
}

export interface GravityFallAnimation {
  player: Player;
  col: number;
  startRow: number;
  endRow: number;
  isAnimating: boolean;
}

export interface GravityGameState extends GameState {
  // Gravity mode: piece appears where clicked, then may randomly fall with animation
  pendingFall?: GravityFallAnimation;
}


export interface BlindGameState extends GameState {
  hiddenMoves: GameMove[];
  lastVisibleMove?: GameMove;
  hideDelay: number;
}


export interface BigBoardGameState extends GameState {
  boardSize: 4 | 5;
  winCondition: 4 | 5;
}


export interface SurvivalGameState extends GameState {
  lives: number;
  maxLives: number;
  consecutiveWins: number;
}

export interface BlitzGameState extends GameState {
  timePerMove: number; // seconds (1-5)
  currentTurnStartTime: number; // timestamp when current turn started
  timeRemaining: number; // seconds remaining for current turn
  timedOut: boolean; // true if a player ran out of time
  timedOutPlayer: Player | null; // which player timed out
}

export interface ReverseGameState extends GameState {
  // Reverse mode: whoever makes 3 in a line LOSES
  // Uses standard GameState but with inverted win logic
}

export type ExtendedGameState =
  | GameState
  | InfinityGameState
  | GravityGameState
  | BlindGameState
  | BigBoardGameState
  | SurvivalGameState
  | BlitzGameState
  | ReverseGameState;

// Tipos para navegação
export type RootStackParamList = {
  Home: undefined;
  Opponent: {
    mode: GameMode;
  };
  Game: {
    mode: GameMode;
    opponent: OpponentType;
    difficulty?: Difficulty;
    roomCode?: string;
    playerName?: string;
    isHost?: boolean;
  };
  Difficulty: {
    mode: GameMode;
  };
  OnlineLobby: {
    mode: GameMode;
  };
  OnlineWaitingRoom: {
    mode: GameMode;
    roomCode: string;
    playerName: string;
    isHost: boolean;
  };
  Settings: undefined;
  Statistics: undefined;
  Theme: undefined;
  RemoveAds: undefined;
};
