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
  BlindGameState,
  BigBoardGameState,
  SurvivalGameState,
} from '../types/game';
import { AIPlayer } from '../utils/aiPlayer';
import { soundManager, SoundUtils } from '../utils/soundManager';
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
      
      
    default:
      return { ...initialGameState };
  }
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
  | { type: 'MAKE_MOVE'; payload: { row: number; col: number } }
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
  | { type: 'LOAD_STORED_DATA'; payload: { config: GameConfig; stats: GameStats } };

interface GameContextValue {
  gameState: ExtendedGameState;
  gameConfig: GameConfig;
  gameStats: GameStats;
  makeMove: (row: number, col: number) => void;
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
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

// Game logic utilities
const checkWinCondition = (board: Cell[][]): WinningLine | null => {
  // Check rows
  for (let i = 0; i < 3; i++) {
    if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
      return {
        type: 'row',
        index: i,
        cells: [{ row: i, col: 0 }, { row: i, col: 1 }, { row: i, col: 2 }],
      };
    }
  }

  // Check columns
  for (let i = 0; i < 3; i++) {
    if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
      return {
        type: 'col',
        index: i,
        cells: [{ row: 0, col: i }, { row: 1, col: i }, { row: 2, col: i }],
      };
    }
  }

  // Check diagonals
  if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
    return {
      type: 'diagonal',
      index: 0,
      cells: [{ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }],
    };
  }

  if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
    return {
      type: 'diagonal',
      index: 1,
      cells: [{ row: 0, col: 2 }, { row: 1, col: 1 }, { row: 2, col: 0 }],
    };
  }

  return null;
};

const isBoardFull = (board: Cell[][]): boolean => {
  return board.every(row => row.every(cell => cell !== null));
};

// Reducer
const gameReducer = (
  state: { game: ExtendedGameState; config: GameConfig; stats: GameStats; isAIThinking: boolean; trollMessage: string | null },
  action: GameAction
): { game: ExtendedGameState; config: GameConfig; stats: GameStats; isAIThinking: boolean; trollMessage: string | null } => {
  switch (action.type) {
    case 'MAKE_MOVE': {
      const { row, col } = action.payload;
      const game = state.game;
      const { mode } = state.config;

      let actualRow = row;
      let actualCol = col;
      let newBoard: Cell[][];
      
      // Handle different game modes
      if (mode === 'gravity') {
        // In gravity mode, pieces fall to the lowest available position in the column
        const gravityResult = applyGravity(game.board, col, game.currentPlayer);
        if (!gravityResult) {
          return state; // Column is full
        }
        newBoard = gravityResult.board;
        actualRow = gravityResult.row;
      } else {
        // Standard modes - check if cell is occupied
        if (game.board[row][col] !== null) {
          return state;
        }
        newBoard = game.board.map(r => [...r]);
        newBoard[row][col] = game.currentPlayer;
      }

      const newMove: GameMove = {
        row: actualRow,
        col: actualCol,
        player: game.currentPlayer,
        moveNumber: game.moveCount + 1,
      };

      const newMoves = [...game.moves, newMove];
      const newMoveCount = game.moveCount + 1;

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

        // If we have more than 6 pieces, remove the oldest FIRST
        if (newMoveCount > maxPieces) {
          const moveToRemove = newMoves[oldestMoveIndex];
          
          if (moveToRemove) {
            console.log(`🎮 Infinity Mode: Removing piece at (${moveToRemove.row}, ${moveToRemove.col}) - Move #${moveToRemove.moveNumber}`);
            
            // Remove the oldest move from the board
            const boardAfterRemoval = newBoard.map(row => [...row]);
            boardAfterRemoval[moveToRemove.row][moveToRemove.col] = null;
            finalBoard = boardAfterRemoval;
            
            console.log(`🎮 Infinity Mode: Board after removal:`, boardAfterRemoval.map(row => row.map(cell => cell || '.')).join('\n'));
          }
        }

        // NOW check for winner in the FINAL board state (after removal)
        finalWinner = checkWin(finalBoard, winLength);
        // Infinity mode never has draws
        finalIsDraw = false;
      } else {
        // For other modes, check winner normally
        finalWinner = checkWin(newBoard, winLength);
        finalIsDraw = !finalWinner && isFull(newBoard);
      }

      let updatedGame: ExtendedGameState = {
        ...game,
        board: finalBoard,
        currentPlayer: game.currentPlayer === 'X' ? 'O' : 'X',
        moves: newMoves,
        moveCount: newMoveCount,
        winner: finalWinner ? game.currentPlayer : null,
        isDraw: finalIsDraw,
      };

      // Update infinity mode specific state
      if (state.config.mode === 'infinity') {
        const infinityGame = updatedGame as unknown as InfinityGameState;
        const currentInfinityState = game as InfinityGameState;
        
        infinityGame.maxPieces = 6;
        infinityGame.oldestMoveIndex = currentInfinityState.oldestMoveIndex || 0;

        // Update oldestMoveIndex if we removed a piece
        if (newMoveCount > infinityGame.maxPieces) {
          infinityGame.oldestMoveIndex += 1;
          
          // Set next piece to be removed (if there will be one)
          if (infinityGame.oldestMoveIndex < newMoves.length) {
            infinityGame.nextToRemove = newMoves[infinityGame.oldestMoveIndex];
          } else {
            infinityGame.nextToRemove = undefined;
          }
        } else {
          infinityGame.nextToRemove = undefined;
          console.log(`🎮 Infinity Mode: ${newMoveCount}/6 pieces on board`);
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





      return {
        ...state,
        game: updatedGame,
      };
    }

    case 'RESTART_GAME': {
      const newGameState = createInitialGameState(state.config.mode);
      return {
        ...state,
        game: newGameState,
      };
    }

    case 'NEW_ROUND': {
      const newGameState = createInitialGameState(state.config.mode);
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


    case 'LOAD_STORED_DATA':
      return {
        ...state,
        config: action.payload.config,
        stats: action.payload.stats,
      };

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

  const [aiPlayer] = React.useState(() => new AIPlayer());

  // Load stored data and initialize sound system on app start
  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize sound system
        await SoundUtils.preloadSounds();
        
        // Load stored data
        const [storedConfig, storedStats] = await Promise.all([
          AsyncStorage.getItem('@game_config'),
          AsyncStorage.getItem('@game_stats'),
        ]);

        if (storedConfig || storedStats) {
          dispatch({
            type: 'LOAD_STORED_DATA',
            payload: {
              config: storedConfig ? JSON.parse(storedConfig) : initialGameConfig,
              stats: storedStats ? JSON.parse(storedStats) : initialGameStats,
            },
          });
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();

    // Cleanup sound system on unmount
    return () => {
      SoundUtils.cleanup();
    };
  }, []);

  // Save config and stats when they change
  React.useEffect(() => {
    AsyncStorage.setItem('@game_config', JSON.stringify(state.config));
  }, [state.config]);

  React.useEffect(() => {
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

  const makeMove = useCallback((row: number, col: number) => {
    dispatch({ type: 'MAKE_MOVE', payload: { row, col } });
  }, []);

  const makeAIMove = useCallback(async () => {
    if (state.config.opponent !== 'ai' || state.game.winner || (state.game as any).isDraw || state.isAIThinking) {
      return;
    }

    dispatch({ type: 'SET_AI_THINKING', payload: true });

    try {
      // Simulate thinking time
      await aiPlayer.simulateThinking();
      
      const aiMove = aiPlayer.getBestMove(
        state.game.board,
        state.config.mode === 'infinity',
        state.game.moves,
        state.config.mode === 'infinity' ? 6 : undefined
      );

      if (aiMove) {
        dispatch({ type: 'MAKE_MOVE', payload: { row: aiMove.row, col: aiMove.col } });
      }
    } catch (error) {
      console.error('AI move error:', error);
    } finally {
      dispatch({ type: 'SET_AI_THINKING', payload: false });
    }
  }, [state.config.opponent, state.game.winner, (state.game as any).isDraw, state.isAIThinking, state.game.board, state.game.moves, aiPlayer]);

  const restartGame = useCallback(() => {
    dispatch({ type: 'RESTART_GAME' });
  }, []);

  const newRound = useCallback(() => {
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

  const updateGameStats = useCallback((winner: Player | null, isDraw: boolean) => {
    const newStats = { ...state.stats };
    
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
        
        if (newLives <= 0) {
          // Game Over - restart survival mode ONLY in survival mode
          setTimeout(() => {
            // Double check we're still in survival mode before restarting
            if (state.config.mode === 'survival') {
              dispatch({ type: 'RESTART_GAME' });
            }
          }, 5000); // Changed to 5 seconds to not conflict with modal
        }
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
      
      // Update streak
      newStats.currentStreak += 1;
      if (newStats.currentStreak > newStats.bestStreak) {
        newStats.bestStreak = newStats.currentStreak;
      }
    }
    
    dispatch({ type: 'UPDATE_STATS', payload: newStats });
  }, [state.stats, state.config.mode]);

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
