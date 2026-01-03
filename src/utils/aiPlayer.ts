import { Cell, Player, Difficulty, GameMove, InfinityGameState } from '../types/game';

interface AIMove {
  row: number;
  col: number;
  score?: number;
}

export class AIPlayer {
  private difficulty: Difficulty;
  private aiPlayer: Player = 'O';
  private humanPlayer: Player = 'X';

  constructor(difficulty: Difficulty = 'mediano') {
    this.difficulty = difficulty;
  }

  setDifficulty(difficulty: Difficulty) {
    this.difficulty = difficulty;
  }

  // Main method to get AI move
  getBestMove(
    board: Cell[][],
    isInfinityMode: boolean = false,
    moves: GameMove[] = [],
    maxPieces: number = 6,
    isReverseMode: boolean = false
  ): AIMove | null {
    const emptyCells = this.getEmptyCells(board);

    if (emptyCells.length === 0) {
      return null;
    }

    // In Reverse mode, AI should try to LOSE (make opponent create 3 in a line)
    if (isReverseMode) {
      return this.getReverseMove(board, emptyCells);
    }

    switch (this.difficulty) {
      case 'noob':
        return this.getNoobMove(board, emptyCells);
      case 'mediano':
        return this.getMedianoMove(board, emptyCells, isInfinityMode, moves, maxPieces);
      case 'expert':
        return this.getExpertMove(board, emptyCells, isInfinityMode, moves, maxPieces);
      case 'challenger':
        return this.getChallengerMove(board, emptyCells, isInfinityMode, moves, maxPieces);
      case 'troll':
        return this.getTrollMove(board, emptyCells, isInfinityMode, moves, maxPieces);
      default:
        return this.getMedianoMove(board, emptyCells, isInfinityMode, moves, maxPieces);
    }
  }

  // Reverse mode AI: Tries to LOSE by forcing opponent to create 3 in a line
  private getReverseMove(board: Cell[][], emptyCells: AIMove[]): AIMove {
    // In Reverse mode, the AI wants to:
    // 1. AVOID making 3 in a line (that would make AI lose in reverse mode)
    // 2. Try to FORCE the opponent to make 3 in a line

    // First, filter out moves that would make AI create 3 in line (avoid losing)
    const safeMoves = emptyCells.filter(move => {
      const testBoard = board.map(row => [...row]);
      testBoard[move.row][move.col] = this.aiPlayer;
      return this.checkWinner(testBoard) !== this.aiPlayer;
    });

    // If no safe moves, we have to make a "losing" move (which wins in normal game)
    const movesToConsider = safeMoves.length > 0 ? safeMoves : emptyCells;

    // Try to force opponent into a position where they MUST create 3 in line
    // Look for moves that set up a "fork" against the opponent
    for (const move of movesToConsider) {
      const testBoard = board.map(row => [...row]);
      testBoard[move.row][move.col] = this.aiPlayer;

      // Count how many winning opportunities this creates for the opponent
      let opponentWinningMoves = 0;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (testBoard[r][c] === null) {
            testBoard[r][c] = this.humanPlayer;
            if (this.checkWinner(testBoard) === this.humanPlayer) {
              opponentWinningMoves++;
            }
            testBoard[r][c] = null;
          }
        }
      }

      // If this move creates 2+ winning opportunities for opponent, it's great!
      if (opponentWinningMoves >= 2) {
        console.log(`🔄 Reverse AI: Found trap! Move (${move.row}, ${move.col}) creates ${opponentWinningMoves} winning threats for opponent`);
        return move;
      }
    }

    // Try to avoid center and corners in early game (those are strategic)
    // Prefer edge positions to give opponent more control
    const edges = movesToConsider.filter(
      m => (m.row === 1 && m.col !== 1) || (m.col === 1 && m.row !== 1)
    );
    if (edges.length > 0 && Math.random() < 0.6) {
      return edges[Math.floor(Math.random() * edges.length)];
    }

    // Otherwise, random safe move
    return movesToConsider[Math.floor(Math.random() * movesToConsider.length)];
  }

  // Noob AI: Mostly random, occasionally blocks or wins by accident
  private getNoobMove(board: Cell[][], emptyCells: AIMove[]): AIMove {
    // 20% chance to make a smart move, 80% random
    if (Math.random() < 0.2) {
      // Sometimes tries to win
      if (Math.random() < 0.6) {
        const winningMove = this.findWinningMove(board, this.aiPlayer);
        if (winningMove) return winningMove;
      }

      // Sometimes blocks
      const blockingMove = this.findWinningMove(board, this.humanPlayer);
      if (blockingMove) return blockingMove;
    }

    // Mostly random moves
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  // Mediano AI: Good strategy with some randomness
  private getMedianoMove(
    board: Cell[][],
    emptyCells: AIMove[],
    isInfinityMode: boolean,
    moves: GameMove[],
    maxPieces: number
  ): AIMove {
    // Always try to win first
    const winningMove = this.findWinningMove(board, this.aiPlayer);
    if (winningMove) return winningMove;

    // Always try to block opponent's win
    const blockingMove = this.findWinningMove(board, this.humanPlayer);
    if (blockingMove) return blockingMove;

    // In infinity mode, consider piece removal strategy
    if (isInfinityMode && moves.length >= maxPieces - 2) {
      const strategicMove = this.getInfinityStrategicMove(board, emptyCells, moves, maxPieces);
      if (strategicMove) return strategicMove;
    }

    // 75% chance for strategic move, 25% random
    if (Math.random() < 0.75) {
      return this.getStrategicMove(board, emptyCells);
    }

    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  // Expert AI: Uses minimax algorithm with alpha-beta pruning
  private getExpertMove(
    board: Cell[][],
    emptyCells: AIMove[],
    isInfinityMode: boolean,
    moves: GameMove[],
    maxPieces: number
  ): AIMove {
    // Always try to win first
    const winningMove = this.findWinningMove(board, this.aiPlayer);
    if (winningMove) return winningMove;

    // Always try to block opponent's win
    const blockingMove = this.findWinningMove(board, this.humanPlayer);
    if (blockingMove) return blockingMove;

    if (isInfinityMode) {
      return this.getInfinityOptimalMove(board, emptyCells, moves, maxPieces);
    }

    return this.minimaxMove(board);
  }

  // Challenger AI: Perfect play, nearly unbeatable
  private getChallengerMove(
    board: Cell[][],
    emptyCells: AIMove[],
    isInfinityMode: boolean,
    moves: GameMove[],
    maxPieces: number
  ): AIMove {
    // Perfect strategy - always optimal moves
    const winningMove = this.findWinningMove(board, this.aiPlayer);
    if (winningMove) return winningMove;

    const blockingMove = this.findWinningMove(board, this.humanPlayer);
    if (blockingMove) return blockingMove;

    if (isInfinityMode) {
      return this.getInfinityOptimalMove(board, emptyCells, moves, maxPieces);
    }

    // Use deeper minimax for perfect play
    return this.minimaxMove(board, 9); // Full depth
  }

  // Troll AI: Good AI but with provocative messages
  private getTrollMove(
    board: Cell[][],
    emptyCells: AIMove[],
    isInfinityMode: boolean,
    moves: GameMove[],
    maxPieces: number
  ): AIMove {
    // Uses expert-level strategy
    const winningMove = this.findWinningMove(board, this.aiPlayer);
    if (winningMove) {
      // Troll message when about to win
      this.sendTrollMessage('win');
      return winningMove;
    }

    const blockingMove = this.findWinningMove(board, this.humanPlayer);
    if (blockingMove) {
      // Troll message when blocking
      this.sendTrollMessage('block');
      return blockingMove;
    }

    // Send random troll message
    if (Math.random() < 0.3) {
      this.sendTrollMessage('taunt');
    }

    if (isInfinityMode) {
      return this.getInfinityOptimalMove(board, emptyCells, moves, maxPieces);
    }

    return this.minimaxMove(board);
  }

  // Minimax algorithm for optimal play
  private minimaxMove(board: Cell[][], maxDepth: number = 6): AIMove {
    let bestMove: AIMove = { row: -1, col: -1, score: -Infinity };

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === null) {
          board[row][col] = this.aiPlayer;
          const score = this.minimax(board, 0, false, -Infinity, Infinity, maxDepth);
          board[row][col] = null;

          if (score > bestMove.score!) {
            bestMove = { row, col, score };
          }
        }
      }
    }

    return bestMove;
  }

  // Troll message system
  private trollMessages = {
    win: [
      "😈 Eu vou ganhar! Que pena para você...",
      "🔥 Preparado para perder?",
      "😎 Muito fácil! Próxima!",
      "💀 Game over para você!",
      "🏆 Eu sou inevitável!"
    ],
    block: [
      "🛡️ Não mesmo! Bloqueado!",
      "😏 Boa tentativa, mas eu vi isso chegando!",
      "🚫 Nope! Não vai rolar!",
      "🤨 Você realmente achou que eu deixaria?",
      "⛔ Bloqueado como um muro!"
    ],
    taunt: [
      "🤔 Pensando ainda? Eu já sei o que vou jogar!",
      "⏰ Tick tock... estou esperando!",
      "😴 Vou tirar uma soneca enquanto você decide...",
      "🧠 Precisa de mais neurônios aí?",
      "😂 Essa jogada foi... interessante...",
      "🎯 Você está facilitando muito para mim!",
      "🤖 Calculando... 99% de chance de eu ganhar!",
      "😈 Você vai se arrepender dessa jogada!"
    ]
  };

  private sendTrollMessage(type: 'win' | 'block' | 'taunt') {
    const messages = this.trollMessages[type];
    const message = messages[Math.floor(Math.random() * messages.length)];

    // This will be handled by the game context
    console.log(`🤖 Troll AI: ${message}`);

    // We could emit an event here or call a callback to show the message in the UI
    if (this.onTrollMessage) {
      this.onTrollMessage(message);
    }
  }

  // Callback for troll messages
  private onTrollMessage?: (message: string) => void;

  setTrollMessageCallback(callback: (message: string) => void) {
    this.onTrollMessage = callback;
  }

  // Minimax with alpha-beta pruning
  private minimax(
    board: Cell[][],
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
    maxDepth: number = 6
  ): number {
    const winner = this.checkWinner(board);

    if (winner === this.aiPlayer) return 10 - depth;
    if (winner === this.humanPlayer) return depth - 10;
    if (this.isBoardFull(board) || depth >= maxDepth) return 0;

    if (isMaximizing) {
      let maxScore = -Infinity;

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          if (board[row][col] === null) {
            board[row][col] = this.aiPlayer;
            const score = this.minimax(board, depth + 1, false, alpha, beta, maxDepth);
            board[row][col] = null;

            maxScore = Math.max(score, maxScore);
            alpha = Math.max(alpha, score);

            if (beta <= alpha) break;
          }
        }
      }

      return maxScore;
    } else {
      let minScore = Infinity;

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          if (board[row][col] === null) {
            board[row][col] = this.humanPlayer;
            const score = this.minimax(board, depth + 1, true, alpha, beta, maxDepth);
            board[row][col] = null;

            minScore = Math.min(score, minScore);
            beta = Math.min(beta, score);

            if (beta <= alpha) break;
          }
        }
      }

      return minScore;
    }
  }

  // Strategic move selection for medium difficulty
  private getStrategicMove(board: Cell[][], emptyCells: AIMove[]): AIMove {
    // Prefer center
    if (board[1][1] === null) {
      return { row: 1, col: 1 };
    }

    // Prefer corners
    const corners = [
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 2, col: 0 },
      { row: 2, col: 2 }
    ].filter(pos => board[pos.row][pos.col] === null);

    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    // Any available move
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  // Infinity mode strategic considerations
  private getInfinityStrategicMove(
    board: Cell[][],
    emptyCells: AIMove[],
    moves: GameMove[],
    maxPieces: number
  ): AIMove | null {
    // If we're close to max pieces, consider which piece will be removed
    if (moves.length >= maxPieces - 1) {
      const oldestMove = moves[0];
      const simulatedBoard = this.simulateBoardAfterRemoval(board, oldestMove);

      // Check if removing the oldest piece creates a winning opportunity
      const winAfterRemoval = this.findWinningMove(simulatedBoard, this.aiPlayer);
      if (winAfterRemoval && this.isValidMove(winAfterRemoval, board)) {
        return winAfterRemoval;
      }
    }

    return null;
  }

  // Optimal move for infinity mode
  private getInfinityOptimalMove(
    board: Cell[][],
    emptyCells: AIMove[],
    moves: GameMove[],
    maxPieces: number
  ): AIMove {
    let bestMove: AIMove = emptyCells[0];
    let bestScore = -Infinity;

    for (const move of emptyCells) {
      // Simulate the move
      const newBoard = board.map(row => [...row]);
      newBoard[move.row][move.col] = this.aiPlayer;

      let score = this.evaluateInfinityPosition(newBoard, moves, maxPieces, move);

      // Add some randomness to avoid predictable play
      score += (Math.random() - 0.5) * 0.1;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  // Evaluate position considering infinity mode mechanics
  private evaluateInfinityPosition(
    board: Cell[][],
    moves: GameMove[],
    maxPieces: number,
    newMove: AIMove
  ): number {
    let score = 0;

    // Base position evaluation
    score += this.evaluatePosition(board);

    // Consider piece removal effects
    if (moves.length >= maxPieces) {
      const oldestMove = moves[0];
      const boardAfterRemoval = this.simulateBoardAfterRemoval(board, oldestMove);
      score += this.evaluatePosition(boardAfterRemoval) * 0.5;
    }

    return score;
  }

  // Basic position evaluation
  private evaluatePosition(board: Cell[][]): number {
    let score = 0;

    // Check all lines (rows, columns, diagonals)
    const lines = [
      // Rows
      [board[0][0], board[0][1], board[0][2]],
      [board[1][0], board[1][1], board[1][2]],
      [board[2][0], board[2][1], board[2][2]],
      // Columns
      [board[0][0], board[1][0], board[2][0]],
      [board[0][1], board[1][1], board[2][1]],
      [board[0][2], board[1][2], board[2][2]],
      // Diagonals
      [board[0][0], board[1][1], board[2][2]],
      [board[0][2], board[1][1], board[2][0]],
    ];

    for (const line of lines) {
      score += this.evaluateLine(line);
    }

    return score;
  }

  // Evaluate a single line (3 cells)
  private evaluateLine(line: Cell[]): number {
    let score = 0;
    let aiCount = 0;
    let humanCount = 0;
    let emptyCount = 0;

    for (const cell of line) {
      if (cell === this.aiPlayer) aiCount++;
      else if (cell === this.humanPlayer) humanCount++;
      else emptyCount++;
    }

    // Can't score if both players have pieces in this line
    if (aiCount > 0 && humanCount > 0) return 0;

    if (aiCount === 3) score += 100;
    else if (aiCount === 2 && emptyCount === 1) score += 10;
    else if (aiCount === 1 && emptyCount === 2) score += 1;

    if (humanCount === 3) score -= 100;
    else if (humanCount === 2 && emptyCount === 1) score -= 10;
    else if (humanCount === 1 && emptyCount === 2) score -= 1;

    return score;
  }

  // Helper methods
  private getEmptyCells(board: Cell[][]): AIMove[] {
    const emptyCells: AIMove[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === null) {
          emptyCells.push({ row, col });
        }
      }
    }
    return emptyCells;
  }

  private findWinningMove(board: Cell[][], player: Player): AIMove | null {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === null) {
          board[row][col] = player;
          if (this.checkWinner(board) === player) {
            board[row][col] = null;
            return { row, col };
          }
          board[row][col] = null;
        }
      }
    }
    return null;
  }

  private checkWinner(board: Cell[][]): Player | null {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
        return board[i][0];
      }
    }

    // Check columns
    for (let i = 0; i < 3; i++) {
      if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
        return board[0][i];
      }
    }

    // Check diagonals
    if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
      return board[0][0];
    }
    if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
      return board[0][2];
    }

    return null;
  }

  private isBoardFull(board: Cell[][]): boolean {
    return board.every(row => row.every(cell => cell !== null));
  }

  private simulateBoardAfterRemoval(board: Cell[][], moveToRemove: GameMove): Cell[][] {
    const newBoard = board.map(row => [...row]);
    newBoard[moveToRemove.row][moveToRemove.col] = null;
    return newBoard;
  }

  private isValidMove(move: AIMove, board: Cell[][]): boolean {
    return move.row >= 0 && move.row < 3 && move.col >= 0 && move.col < 3 &&
      board[move.row][move.col] === null;
  }

  // Simulate AI thinking time for better UX
  async simulateThinking(): Promise<void> {
    let baseTime: number;

    switch (this.difficulty) {
      case 'noob':
        baseTime = 200;
        break;
      case 'mediano':
        baseTime = 400;
        break;
      case 'expert':
        baseTime = 700;
        break;
      case 'challenger':
        baseTime = 1000;
        break;
      case 'troll':
        baseTime = 600; // Troll takes time to think of provocative messages
        break;
      default:
        baseTime = 400;
    }

    return new Promise(resolve => {
      setTimeout(resolve, baseTime + Math.random() * 400);
    });
  }
}
