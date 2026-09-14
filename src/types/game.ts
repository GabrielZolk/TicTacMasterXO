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

export type GameMode = 'classic' | 'infinity' | 'gravity' | 'blind' | 'bigBoard' | 'survival' | 'blitz' | 'reverse' | 'bomb' | 'mirror' | 'mad' | 'gobble';
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

export type ThemeType = 'dark' | 'light' | 'cartoon' | 'futuristic' | 'meme' | 'neon' | 'retro' | 'nature' | 'samuel' | 'copa_nick' | 'matrix' | 'ocean' | 'fire_ice' | 'gold_luxury' | 'alien';

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

export interface BombGameState extends GameState {
  // Bomb mode: one hidden cell is mined. Playing on it destroys the piece,
  // costs the turn, and the bomb relocates to another empty cell.
  bombRow: number;
  bombCol: number;
  // Set on the dispatch where a bomb was triggered, so the UI can animate it.
  lastExplosion?: { row: number; col: number; player: Player };
  explosionCount: number;
}

export interface MirrorGameState extends GameState {
  // Mirror mode: every placement is duplicated on the point-symmetric cell
  // (row,col) -> (size-1-row, size-1-col) when that cell is free.
  // The center cell mirrors onto itself, so it never duplicates.
  lastMirrorCell?: { row: number; col: number };
}

export type MadMutationType = 'rotate' | 'swap' | 'freeze';

export interface MadMutation {
  type: MadMutationType;
  /** Bumped on every mutation so the UI can animate each one. */
  id: number;
}

export interface MadGameState extends GameState {
  // Mad mode: every few moves the board mutates — it rotates, two pieces swap,
  // or a cell freezes. Keeps a familiar board permanently unpredictable.
  movesUntilMutation: number;
  lastMutation?: MadMutation;
  /** Cell that cannot be played while frozenTurnsLeft > 0. */
  frozenCell?: { row: number; col: number };
  frozenTurnsLeft: number;
  mutationCount: number;
}

/** Piece sizes in Gobble mode. Bigger swallows smaller. */
export type GobbleSize = 1 | 2 | 3;

export interface GobbleGameState extends GameState {
  // Gobble mode: each player holds 2 small, 2 medium and 2 large pieces.
  // A piece can be placed on an empty cell or on top of a SMALLER piece
  // (swallowing it). `board` always holds the visible top piece, so the normal
  // win detection keeps working untouched.
  cellSizes: (GobbleSize | null)[][];
  /** Remaining pieces per player, indexed by size. */
  piecesLeft: {
    X: Record<GobbleSize, number>;
    O: Record<GobbleSize, number>;
  };
  /** Size the current player has selected to place. */
  selectedSize: GobbleSize;
  lastGobble?: { row: number; col: number };
}

export type ExtendedGameState =
  | GameState
  | InfinityGameState
  | GravityGameState
  | BlindGameState
  | BigBoardGameState
  | SurvivalGameState
  | BlitzGameState
  | ReverseGameState
  | BombGameState
  | MirrorGameState
  | MadGameState
  | GobbleGameState;

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
  Store: undefined;
  BattlePass: undefined;
  Profile: undefined;
  Ranked: undefined;
  Challenges: undefined;
  Tournament: undefined;
  Referral: undefined;
  Matchmaking: { mode: GameMode };
  PublicLobby: { mode: GameMode };
  Achievements: undefined;
  DailyDuel: undefined;
  Leaderboard: undefined;
};

/**
 * What the player actually earned in the round that just ended.
 *
 * Every one of these was already being credited — stars, battle-pass XP, ranked
 * points, chests, achievements — and every one of them was thrown away without
 * ever reaching the screen, so a win looked like it paid nothing. The end-of-game
 * modal reads this to show the payout where it happens.
 */
export interface GameRewards {
  stars: number;
  xp: number;
  rankedPoints: number;
  leveledUp: boolean;
  newLevel: number;
  /** Achievement ids unlocked by this round. */
  achievements: string[];
  /** Rarity of the chest this round dropped, when it dropped one. */
  chest: string | null;
}
