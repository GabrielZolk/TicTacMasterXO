import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GameState,
  GameMode,
  GameConfig,
  GameStats,
  Player,
  Cell,
  GameMove,
  Difficulty,
  InfinityGameState,
  WinningLine,
  OpponentType,
  ExtendedGameState,
  GravityGameState,
  GravityFallAnimation,
  BlindGameState,
  BigBoardGameState,
  SurvivalGameState,
  BlitzGameState,
  ReverseGameState,
  BombGameState,
  MirrorGameState,
  MadGameState,
  MadMutationType,
  GobbleGameState,
  GobbleSize,
  GameRewards,
} from '../types/game';
import { AIPlayer } from '../utils/aiPlayer';
import { soundManager, SoundUtils } from '../utils/soundManager';
import { storeService } from '../services/storeService';
import { battlepassService } from '../services/battlepassService';
import { rankedService } from '../services/rankedService';
import { challengeService } from '../services/challengeService';
import { achievementService } from '../services/achievementService';
import { chestService } from '../services/chestService';
import {
  createBoard,
  createBigBoard,
  applyGravity,
  checkWinCondition as checkWin,
  isBoardFull as isFull
} from '../utils/gameLogic';

// Initial states
const createInitialBoard = (): Cell[][] => [
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

const initialGameState: GameState = {
  board: createInitialBoard(),
  currentPlayer: 'X',
  winner: null,
  isDraw: false,
  moves: [],
  moveCount: 0,
};

const initialInfinityState: InfinityGameState = {
  ...initialGameState,
  maxPieces: 6,
  oldestMoveIndex: 0,
  nextToRemove: undefined,
};

const createInitialGameState = (mode: GameMode): ExtendedGameState => {
  switch (mode) {
    case 'infinity':
      return {
        ...initialGameState,
        maxPieces: 6,
        oldestMoveIndex: 0,
        nextToRemove: undefined,
      } as InfinityGameState;

    case 'bigBoard':
      return {
        ...initialGameState,
        board: createBigBoard(4),
        boardSize: 4,
        winCondition: 4,
      } as BigBoardGameState;

    case 'blind':
      return {
        ...initialGameState,
        hiddenMoves: [],
        hideDelay: 3000,
      } as BlindGameState;

    case 'survival':
      return {
        ...initialGameState,
        lives: 3,
        maxLives: 3,
        consecutiveWins: 0,
      } as SurvivalGameState;

    case 'blitz':
      return {
        ...initialGameState,
        timePerMove: 3, // Default 3 seconds per move
        currentTurnStartTime: Date.now(),
        timeRemaining: 3,
        timedOut: false,
        timedOutPlayer: null,
      } as BlitzGameState;

    case 'reverse':
      // Reverse mode uses standard board but inverted win logic
      // (whoever makes 3 in a line LOSES)
      return {
        ...initialGameState,
      } as ReverseGameState;

    case 'bomb': {
      const bomb = pickRandomBombCell(initialGameState.board, null);
      return {
        ...initialGameState,
        bombRow: bomb.row,
        bombCol: bomb.col,
        lastExplosion: undefined,
        explosionCount: 0,
      } as BombGameState;
    }

    case 'mirror':
      return {
        ...initialGameState,
        lastMirrorCell: undefined,
      } as MirrorGameState;

    case 'mad':
      return {
        ...initialGameState,
        movesUntilMutation: MAD_MOVES_PER_MUTATION,
        lastMutation: undefined,
        frozenCell: undefined,
        frozenTurnsLeft: 0,
        mutationCount: 0,
      } as MadGameState;

    case 'gobble':
      return {
        ...initialGameState,
        cellSizes: [
          [null, null, null],
          [null, null, null],
          [null, null, null],
        ],
        piecesLeft: {
          X: { 1: 2, 2: 2, 3: 2 },
          O: { 1: 2, 2: 2, 3: 2 },
        },
        selectedSize: 1,
        lastGobble: undefined,
      } as GobbleGameState;

    default:
      return { ...initialGameState };
  }
};

/** Moves between mutations in Mad mode. */
const MAD_MOVES_PER_MUTATION = 3;
/** Turns a frozen cell stays blocked in Mad mode. */
const MAD_FREEZE_TURNS = 2;

/** Rotates a square board 90° clockwise. */
const rotateBoard = (board: Cell[][]): Cell[][] => {
  const size = board.length;
  const out: Cell[][] = Array.from({ length: size }, () => Array(size).fill(null));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      out[c][size - 1 - r] = board[r][c];
    }
  }
  return out;
};

/**
 * Applies one random Mad-mode mutation to the board.
 * Returns the new board plus which mutation ran (and the frozen cell, if any).
 */
const applyMadMutation = (
  board: Cell[][]
): { board: Cell[][]; type: MadMutationType; frozenCell?: { row: number; col: number } } => {
  const size = board.length;

  const occupied: { row: number; col: number }[] = [];
  const empty: { row: number; col: number }[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c]) occupied.push({ row: r, col: c });
      else empty.push({ row: r, col: c });
    }
  }

  // Only offer mutations that can actually do something right now
  const options: MadMutationType[] = ['rotate'];
  const xCells = occupied.filter(p => board[p.row][p.col] === 'X');
  const oCells = occupied.filter(p => board[p.row][p.col] === 'O');
  if (xCells.length > 0 && oCells.length > 0) options.push('swap');
  if (empty.length > 1) options.push('freeze');

  const type = options[Math.floor(Math.random() * options.length)];

  if (type === 'rotate') {
    return { board: rotateBoard(board), type };
  }

  if (type === 'swap') {
    const a = xCells[Math.floor(Math.random() * xCells.length)];
    const b = oCells[Math.floor(Math.random() * oCells.length)];
    const next = board.map(row => [...row]);
    const tmp = next[a.row][a.col];
    next[a.row][a.col] = next[b.row][b.col];
    next[b.row][b.col] = tmp;
    return { board: next, type };
  }

  // freeze
  const target = empty[Math.floor(Math.random() * empty.length)];
  return { board: board.map(row => [...row]), type, frozenCell: target };
};

/**
 * Picks a random empty cell to hide the bomb in. Never reuses `avoid` (the cell
 * that just exploded) so the same square can't blow up twice in a row.
 * Returns {row:-1,col:-1} when there is nowhere left to hide it.
 */
const pickRandomBombCell = (
  board: Cell[][],
  avoid: { row: number; col: number } | null
): { row: number; col: number } => {
  const candidates: { row: number; col: number }[] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] !== null) continue;
      if (avoid && avoid.row === r && avoid.col === c) continue;
      candidates.push({ row: r, col: c });
    }
  }
  if (candidates.length === 0) return { row: -1, col: -1 };
  return candidates[Math.floor(Math.random() * candidates.length)];
};

const initialGameConfig: GameConfig = {
  mode: 'classic',
  opponent: 'human',
  difficulty: 'mediano',
  soundEnabled: true,
  hapticsEnabled: true,
  theme: 'dark',
  language: 'pt',
};

const initialGameStats: GameStats = {
  playerX: { wins: 0, losses: 0, draws: 0 },
  playerO: { wins: 0, losses: 0, draws: 0 },
  totalGames: 0,
  currentStreak: 0,
  bestStreak: 0,
};

// Action types
type GameAction =
  | { type: 'MAKE_MOVE'; payload: { row: number; col: number; gravityFinalRow?: number; expectedPlayer?: Player; forcedPlayer?: Player } }
  | { type: 'RESTART_GAME' }
  | { type: 'NEW_ROUND' }
  | { type: 'SET_MODE'; payload: GameMode }
  | { type: 'SET_OPPONENT'; payload: OpponentType }
  | { type: 'SET_DIFFICULTY'; payload: Difficulty }
  | { type: 'SET_CONFIG'; payload: Partial<GameConfig> }
  | { type: 'UPDATE_STATS'; payload: Partial<GameStats> }
  | { type: 'RESET_STATS' }
  | { type: 'CLEAR_STATS_STORAGE' }
  | { type: 'SET_WINNER'; payload: Player | null }
  | { type: 'SET_DRAW'; payload: boolean }
  | { type: 'REMOVE_OLDEST_MOVE' }
  | { type: 'SET_AI_THINKING'; payload: boolean }
  | { type: 'SET_TROLL_MESSAGE'; payload: string | null }
  | { type: 'UPDATE_SURVIVAL_STATS'; payload: { lives?: number; consecutiveWins?: number } }
  | { type: 'LOAD_STORED_DATA'; payload: { config: GameConfig; stats: GameStats } }
  | { type: 'BLITZ_TIMEOUT'; payload: { player: Player } }
  | { type: 'SET_BLITZ_TIME'; payload: number }
  | { type: 'COMPLETE_GRAVITY_FALL' }
  | { type: 'SELECT_GOBBLE_SIZE'; payload: GobbleSize }
  | { type: 'UNDO_LAST_MOVES' } // Undo last human move + AI response
  | { type: 'BLITZ_ADD_TIME'; payload: number }; // Add seconds to current turn

interface GameContextValue {
  gameState: ExtendedGameState;
  gameConfig: GameConfig;
  gameStats: GameStats;
  makeMove: (row: number, col: number, gravityFinalRow?: number) => void;
  restartGame: () => void;
  newRound: () => void;
  setGameMode: (mode: GameMode) => void;
  setOpponent: (opponent: OpponentType) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  updateConfig: (config: Partial<GameConfig>) => void;
  updateGameStats: (winner: Player | null, isDraw: boolean) => void;
  resetStats: () => Promise<void>;
  playSound: (soundType: 'click' | 'win' | 'draw' | 'error' | 'remove' | 'button' | 'lose') => void;
  triggerHaptics: (type: 'light' | 'medium' | 'heavy') => void;
  checkWinner: () => WinningLine | null;
  isInfinityMode: boolean;
  gameMode: GameMode;
  isAIThinking: boolean;
  makeAIMove: () => Promise<void>;
  trollMessage: string | null;
  clearTrollMessage: () => void;
  // Blitz mode functions
  handleBlitzTimeout: (player: Player) => void;
  setBlitzTime: (seconds: number) => void;
  // Gravity mode functions
  completeGravityFall: () => void;
  // Boost: undo & time
  undoLastMoves: () => void;
  addBlitzTime: (seconds: number) => void;
  selectGobbleSize: (size: GobbleSize) => void;
  /** What the round that just ended paid out, or null before any result. */
  lastRewards: GameRewards | null;
  clearLastRewards: () => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

// Game logic utilities - use dynamic versions from gameLogic.ts
// checkWin and isFull are already imported above from gameLogic
// These local aliases maintain compatibility with the rest of the file
const checkWinCondition = (board: Cell[][], winLength: number = 3): WinningLine | null => {
  return checkWin(board, winLength);
};

const isBoardFull = (board: Cell[][]): boolean => {
  return isFull(board);
};

// Reducer
const gameReducer = (
  state: { game: ExtendedGameState; config: GameConfig; stats: GameStats; isAIThinking: boolean; trollMessage: string | null },
  action: GameAction
): { game: ExtendedGameState; config: GameConfig; stats: GameStats; isAIThinking: boolean; trollMessage: string | null } => {
  switch (action.type) {
    case 'MAKE_MOVE': {
      const { row, col, gravityFinalRow: presetGravityRow, expectedPlayer, forcedPlayer } = action.payload;
      const game = state.game;
      const { mode } = state.config;

      // Never accept a move into a finished game (e.g. a tap that was in flight
      // when a Blitz timeout ended the game would otherwise recompute the winner).
      if (game.winner || (game as any).isDraw) {
        return state;
      }

      // Gravity: reject input while a fall animation is in progress. Without this,
      // a second tap (or the AI) mid-fall overwrites pendingFall — the falling
      // sprite unmounts mid-air and completions land on the wrong piece.
      if (mode === 'gravity' && (game as GravityGameState).pendingFall?.isAnimating) {
        return state;
      }

      // Hard guard: if the dispatcher specified which player should be moving
      // (e.g. AI passes expectedPlayer='O'), refuse to act when the live state
      // disagrees. Without this, a stale callback or remount race could let the
      // AI place the human's piece.
      if (expectedPlayer && game.currentPlayer !== expectedPlayer) {
        return state;
      }

      // The piece player to place: if forcedPlayer was supplied (AI ALWAYS
      // forces 'O'), use that instead of game.currentPlayer. This is the
      // bulletproof guard: even if every other check somehow misfired, the
      // AI will never place anything but its own 'O' piece.
      const placingPlayer: Player = forcedPlayer || game.currentPlayer;

      // BOMB MODE: stepping on the hidden mine destroys the piece and costs the
      // turn. The board is unchanged, the bomb moves elsewhere, and the move is
      // NOT recorded in `moves` (no piece was ever placed).
      if (mode === 'bomb') {
        const bombGame = game as BombGameState;
        if (game.board[row][col] !== null) {
          return state; // occupied
        }
        if (row === bombGame.bombRow && col === bombGame.bombCol) {
          const relocated = pickRandomBombCell(game.board, { row, col });
          return {
            ...state,
            game: {
              ...bombGame,
              // turn passes to the opponent — the mine cost you your move
              currentPlayer: placingPlayer === 'X' ? 'O' : 'X',
              bombRow: relocated.row,
              bombCol: relocated.col,
              lastExplosion: { row, col, player: placingPlayer },
              explosionCount: (bombGame.explosionCount || 0) + 1,
            } as BombGameState,
          };
        }
      }

      // MAD MODE: a frozen cell is temporarily unplayable
      if (mode === 'mad') {
        const madGame = game as MadGameState;
        if (
          madGame.frozenTurnsLeft > 0 &&
          madGame.frozenCell &&
          madGame.frozenCell.row === row &&
          madGame.frozenCell.col === col
        ) {
          return state;
        }
      }

      // GOBBLE MODE: a piece may go on an empty cell or swallow a SMALLER one,
      // and only if the player still has that size in hand.
      let gobbleSize: GobbleSize | null = null;
      if (mode === 'gobble') {
        const gob = game as GobbleGameState;
        const size = gob.selectedSize;
        if ((gob.piecesLeft[placingPlayer]?.[size] || 0) <= 0) {
          return state; // none of that size left
        }
        const occupantSize = gob.cellSizes[row][col];
        if (occupantSize !== null && occupantSize >= size) {
          return state; // can only cover something strictly smaller
        }
        // Covering your own piece is allowed (it hides it), same as Gobblet
        gobbleSize = size;
      }

      let actualRow = row;
      let actualCol = col;
      let newBoard: Cell[][];
      let gravityWillFall = false; // Track gravity decision for later use
      let gravityLowestRow = row; // Track where piece will fall to

      // Handle different game modes
      if (mode === 'gravity') {
        // Gravity mode: Piece appears at clicked position first, then may fall with animation
        if (game.board[row][col] !== null) {
          return state; // Cell is occupied
        }

        newBoard = game.board.map(r => [...r]);

        // Check if piece will fall (40% chance and there's space below)
        let lowestEmptyRow = row;
        const boardSize = game.board.length;

        // Find the lowest empty position below the clicked cell
        for (let r = row + 1; r < boardSize; r++) {
          if (game.board[r][col] === null) {
            lowestEmptyRow = r;
          } else {
            break; // Stop at first occupied cell
          }
        }

        // Use pre-determined gravity result if provided (online sync), otherwise randomize
        if (presetGravityRow !== undefined) {
          gravityWillFall = presetGravityRow >= 0 && presetGravityRow !== row;
          gravityLowestRow = presetGravityRow >= 0 ? presetGravityRow : row;
        } else {
          // Determine if gravity effect triggers (40% chance if there's space below)
          gravityWillFall = lowestEmptyRow > row && Math.random() < 0.4;
          gravityLowestRow = lowestEmptyRow;
        }

        // IMPORTANT: Always place the piece at the CLICKED position first
        // The animation will visually show the fall, then COMPLETE_GRAVITY_FALL
        // will move it to the final position
        newBoard[row][col] = placingPlayer;
        actualRow = row; // Initially at clicked position
        actualCol = col;

        if (gravityWillFall) {
          console.log(`🪐 Gravity! Piece appears at (${row}, ${col}), will animate fall to (${lowestEmptyRow}, ${col})`);
        }
      } else {
        // Standard modes - check if cell is occupied.
        // Gobble is the exception: covering a smaller piece is the whole point,
        // and its own legality check ran above.
        if (mode !== 'gobble' && game.board[row][col] !== null) {
          return state;
        }
        newBoard = game.board.map(r => [...r]);
        newBoard[row][col] = placingPlayer;
      }

      // MIRROR MODE: the placement is echoed on the point-symmetric cell when
      // that cell is free. The center cell maps onto itself, so it never echoes.
      let mirrorPlacement: { row: number; col: number } | undefined;
      if (mode === 'mirror') {
        const size = newBoard.length;
        const mRow = size - 1 - row;
        const mCol = size - 1 - col;
        if (!(mRow === row && mCol === col) && newBoard[mRow][mCol] === null) {
          newBoard[mRow][mCol] = placingPlayer;
          mirrorPlacement = { row: mRow, col: mCol };
        }
      }

      const newMove: GameMove = {
        row: actualRow,
        col: actualCol,
        player: placingPlayer,
        moveNumber: game.moveCount + 1,
      };

      // The mirrored piece is recorded as its own move so replay, draw
      // detection and moveCount all stay consistent with the board.
      const mirrorMove: GameMove | null = mirrorPlacement
        ? {
            row: mirrorPlacement.row,
            col: mirrorPlacement.col,
            player: placingPlayer,
            moveNumber: game.moveCount + 2,
          }
        : null;

      const newMoves = mirrorMove
        ? [...game.moves, newMove, mirrorMove]
        : [...game.moves, newMove];
      const newMoveCount = game.moveCount + (mirrorMove ? 2 : 1);

      // Determine board size and win condition based on mode
      let winLength = 3;
      if (mode === 'bigBoard') {
        const bigBoardGame = game as BigBoardGameState;
        winLength = bigBoardGame.winCondition || 4;
      }

      // For infinity mode, we need to handle piece removal BEFORE checking winner
      let finalBoard = newBoard;
      let finalWinner = null;
      let finalIsDraw = false;

      if (state.config.mode === 'infinity') {
        const currentInfinityState = game as InfinityGameState;
        const maxPieces = 6;
        const oldestMoveIndex = currentInfinityState.oldestMoveIndex || 0;

        // RULE: check for a win BEFORE removing the oldest piece. The removed
        // piece is always the mover's own — removing first meant a 3-in-a-row
        // completed through your oldest piece silently evaporated in the same
        // dispatch ("the game ignored my win"). If the placement wins, the game
        // is over and no removal happens.
        finalWinner = checkWin(newBoard, winLength);

        if (!finalWinner && newMoveCount > maxPieces) {
          const moveToRemove = newMoves[oldestMoveIndex];

          if (moveToRemove) {
            console.log(`🎮 Infinity Mode: Removing piece at (${moveToRemove.row}, ${moveToRemove.col}) - Move #${moveToRemove.moveNumber}`);

            // Remove the oldest move from the board
            const boardAfterRemoval = newBoard.map(row => [...row]);
            boardAfterRemoval[moveToRemove.row][moveToRemove.col] = null;
            finalBoard = boardAfterRemoval;
          }
        }

        // Infinity mode never has draws
        finalIsDraw = false;
      } else if (state.config.mode === 'reverse') {
        // Reverse mode: whoever makes 3 in a line LOSES
        // So we check if the CURRENT player made 3 in line
        // If they did, the OPPONENT wins
        finalWinner = checkWin(newBoard, winLength);
        finalIsDraw = !finalWinner && isFull(newBoard);
      } else {
        // For other modes, check winner normally
        finalWinner = checkWin(newBoard, winLength);
        finalIsDraw = !finalWinner && isFull(newBoard);
      }

      // Determine the actual winner based on mode
      let actualWinner: Player | null = null;
      if (finalWinner) {
        if (state.config.mode === 'reverse') {
          // In Reverse mode, the player who made 3 in line LOSES
          // So the opponent wins
          actualWinner = placingPlayer === 'X' ? 'O' : 'X';
          console.log(`🔄 Reverse Mode: ${placingPlayer} made 3 in line and LOSES! ${actualWinner} wins!`);
        } else {
          // Normal modes: the player who just placed wins
          actualWinner = placingPlayer;
        }
      }

      let updatedGame: ExtendedGameState = {
        ...game,
        board: finalBoard,
        currentPlayer: placingPlayer === 'X' ? 'O' : 'X',
        moves: newMoves,
        moveCount: newMoveCount,
        winner: actualWinner,
        isDraw: finalIsDraw,
      };

      // Bomb mode: a piece landed safely — clear the previous explosion marker
      // and make sure the mine is never sitting under an occupied cell.
      if (state.config.mode === 'bomb') {
        const bombGame = updatedGame as BombGameState;
        const prev = game as BombGameState;
        bombGame.explosionCount = prev.explosionCount || 0;
        bombGame.lastExplosion = undefined;
        const bombStillValid =
          prev.bombRow >= 0 &&
          prev.bombCol >= 0 &&
          finalBoard[prev.bombRow]?.[prev.bombCol] === null;
        if (bombStillValid) {
          bombGame.bombRow = prev.bombRow;
          bombGame.bombCol = prev.bombCol;
        } else {
          const relocated = pickRandomBombCell(finalBoard, null);
          bombGame.bombRow = relocated.row;
          bombGame.bombCol = relocated.col;
        }
        updatedGame = bombGame;
      }

      // Mirror mode: remember the echoed cell so the UI can flash it
      if (state.config.mode === 'mirror') {
        const mirrorGame = updatedGame as MirrorGameState;
        mirrorGame.lastMirrorCell = mirrorPlacement;
        updatedGame = mirrorGame;
      }

      // GOBBLE: consume the piece, record its size, and decide the draw by
      // "the next player has no legal move" instead of "the board is full"
      // (a full board is still playable while smaller pieces can be swallowed).
      if (state.config.mode === 'gobble' && gobbleSize) {
        const prev = game as GobbleGameState;
        const gob = updatedGame as GobbleGameState;

        gob.cellSizes = prev.cellSizes.map(r => [...r]);
        gob.cellSizes[actualRow][actualCol] = gobbleSize;

        gob.piecesLeft = {
          X: { ...prev.piecesLeft.X },
          O: { ...prev.piecesLeft.O },
        };
        gob.piecesLeft[placingPlayer][gobbleSize] -= 1;
        gob.lastGobble = prev.board[actualRow][actualCol] ? { row: actualRow, col: actualCol } : undefined;

        const nextPlayer: Player = placingPlayer === 'X' ? 'O' : 'X';
        // Auto-select the next player's smallest available size
        const available = ([1, 2, 3] as GobbleSize[]).filter(s => gob.piecesLeft[nextPlayer][s] > 0);
        gob.selectedSize = available[0] ?? 1;

        if (!actualWinner) {
          const canMove = available.some(size =>
            gob.cellSizes.some((rowSizes, r) =>
              rowSizes.some((occupant, c) => occupant === null || occupant < size)
            )
          );
          gob.isDraw = !canMove;
          finalIsDraw = !canMove;
        } else {
          gob.isDraw = false;
        }

        updatedGame = gob;
      }

      // MAD MODE: count down to the next mutation and apply it
      if (state.config.mode === 'mad') {
        const prev = game as MadGameState;
        const mad = updatedGame as MadGameState;

        // Tick down the freeze from the previous mutation
        mad.frozenTurnsLeft = Math.max(0, (prev.frozenTurnsLeft || 0) - 1);
        mad.frozenCell = mad.frozenTurnsLeft > 0 ? prev.frozenCell : undefined;
        mad.mutationCount = prev.mutationCount || 0;
        mad.lastMutation = prev.lastMutation;

        const remaining = (prev.movesUntilMutation || MAD_MOVES_PER_MUTATION) - 1;

        // Never mutate a finished game — it could erase the winning line
        if (remaining <= 0 && !actualWinner && !finalIsDraw) {
          const mutation = applyMadMutation(mad.board);
          mad.board = mutation.board;
          mad.mutationCount += 1;
          mad.lastMutation = { type: mutation.type, id: mad.mutationCount };
          mad.movesUntilMutation = MAD_MOVES_PER_MUTATION;

          if (mutation.frozenCell) {
            mad.frozenCell = mutation.frozenCell;
            mad.frozenTurnsLeft = MAD_FREEZE_TURNS;
          }

          // A swap can create a line for EITHER player, so re-check and credit
          // the line's real owner rather than whoever just moved.
          const mutatedLine = checkWin(mad.board, winLength);
          if (mutatedLine) {
            const owner = mad.board[mutatedLine.cells[0].row][mutatedLine.cells[0].col];
            if (owner) {
              mad.winner = owner;
            }
          } else if (isFull(mad.board)) {
            mad.isDraw = true;
          }
        } else {
          mad.movesUntilMutation = Math.max(1, remaining);
        }

        updatedGame = mad;
      }

      // Handle Blitz mode - reset timer for next player
      if (state.config.mode === 'blitz' && !actualWinner && !finalIsDraw) {
        const blitzGame = updatedGame as BlitzGameState;
        blitzGame.currentTurnStartTime = Date.now();
        blitzGame.timeRemaining = blitzGame.timePerMove;
        updatedGame = blitzGame;
      }

      // Update infinity mode specific state
      if (state.config.mode === 'infinity') {
        const infinityGame = updatedGame as unknown as InfinityGameState;
        const currentInfinityState = game as InfinityGameState;

        infinityGame.maxPieces = 6;
        infinityGame.oldestMoveIndex = currentInfinityState.oldestMoveIndex || 0;

        // Advance oldestMoveIndex ONLY if a removal actually happened this
        // dispatch (no removal happens on a winning placement — see above).
        if (!finalWinner && newMoveCount > infinityGame.maxPieces) {
          infinityGame.oldestMoveIndex += 1;
        }

        // nextToRemove = the piece that will disappear on the NEXT placement.
        // Warn as soon as the board is full (6 pieces) — previously this was
        // only set from move 7 on, one move too late for the UI to warn.
        if (!finalWinner && newMoveCount >= infinityGame.maxPieces && infinityGame.oldestMoveIndex < newMoves.length) {
          infinityGame.nextToRemove = newMoves[infinityGame.oldestMoveIndex];
        } else {
          infinityGame.nextToRemove = undefined;
        }

        updatedGame = infinityGame;
      }

      // Handle Blind mode logic
      if (state.config.mode === 'blind') {
        const blindGame = updatedGame as BlindGameState;
        blindGame.hiddenMoves = [...blindGame.hiddenMoves];

        // Hide moves older than 2 moves (keep only last move from each player visible)
        const playerXMoves = blindGame.moves.filter(m => m.player === 'X');
        const playerOMoves = blindGame.moves.filter(m => m.player === 'O');

        // Mark moves to hide (all except the last one from each player)
        const movesToHide = [
          ...playerXMoves.slice(0, -1),
          ...playerOMoves.slice(0, -1)
        ];

        blindGame.hiddenMoves = movesToHide;
        blindGame.lastVisibleMove = newMove;

        updatedGame = blindGame;
      }

      // Handle Gravity mode pendingFall animation
      if (state.config.mode === 'gravity') {
        const gravityGame = updatedGame as GravityGameState;
        const originalRow = action.payload.row;

        // Use the already-calculated gravity decision from above
        if (gravityWillFall) {
          gravityGame.pendingFall = {
            player: newMove.player,
            col: actualCol,
            startRow: originalRow,
            endRow: gravityLowestRow,
            isAnimating: true,
          };
          console.log(`🪐 Gravity animation pending: piece at (${originalRow}, ${actualCol}) will fall to (${gravityLowestRow}, ${actualCol})`);
        } else {
          gravityGame.pendingFall = undefined;
        }

        updatedGame = gravityGame;
      }

      return {
        ...state,
        game: updatedGame,
      };
    }

    case 'RESTART_GAME': {
      const newGameState = createInitialGameState(state.config.mode);

      // Preserve Blitz timePerMove setting
      if (state.config.mode === 'blitz') {
        const currentBlitzState = state.game as BlitzGameState;
        const newBlitzState = newGameState as BlitzGameState;
        newBlitzState.timePerMove = currentBlitzState.timePerMove;
        newBlitzState.timeRemaining = currentBlitzState.timePerMove;
        newBlitzState.currentTurnStartTime = Date.now();
      }

      return {
        ...state,
        game: newGameState,
      };
    }

    case 'NEW_ROUND': {
      const newGameState = createInitialGameState(state.config.mode);

      // Preserve Blitz timePerMove setting
      if (state.config.mode === 'blitz') {
        const currentBlitzState = state.game as BlitzGameState;
        const newBlitzState = newGameState as BlitzGameState;
        newBlitzState.timePerMove = currentBlitzState.timePerMove;
        newBlitzState.timeRemaining = currentBlitzState.timePerMove;
        newBlitzState.currentTurnStartTime = Date.now();
      }

      return {
        ...state,
        game: newGameState,
      };
    }

    case 'SET_MODE':
      return {
        ...state,
        config: { ...state.config, mode: action.payload },
        game: createInitialGameState(action.payload),
      };

    case 'SET_DIFFICULTY':
      return {
        ...state,
        config: { ...state.config, difficulty: action.payload },
        game: createInitialGameState(state.config.mode), // Reset game when difficulty changes
      };

    case 'SET_OPPONENT':
      return {
        ...state,
        config: { ...state.config, opponent: action.payload },
        game: createInitialGameState(state.config.mode), // Reset game when opponent changes
      };

    case 'SET_CONFIG':
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      };

    case 'UPDATE_STATS':
      return {
        ...state,
        stats: { ...state.stats, ...action.payload },
      };

    case 'RESET_STATS':
      return {
        ...state,
        stats: { ...initialGameStats },
      };

    case 'CLEAR_STATS_STORAGE':
      // This case is just for side effects, state doesn't change
      return state;

    case 'SET_AI_THINKING':
      return {
        ...state,
        isAIThinking: action.payload,
      };

    case 'SET_TROLL_MESSAGE':
      return {
        ...state,
        trollMessage: action.payload,
      };


    case 'UPDATE_SURVIVAL_STATS': {
      if (state.config.mode === 'survival') {
        const survivalGame = state.game as SurvivalGameState;
        return {
          ...state,
          game: {
            ...survivalGame,
            lives: action.payload.lives !== undefined ? action.payload.lives : survivalGame.lives,
            consecutiveWins: action.payload.consecutiveWins !== undefined ? action.payload.consecutiveWins : survivalGame.consecutiveWins,
          },
        };
      }
      return state;
    }


    case 'LOAD_STORED_DATA': {
      // The stored config carries `mode`, so restoring it used to leave the
      // config saying (say) "gobble" while `game` was still the default classic
      // state. GameScreen renders once BEFORE its mount effect dispatches
      // SET_MODE, and that first render reads mode from the config — so it
      // reached into a gobble-only field (`piecesLeft`) on a classic state and
      // threw, closing the app. Rebuild the board for the restored mode so the
      // two can never disagree.
      const restoredConfig = action.payload.config;
      const needsRebuild = restoredConfig.mode !== state.config.mode;
      return {
        ...state,
        config: restoredConfig,
        stats: action.payload.stats,
        game: needsRebuild ? createInitialGameState(restoredConfig.mode) : state.game,
      };
    }

    case 'BLITZ_TIMEOUT': {
      // Player ran out of time - they lose, opponent wins
      if (state.config.mode === 'blitz') {
        const blitzGame = state.game as BlitzGameState;
        const winner = action.payload.player === 'X' ? 'O' : 'X';
        console.log(`⏱️ Blitz Mode: ${action.payload.player} ran out of time! ${winner} wins!`);
        return {
          ...state,
          game: {
            ...blitzGame,
            winner: winner,
            timedOut: true,
            timedOutPlayer: action.payload.player,
          },
        };
      }
      return state;
    }

    case 'SET_BLITZ_TIME': {
      // Set the time per move for blitz mode (1-5 seconds)
      if (state.config.mode === 'blitz') {
        const blitzGame = state.game as BlitzGameState;
        const time = Math.max(1, Math.min(5, action.payload)); // Clamp between 1-5
        return {
          ...state,
          game: {
            ...blitzGame,
            timePerMove: time,
            timeRemaining: time,
            currentTurnStartTime: Date.now(),
          },
        };
      }
      return state;
    }

    case 'SELECT_GOBBLE_SIZE': {
      if (state.config.mode !== 'gobble') return state;
      const gob = state.game as GobbleGameState;
      // Can't select a size you have none of
      if ((gob.piecesLeft[gob.currentPlayer]?.[action.payload] || 0) <= 0) {
        return state;
      }
      return {
        ...state,
        game: { ...gob, selectedSize: action.payload } as GobbleGameState,
      };
    }

    case 'COMPLETE_GRAVITY_FALL': {
      // Complete the gravity fall: move piece from startRow to endRow
      if (state.config.mode === 'gravity') {
        const gravityGame = state.game as GravityGameState;
        const pendingFall = gravityGame.pendingFall;

        if (pendingFall && pendingFall.isAnimating) {
          // Move the piece from startRow to endRow
          const newBoard = gravityGame.board.map(r => [...r]);
          const { startRow, endRow, col, player } = pendingFall;

          // Remove from start position
          newBoard[startRow][col] = null;
          // Place at end position
          newBoard[endRow][col] = player;

          console.log(`🪐 Gravity fall complete: piece moved from (${startRow}, ${col}) to (${endRow}, ${col})`);

          // Check for winner after the fall completes. Gravity is 3x3 only.
          const winner = checkWin(newBoard, 3);
          const isDraw = !winner && isFull(newBoard);

          // Update moves array with correct final position
          const updatedMoves = gravityGame.moves.map((move, index) => {
            if (index === gravityGame.moves.length - 1 && move.col === col && move.row === startRow) {
              return { ...move, row: endRow };
            }
            return move;
          });

          return {
            ...state,
            game: {
              ...gravityGame,
              board: newBoard,
              moves: updatedMoves,
              pendingFall: undefined,
              winner: winner ? player : gravityGame.winner,
              isDraw: isDraw,
            },
          };
        }

        return {
          ...state,
          game: {
            ...gravityGame,
            pendingFall: undefined,
          },
        };
      }
      return state;
    }

    case 'BLITZ_ADD_TIME': {
      if (state.config.mode === 'blitz') {
        const blitzGame = state.game as BlitzGameState;
        return {
          ...state,
          game: {
            ...blitzGame,
            timeRemaining: blitzGame.timeRemaining + action.payload,
            currentTurnStartTime: Date.now(), // Reset start so timer recalculates
          },
        };
      }
      return state;
    }

    case 'UNDO_LAST_MOVES': {
      const game = state.game;
      if (game.moves.length === 0 || game.winner || (game as any).isDraw) return state;

      // In AI mode: undo 2 moves (human + AI), or 1 if AI hasn't moved yet
      const isAI = state.config.opponent === 'ai';
      const movesToUndo = isAI && game.currentPlayer === 'X' && game.moves.length >= 2 ? 2 : 1;

      const newMoves = game.moves.slice(0, -movesToUndo);
      const newMoveCount = game.moveCount - movesToUndo;

      // Infinity mode: only the last `maxPieces` moves are actually on the
      // board. Rebuilding from ALL moves would resurrect removed pieces and
      // leave oldestMoveIndex pointing past reality (7-piece ghost boards).
      const isInfinity = state.config.mode === 'infinity';
      const maxPieces = 6;
      const newOldestIndex = isInfinity ? Math.max(0, newMoves.length - maxPieces) : 0;
      const liveMoves = isInfinity ? newMoves.slice(newOldestIndex) : newMoves;

      // Rebuild board from scratch (live pieces only)
      const size = game.board.length;
      const freshBoard: Cell[][] = Array(size).fill(null).map(() => Array(size).fill(null));
      for (const move of liveMoves) {
        freshBoard[move.row][move.col] = move.player;
      }

      // Determine whose turn it is (from the full history, not the live window)
      const xMoves = newMoves.filter(m => m.player === 'X').length;
      const oMoves = newMoves.filter(m => m.player === 'O').length;
      const currentPlayer: Player = xMoves <= oMoves ? 'X' : 'O';

      const undoneGame: ExtendedGameState = {
        ...game,
        board: freshBoard,
        moves: newMoves,
        moveCount: newMoveCount,
        currentPlayer,
        winner: null,
        isDraw: false,
      };

      if (isInfinity) {
        const inf = undoneGame as unknown as InfinityGameState;
        inf.oldestMoveIndex = newOldestIndex;
        inf.nextToRemove = newMoves.length >= maxPieces ? newMoves[newOldestIndex] : undefined;
      }

      return {
        ...state,
        game: undoneGame,
      };
    }

    default:
      return state;
  }
};

// Provider component
export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, {
    game: initialGameState,
    config: initialGameConfig,
    stats: initialGameStats,
    isAIThinking: false,
    trollMessage: null,
  });

  // Payout of the round that just ended, read by the end-of-game modal.
  // Cleared when a new round starts so a modal can never show stale numbers.
  const [lastRewards, setLastRewards] = React.useState<GameRewards | null>(null);

  const [aiPlayer] = React.useState(() => new AIPlayer());

  // Load stored data and initialize sound system on app start
  // True once the stored config/stats have been read back. Until then the save
  // effects below must not write: they run on mount with the DEFAULT state, and
  // AsyncStorage serialises operations, so those writes would land before the
  // read and the load would return the defaults it just wrote — silently
  // erasing the player's theme, language and lifetime stats on every cold start.
  const hasLoadedStoredData = React.useRef(false);

  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // Read persisted state FIRST, before any slow initialisation, so the
        // save effects stay blocked for as short a time as possible.
        const [storedConfig, storedStats] = await Promise.all([
          AsyncStorage.getItem('@game_config'),
          AsyncStorage.getItem('@game_stats'),
        ]);

        if (storedConfig || storedStats) {
          dispatch({
            type: 'LOAD_STORED_DATA',
            payload: {
              // Merge over defaults so state saved by older versions still gets
              // any fields added since (e.g. a new config flag reads undefined).
              config: storedConfig
                ? { ...initialGameConfig, ...JSON.parse(storedConfig) }
                : initialGameConfig,
              stats: storedStats
                ? { ...initialGameStats, ...JSON.parse(storedStats) }
                : initialGameStats,
            },
          });
        }
      } catch (error) {
        console.error('Error loading stored data:', error);
      } finally {
        // Unblock persistence even if the read failed, otherwise the session's
        // progress would never be saved at all.
        hasLoadedStoredData.current = true;
      }

      try {
        await SoundUtils.preloadSounds();
      } catch (error) {
        console.error('Error preloading sounds:', error);
      }
    };

    initializeApp();

    // Cleanup sound system on unmount
    return () => {
      SoundUtils.cleanup();
    };
  }, []);

  // Save config and stats when they change (never before the load completes)
  React.useEffect(() => {
    if (!hasLoadedStoredData.current) return;
    AsyncStorage.setItem('@game_config', JSON.stringify(state.config));
  }, [state.config]);

  React.useEffect(() => {
    if (!hasLoadedStoredData.current) return;
    AsyncStorage.setItem('@game_stats', JSON.stringify(state.stats));
  }, [state.stats]);

  // Update AI difficulty when config changes
  React.useEffect(() => {
    if (state.config.difficulty) {
      aiPlayer.setDifficulty(state.config.difficulty);

      // Set up troll message callback
      if (state.config.difficulty === 'troll') {
        aiPlayer.setTrollMessageCallback((message: string) => {
          dispatch({ type: 'SET_TROLL_MESSAGE', payload: message });

          // Auto clear message after 3 seconds
          setTimeout(() => {
            dispatch({ type: 'SET_TROLL_MESSAGE', payload: null });
          }, 3000);
        });
      }
    }
  }, [state.config.difficulty, aiPlayer]);

  const makeMove = useCallback((row: number, col: number, gravityFinalRow?: number) => {
    dispatch({ type: 'MAKE_MOVE', payload: { row, col, gravityFinalRow } });
  }, []);

  const makeAIMove = useCallback(async () => {
    if (state.config.opponent !== 'ai' || state.game.winner || (state.game as any).isDraw || state.isAIThinking) {
      return;
    }

    // CRITICAL guard: only let the AI move when it is genuinely O's turn.
    // Without this, a stale callback fired from a remount (e.g. tournament
    // round transition via navigation.replace) could dispatch MAKE_MOVE while
    // currentPlayer is still 'X', causing the AI to "place the player's piece".
    if (state.game.currentPlayer !== 'O') {
      return;
    }

    dispatch({ type: 'SET_AI_THINKING', payload: true });

    try {
      // Simulate thinking time
      await aiPlayer.simulateThinking();

      // Re-check after the await — state may have advanced while we were thinking.
      // (Defensive: never let AI complete a move on the wrong player's turn.)
      if (state.game.currentPlayer !== 'O') {
        dispatch({ type: 'SET_AI_THINKING', payload: false });
        return;
      }

      // Determine win length for BigBoard mode
      let aiWinLength = 3;
      if (state.config.mode === 'bigBoard') {
        const bigBoardGame = state.game as BigBoardGameState;
        aiWinLength = bigBoardGame.winCondition || 4;
      }

      // In infinity mode, pass only the LIVE window of moves (pieces still on
      // the board). The full `moves` array grows forever, so `moves[0]` would
      // be a piece removed long ago — the AI would simulate bogus removals.
      const isInfinityMode = state.config.mode === 'infinity';
      const aiMoves = isInfinityMode
        ? state.game.moves.slice((state.game as InfinityGameState).oldestMoveIndex || 0)
        : state.game.moves;

      const aiMove = aiPlayer.getBestMove(
        state.game.board,
        isInfinityMode,
        aiMoves,
        isInfinityMode ? 6 : undefined,
        state.config.mode === 'reverse', // isReverseMode - AI should try to lose
        aiWinLength,
        state.config.mode === 'blind', // isBlindMode - AI has limited vision too
        state.config.mode === 'gravity' // isGravityMode - AI considers gravity effects
      );

      if (aiMove) {
        // Triple-locked: expectedPlayer makes the reducer no-op if currentPlayer
        // is somehow not 'O', and forcedPlayer hardcodes the placed piece to 'O'
        // regardless of game.currentPlayer. The AI will never place an 'X'.
        dispatch({
          type: 'MAKE_MOVE',
          payload: { row: aiMove.row, col: aiMove.col, expectedPlayer: 'O', forcedPlayer: 'O' },
        });
      }
    } catch (error) {
      console.error('AI move error:', error);
    } finally {
      dispatch({ type: 'SET_AI_THINKING', payload: false });
    }
  }, [state.config.opponent, state.game.winner, (state.game as any).isDraw, state.isAIThinking, state.game.board, state.game.moves, aiPlayer]);

  const clearLastRewards = useCallback(() => setLastRewards(null), []);

  const restartGame = useCallback(() => {
    // Drop the previous round's payout so a fresh game can never open its end
    // modal showing numbers that were earned earlier.
    setLastRewards(null);
    dispatch({ type: 'RESTART_GAME' });
  }, []);

  const newRound = useCallback(() => {
    setLastRewards(null);
    dispatch({ type: 'NEW_ROUND' });
  }, []);

  const setGameMode = useCallback((mode: GameMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  const setOpponent = useCallback((opponent: OpponentType) => {
    dispatch({ type: 'SET_OPPONENT', payload: opponent });
  }, []);

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    dispatch({ type: 'SET_DIFFICULTY', payload: difficulty });
  }, []);

  const updateConfig = useCallback((config: Partial<GameConfig>) => {
    dispatch({ type: 'SET_CONFIG', payload: config });
  }, []);

  const updateGameStats = useCallback(async (winner: Player | null, isDraw: boolean) => {
    const newStats = { ...state.stats };
    // Stars paid for this round. The services already returned every payout
    // number below; nobody read them, so a win looked like it paid nothing.
    let earnedStars = 0;

    // Handle Survival Mode
    if (state.config.mode === 'survival') {
      const survivalGame = state.game as SurvivalGameState;

      if (winner === 'X') {
        // Player won - increase consecutive wins
        const newConsecutiveWins = survivalGame.consecutiveWins + 1;
        dispatch({
          type: 'UPDATE_SURVIVAL_STATS',
          payload: { consecutiveWins: newConsecutiveWins }
        });
      } else if (winner === 'O' || isDraw) {
        // Player lost or drew - lose a life
        const newLives = survivalGame.lives - 1;
        dispatch({
          type: 'UPDATE_SURVIVAL_STATS',
          payload: {
            lives: newLives,
            consecutiveWins: 0 // Reset streak on loss/draw
          }
        });

        // Game over (lives 0) is handled by the end-game modal's "Play Again",
        // which dispatches RESTART_GAME and resets lives. Do NOT auto-restart on a
        // timer here: the old 5s setTimeout survived navigation and mode changes
        // (stale closure always passed the mode check) and wiped the board of
        // whatever game was live 5 seconds later — pieces "disappeared" mid-game.
      }
    }

    // Increment total games
    newStats.totalGames += 1;

    if (isDraw) {
      // Update draw stats for both players
      newStats.playerX.draws += 1;
      newStats.playerO.draws += 1;
      newStats.currentStreak = 0; // Reset streak on draw
    } else if (winner) {
      // Update winner and loser stats
      const loser: Player = winner === 'X' ? 'O' : 'X';

      newStats[`player${winner}`].wins += 1;
      newStats[`player${loser}`].losses += 1;

      // The streak belongs to the human (always X), and it used to be bumped on
      // ANY winner — so losing to the AI *raised* your streak, and with it the
      // streak bonus paid in stars, XP and ranked points. A loss ends it.
      if (winner === 'X') {
        newStats.currentStreak += 1;
        if (newStats.currentStreak > newStats.bestStreak) {
          newStats.bestStreak = newStats.currentStreak;
        }
      } else {
        newStats.currentStreak = 0;
      }

      // REWARD INTEGRATION
      // Only reward if playing against AI and the Human (usually X) wins
      // Or if checking logic allows O to be human (but standard is X=Human vs AI)
      if (state.config.opponent === 'ai' && winner === 'X') {
        try {
          // Calculate reward based on difficulty/mode
          let baseReward = 5; // Default classic

          // Bonus for difficulty
          if (state.config.difficulty === 'challenger' || state.config.difficulty === 'troll') {
            baseReward = 15;
          } else if (state.config.difficulty === 'expert') {
            baseReward = 10;
          }

          // Win streak bonus is handled inside rewardWin but we pass currentStreak
          // Note: storeService.rewardWin expects (isSpecialMode: boolean, consecutiveWins)
          const isSpecialMode = state.config.mode !== 'classic';
          earnedStars = await storeService.rewardWin(isSpecialMode, newStats.currentStreak);
        } catch (err) {
          console.error('Error processing reward:', err);
        }
      }
    }

    dispatch({ type: 'UPDATE_STATS', payload: newStats });

    // Award Battle Pass XP + update Ranked
    try {
      const isSpecialMode = state.config.mode !== 'classic';
      const playerWon = winner === 'X';
      const bpResult = await battlepassService.onGameEnd(playerWon, isDraw, isSpecialMode, newStats.currentStreak);
      const rankedResult = await rankedService.recordGame(playerWon, isDraw, state.config.difficulty);
      await challengeService.onGameEnd(playerWon, isDraw, state.config.mode, state.config.difficulty, newStats.currentStreak, state.config.opponent);
      const unlocked = await achievementService.onGameEnd(
        playerWon, isDraw, state.config.mode, state.config.difficulty,
        newStats.totalGames,
        // Only the human's wins count. Summing both players meant losing to the
        // AI still advanced the "wins" achievements (playerO is the AI).
        newStats.playerX.wins,
        newStats.bestStreak,
        // Was omitted entirely, so chest achievements could never be reached.
        chestService.getTotalOpened()
      );

      setLastRewards({
        stars: earnedStars,
        xp: bpResult.xp,
        rankedPoints: rankedResult.pointsChange,
        leveledUp: bpResult.leveledUp,
        newLevel: bpResult.newLevel,
        achievements: unlocked || [],
        chest: null,
      });

      // Log level up for UI notification (GameScreen picks this up)
      if (bpResult.leveledUp) {
        console.log(`🎖️ Battle Pass Level Up! Now level ${bpResult.newLevel}`);
      }
    } catch (err) {
      console.error('Error updating battle pass / ranked:', err);
    }
  }, [state.stats, state.config.mode, state.config.opponent, state.config.difficulty]);

  const resetStats = useCallback(async () => {
    dispatch({ type: 'RESET_STATS' });
    // Force immediate save to AsyncStorage
    await AsyncStorage.setItem('@game_stats', JSON.stringify(initialGameStats));
  }, []);

  const playSound = useCallback(async (soundType: 'click' | 'win' | 'draw' | 'error' | 'remove' | 'button' | 'lose') => {
    if (!state.config.soundEnabled) return;

    try {
      await SoundUtils.playFeedback(soundType as any, true);

      // Special handling for victory sound
      if (soundType === 'win') {
        setTimeout(() => {
          SoundUtils.playVictorySequence();
        }, 300);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [state.config.soundEnabled]);

  const triggerHaptics = useCallback(async (type: 'light' | 'medium' | 'heavy') => {
    if (!state.config.hapticsEnabled) return;

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    } catch (error) {
      console.error('Error triggering haptics:', error);
    }
  }, [state.config.hapticsEnabled]);

  const checkWinner = useCallback(() => {
    const { mode } = state.config;
    let winLength = 3;

    if (mode === 'bigBoard') {
      const bigBoardGame = state.game as BigBoardGameState;
      winLength = bigBoardGame.winCondition || 4;
    }

    return checkWin(state.game.board, winLength);
  }, [state.game.board, state.config.mode]);

  const clearTrollMessage = useCallback(() => {
    dispatch({ type: 'SET_TROLL_MESSAGE', payload: null });
  }, []);

  // Blitz mode functions
  const handleBlitzTimeout = useCallback((player: Player) => {
    dispatch({ type: 'BLITZ_TIMEOUT', payload: { player } });
  }, []);

  const setBlitzTime = useCallback((seconds: number) => {
    dispatch({ type: 'SET_BLITZ_TIME', payload: seconds });
  }, []);

  // Gravity mode functions
  const completeGravityFall = useCallback(() => {
    dispatch({ type: 'COMPLETE_GRAVITY_FALL' });
  }, []);

  const undoLastMoves = useCallback(() => {
    dispatch({ type: 'UNDO_LAST_MOVES' });
  }, []);

  const selectGobbleSize = useCallback((size: GobbleSize) => {
    dispatch({ type: 'SELECT_GOBBLE_SIZE', payload: size });
  }, []);

  const addBlitzTime = useCallback((seconds: number) => {
    dispatch({ type: 'BLITZ_ADD_TIME', payload: seconds });
  }, []);

  const value: GameContextValue = {
    gameState: state.game,
    gameConfig: state.config,
    gameStats: state.stats,
    makeMove,
    restartGame,
    newRound,
    setGameMode,
    setOpponent,
    setDifficulty,
    updateConfig,
    updateGameStats,
    resetStats,
    playSound,
    triggerHaptics,
    checkWinner,
    isInfinityMode: state.config.mode === 'infinity',
    gameMode: state.config.mode,
    isAIThinking: state.isAIThinking,
    makeAIMove,
    trollMessage: state.trollMessage,
    clearTrollMessage,
    handleBlitzTimeout,
    setBlitzTime,
    completeGravityFall,
    undoLastMoves,
    addBlitzTime,
    selectGobbleSize,
    lastRewards,
    clearLastRewards,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = (): GameContextValue => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
