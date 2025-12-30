import { Cell, Player, GameMove, WinningLine } from '../types/game';

// Utility functions for different game modes

export const createBoard = (size: number = 3): Cell[][] => {
  return Array(size).fill(null).map(() => Array(size).fill(null));
};

export const checkWinCondition = (board: Cell[][], winLength: number = 3): WinningLine | null => {
  const size = board.length;
  
  // Check rows
  for (let i = 0; i < size; i++) {
    for (let j = 0; j <= size - winLength; j++) {
      if (board[i][j] && 
          Array.from({length: winLength}, (_, k) => board[i][j + k]).every(cell => cell === board[i][j])) {
        return {
          type: 'row',
          index: i,
          cells: Array.from({length: winLength}, (_, k) => ({ row: i, col: j + k })),
        };
      }
    }
  }

  // Check columns
  for (let i = 0; i < size; i++) {
    for (let j = 0; j <= size - winLength; j++) {
      if (board[j][i] && 
          Array.from({length: winLength}, (_, k) => board[j + k][i]).every(cell => cell === board[j][i])) {
        return {
          type: 'col',
          index: i,
          cells: Array.from({length: winLength}, (_, k) => ({ row: j + k, col: i })),
        };
      }
    }
  }

  // Check diagonals (top-left to bottom-right)
  for (let i = 0; i <= size - winLength; i++) {
    for (let j = 0; j <= size - winLength; j++) {
      if (board[i][j] && 
          Array.from({length: winLength}, (_, k) => board[i + k][j + k]).every(cell => cell === board[i][j])) {
        return {
          type: 'diagonal',
          index: 0,
          cells: Array.from({length: winLength}, (_, k) => ({ row: i + k, col: j + k })),
        };
      }
    }
  }

  // Check diagonals (top-right to bottom-left)
  for (let i = 0; i <= size - winLength; i++) {
    for (let j = winLength - 1; j < size; j++) {
      if (board[i][j] && 
          Array.from({length: winLength}, (_, k) => board[i + k][j - k]).every(cell => cell === board[i][j])) {
        return {
          type: 'diagonal',
          index: 1,
          cells: Array.from({length: winLength}, (_, k) => ({ row: i + k, col: j - k })),
        };
      }
    }
  }

  return null;
};

export const isBoardFull = (board: Cell[][]): boolean => {
  return board.every(row => row.every(cell => cell !== null));
};

// Gravity Mode Logic
export const applyGravity = (board: Cell[][], col: number, player: Player): { board: Cell[][]; row: number } | null => {
  const newBoard = board.map(row => [...row]);
  
  // Find the lowest empty cell in the column
  for (let row = newBoard.length - 1; row >= 0; row--) {
    if (newBoard[row][col] === null) {
      newBoard[row][col] = player;
      return { board: newBoard, row };
    }
  }
  
  // Column is full
  return null;
};

// Big Board Logic
export const createBigBoard = (size: 4 | 5): Cell[][] => {
  return createBoard(size);
};




// Blind Mode Logic
export const hideOldMoves = (board: Cell[][], moves: GameMove[], hideDelay: number = 3000): Cell[][] => {
  if (moves.length <= 2) return board; // Always show last 2 moves
  
  const newBoard = board.map(row => [...row]);
  const currentTime = Date.now();
  
  // Hide moves older than hideDelay, except the last move from each player
  const playerXLastMove = moves.filter(m => m.player === 'X').pop();
  const playerOLastMove = moves.filter(m => m.player === 'O').pop();
  
  for (const move of moves) {
    if (move !== playerXLastMove && move !== playerOLastMove) {
      // In a real implementation, you'd track move timestamps
      // For now, we'll hide moves based on move number
      if (moves.length - move.moveNumber > 2) {
        newBoard[move.row][move.col] = null;
      }
    }
  }
  
  return newBoard;
};

