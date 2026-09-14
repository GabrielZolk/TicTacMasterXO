import { Cell, Player, Difficulty, GameMove, InfinityGameState } from '../types/game';
import { checkWinCondition } from './gameLogic';

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
    isReverseMode: boolean = false,
    winLength: number = 3,
    isBlindMode: boolean = false,
    isGravityMode: boolean = false
  ): AIMove | null {
    // In blind mode, AI uses a "foggy" board — it forgets some older opponent moves
    // This simulates fair play where the AI also has limited memory
    let effectiveBoard = board;
    if (isBlindMode && moves.length > 2) {
      effectiveBoard = this.createBlindBoard(board, moves);
    }

    const emptyCells = this.getEmptyCells(effectiveBoard);

    if (emptyCells.length === 0) {
      // Fallback: use real board to find any available cell
      const realEmpty = this.getEmptyCells(board);
      return realEmpty.length > 0 ? realEmpty[Math.floor(Math.random() * realEmpty.length)] : null;
    }

    // In Reverse mode, AI should try to LOSE (make opponent create N in a line)
    if (isReverseMode) {
      return this.getReverseMove(effectiveBoard, emptyCells, winLength);
    }

    // In gravity mode, use gravity-aware move selection for non-noob difficulties
    if (isGravityMode && this.difficulty !== 'noob') {
      return this.getGravityAwareMove(effectiveBoard, emptyCells, winLength);
    }

    switch (this.difficulty) {
      case 'noob':
        return this.getNoobMove(effectiveBoard, emptyCells, winLength);
      case 'mediano':
        return this.getMedianoMove(effectiveBoard, emptyCells, isInfinityMode, moves, maxPieces, winLength);
      case 'expert':
        return this.getExpertMove(effectiveBoard, emptyCells, isInfinityMode, moves, maxPieces, winLength);
      case 'challenger':
        return this.getChallengerMove(effectiveBoard, emptyCells, isInfinityMode, moves, maxPieces, winLength);
      case 'troll':
        return this.getTrollMove(effectiveBoard, emptyCells, isInfinityMode, moves, maxPieces, winLength);
      default:
        return this.getMedianoMove(effectiveBoard, emptyCells, isInfinityMode, moves, maxPieces, winLength);
    }
  }

  // Gravity-aware move: evaluates both the placed position AND where the piece might fall
  private getGravityAwareMove(board: Cell[][], emptyCells: AIMove[], winLength: number): AIMove {
    // Always take immediate wins
    const winningMove = this.findWinningMove(board, this.aiPlayer, winLength);
    if (winningMove) return winningMove;

    // Always block immediate threats
    const blockingMove = this.findWinningMove(board, this.humanPlayer, winLength);
    if (blockingMove) return blockingMove;

    const size = board.length;
    let bestMove = emptyCells[0];
    let bestScore = -Infinity;

    for (const move of emptyCells) {
      let score = 0;

      // Score 1: evaluate position as-is (piece stays)
      const boardStay = board.map(r => [...r]);
      boardStay[move.row][move.col] = this.aiPlayer;
      const stayScore = this.evaluatePosition(boardStay, winLength);

      // Score 2: evaluate position if gravity triggers (piece falls to lowest row)
      let lowestRow = move.row;
      for (let r = move.row + 1; r < size; r++) {
        if (board[r][move.col] === null) lowestRow = r;
        else break;
      }

      let fallScore = stayScore; // Same if already at bottom
      if (lowestRow > move.row) {
        const boardFall = board.map(r => [...r]);
        boardFall[lowestRow][move.col] = this.aiPlayer;
        fallScore = this.evaluatePosition(boardFall, winLength);
      }

      // Weighted average: 60% stay (more likely), 40% fall (40% gravity chance)
      score = stayScore * 0.6 + fallScore * 0.4;

      // Bonus: prefer lower rows (more stable, less affected by gravity)
      score += move.row * 0.5;

      // Penalty: avoid positions where falling would help the opponent
      if (lowestRow > move.row) {
        const boardFallOpp = board.map(r => [...r]);
        boardFallOpp[lowestRow][move.col] = this.aiPlayer;
        const oppWin = this.findWinningMove(boardFallOpp, this.humanPlayer, winLength);
        if (oppWin) score -= 5; // Penalize if gravity could set up opponent's win
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  // Create a "foggy" board for blind mode — AI forgets some older opponent moves
  // Keeps: all AI moves, last opponent move, and randomly forgets older opponent moves
  private createBlindBoard(board: Cell[][], moves: GameMove[]): Cell[][] {
    const blindBoard = board.map(row => [...row]);

    // Get opponent (human) moves, excluding the most recent one
    const humanMoves = moves.filter(m => m.player === this.humanPlayer);
    const oldHumanMoves = humanMoves.slice(0, -1); // All except the last

    // Forget 40-60% of old opponent moves depending on difficulty
    let forgetRate: number;
    switch (this.difficulty) {
      case 'noob': forgetRate = 0.6; break;     // Forgets a lot
      case 'mediano': forgetRate = 0.4; break;   // Forgets some
      case 'expert': forgetRate = 0.25; break;   // Forgets a few
      case 'challenger': forgetRate = 0.15; break; // Almost perfect memory
      case 'troll': forgetRate = 0.35; break;    // Moderate
      default: forgetRate = 0.4;
    }

    for (const move of oldHumanMoves) {
      if (Math.random() < forgetRate) {
        blindBoard[move.row][move.col] = null; // "Forget" this piece
      }
    }

    return blindBoard;
  }

  // Reverse mode AI: Tries to LOSE by forcing opponent to create N in a line
  private getReverseMove(board: Cell[][], emptyCells: AIMove[], winLength: number): AIMove {
    const size = board.length;

    // First, filter out moves that would make AI create N in line (avoid losing)
    const safeMoves = emptyCells.filter(move => {
      const testBoard = board.map(row => [...row]);
      testBoard[move.row][move.col] = this.aiPlayer;
      return this.checkWinner(testBoard, winLength) !== this.aiPlayer;
    });

    // If no safe moves, we have to make a "losing" move
    const movesToConsider = safeMoves.length > 0 ? safeMoves : emptyCells;

    // Try to force opponent into a position where they MUST create N in line
    for (const move of movesToConsider) {
      const testBoard = board.map(row => [...row]);
      testBoard[move.row][move.col] = this.aiPlayer;

      // Count how many winning opportunities this creates for the opponent
      let opponentWinningMoves = 0;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (testBoard[r][c] === null) {
            testBoard[r][c] = this.humanPlayer;
            if (this.checkWinner(testBoard, winLength) === this.humanPlayer) {
              opponentWinningMoves++;
            }
            testBoard[r][c] = null;
          }
        }
      }

      // If this move creates 2+ winning opportunities for opponent, it's great!
      if (opponentWinningMoves >= 2) {
        return move;
      }
    }

    // Prefer edge positions to give opponent more control
    const center = Math.floor(size / 2);
    const edges = movesToConsider.filter(
      m => (m.row === center && m.col !== center) || (m.col === center && m.row !== center)
    );
    if (edges.length > 0 && Math.random() < 0.6) {
      return edges[Math.floor(Math.random() * edges.length)];
    }

    // Otherwise, random safe move
    return movesToConsider[Math.floor(Math.random() * movesToConsider.length)];
  }

  // Noob AI: Mostly random, occasionally blocks or wins by accident
  private getNoobMove(board: Cell[][], emptyCells: AIMove[], winLength: number): AIMove {
    // 20% chance to make a smart move, 80% random
    if (Math.random() < 0.2) {
      if (Math.random() < 0.6) {
        const winningMove = this.findWinningMove(board, this.aiPlayer, winLength);
        if (winningMove) return winningMove;
      }

      const blockingMove = this.findWinningMove(board, this.humanPlayer, winLength);
      if (blockingMove) return blockingMove;
    }

    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  // Mediano AI: Good strategy with some randomness
  private getMedianoMove(
    board: Cell[][],
    emptyCells: AIMove[],
    isInfinityMode: boolean,
    moves: GameMove[],
    maxPieces: number,
    winLength: number
  ): AIMove {
    const winningMove = this.findWinningMove(board, this.aiPlayer, winLength);
    if (winningMove) return winningMove;

    const blockingMove = this.findWinningMove(board, this.humanPlayer, winLength);
    if (blockingMove) return blockingMove;

    if (isInfinityMode && moves.length >= maxPieces - 2) {
      const strategicMove = this.getInfinityStrategicMove(board, emptyCells, moves, maxPieces, winLength);
      if (strategicMove) return strategicMove;
    }

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
    maxPieces: number,
    winLength: number
  ): AIMove {
    const winningMove = this.findWinningMove(board, this.aiPlayer, winLength);
    if (winningMove) return winningMove;

    const blockingMove = this.findWinningMove(board, this.humanPlayer, winLength);
    if (blockingMove) return blockingMove;

    if (isInfinityMode) {
      return this.getInfinityOptimalMove(board, emptyCells, moves, maxPieces, winLength);
    }

    const maxDepth = this.getMaxDepth(board, 'expert');
    return this.minimaxMove(board, maxDepth, winLength);
  }

  // Challenger AI: Perfect play, nearly unbeatable
  private getChallengerMove(
    board: Cell[][],
    emptyCells: AIMove[],
    isInfinityMode: boolean,
    moves: GameMove[],
    maxPieces: number,
    winLength: number
  ): AIMove {
    const winningMove = this.findWinningMove(board, this.aiPlayer, winLength);
    if (winningMove) return winningMove;

    const blockingMove = this.findWinningMove(board, this.humanPlayer, winLength);
    if (blockingMove) return blockingMove;

    if (isInfinityMode) {
      return this.getInfinityOptimalMove(board, emptyCells, moves, maxPieces, winLength);
    }

    const maxDepth = this.getMaxDepth(board, 'challenger');
    return this.minimaxMove(board, maxDepth, winLength);
  }

  // Troll AI: Unpredictable personality - oscillates between genius and intentional blunders
  // Sometimes plays perfectly, sometimes "lets you win" only to crush you next round
  private getTrollMove(
    board: Cell[][],
    emptyCells: AIMove[],
    isInfinityMode: boolean,
    moves: GameMove[],
    maxPieces: number,
    winLength: number
  ): AIMove {
    const moveCount = board.flat().filter(c => c !== null).length;

    // Always take a winning move (with taunt)
    const winningMove = this.findWinningMove(board, this.aiPlayer, winLength);
    if (winningMove) {
      this.sendTrollMessage('win');
      return winningMove;
    }

    // 15% chance to INTENTIONALLY not block — let the human think they're winning
    const blockingMove = this.findWinningMove(board, this.humanPlayer, winLength);
    if (blockingMove) {
      if (Math.random() < 0.15 && moveCount < 6) {
        this.sendTrollMessage('fake_miss');
        // Play a non-blocking move on purpose
        const otherMoves = emptyCells.filter(m => m.row !== blockingMove.row || m.col !== blockingMove.col);
        if (otherMoves.length > 0) {
          return otherMoves[Math.floor(Math.random() * otherMoves.length)];
        }
      }
      this.sendTrollMessage('block');
      return blockingMove;
    }

    // 40% taunt chance (more frequent than before)
    if (Math.random() < 0.4) {
      this.sendTrollMessage('taunt');
    }

    // Troll personality: mix of strategies to be unpredictable
    const roll = Math.random();

    if (roll < 0.1 && emptyCells.length > 2) {
      // 10% chance: play a completely random move (fake "dumb" play)
      this.sendTrollMessage('fake_dumb');
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    if (isInfinityMode) {
      return this.getInfinityOptimalMove(board, emptyCells, moves, maxPieces, winLength);
    }

    // 70% expert minimax, 20% challenger-level (to keep human guessing)
    if (roll < 0.8) {
      const maxDepth = this.getMaxDepth(board, 'expert');
      return this.minimaxMove(board, maxDepth, winLength);
    } else {
      const maxDepth = this.getMaxDepth(board, 'challenger');
      return this.minimaxMove(board, maxDepth, winLength);
    }
  }

  // Calculate appropriate minimax depth based on board size and difficulty
  private getMaxDepth(board: Cell[][], level: 'expert' | 'challenger'): number {
    const size = board.length;
    const emptyCells = this.getEmptyCells(board).length;

    if (size <= 3) {
      // 3x3: Expert=6, Challenger=9 (full)
      return level === 'challenger' ? 9 : 6;
    } else if (size === 4) {
      // 4x4: limit depth to keep it responsive
      // Challenger goes deeper but still capped
      if (level === 'challenger') {
        return emptyCells <= 8 ? 8 : 5;
      }
      return emptyCells <= 8 ? 6 : 4;
    } else {
      // 5x5: even more limited
      if (level === 'challenger') {
        return emptyCells <= 10 ? 6 : 4;
      }
      return emptyCells <= 10 ? 5 : 3;
    }
  }

  // Minimax algorithm for optimal play - dynamic board size
  private minimaxMove(board: Cell[][], maxDepth: number = 6, winLength: number = 3): AIMove {
    const size = board.length;
    let bestMove: AIMove = { row: -1, col: -1, score: -Infinity };

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (board[row][col] === null) {
          board[row][col] = this.aiPlayer;
          const score = this.minimax(board, 0, false, -Infinity, Infinity, maxDepth, winLength);
          board[row][col] = null;

          if (score > bestMove.score!) {
            bestMove = { row, col, score };
          }
        }
      }
    }

    return bestMove;
  }

  // Troll message system.
  // The AI runs outside React, so it emits a *content id* instead of a literal;
  // TrollMessage resolves it through the i18n content registry. Only the count
  // per bucket lives here — the actual lines are in i18n/contentStrings.ts.
  private trollMessageCounts: Record<string, number> = {
    win: 5,
    block: 5,
    taunt: 8,
    fake_miss: 4,
    fake_dumb: 4,
  };

  private sendTrollMessage(type: string) {
    const count = this.trollMessageCounts[type];
    if (!count) return;
    const messageId = `troll.${type}.${Math.floor(Math.random() * count)}`;

    if (this.onTrollMessage) {
      this.onTrollMessage(messageId);
    }
  }

  // Callback for troll messages
  private onTrollMessage?: (message: string) => void;

  setTrollMessageCallback(callback: (message: string) => void) {
    this.onTrollMessage = callback;
  }

  // Minimax with alpha-beta pruning - dynamic board size
  private minimax(
    board: Cell[][],
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
    maxDepth: number = 6,
    winLength: number = 3
  ): number {
    const winner = this.checkWinner(board, winLength);

    if (winner === this.aiPlayer) return 10 - depth;
    if (winner === this.humanPlayer) return depth - 10;
    if (this.isBoardFull(board) || depth >= maxDepth) return 0;

    const size = board.length;

    if (isMaximizing) {
      let maxScore = -Infinity;

      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (board[row][col] === null) {
            board[row][col] = this.aiPlayer;
            const score = this.minimax(board, depth + 1, false, alpha, beta, maxDepth, winLength);
            board[row][col] = null;

            maxScore = Math.max(score, maxScore);
            alpha = Math.max(alpha, score);

            if (beta <= alpha) break;
          }
        }
        if (beta <= alpha) break;
      }

      return maxScore;
    } else {
      let minScore = Infinity;

      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (board[row][col] === null) {
            board[row][col] = this.humanPlayer;
            const score = this.minimax(board, depth + 1, true, alpha, beta, maxDepth, winLength);
            board[row][col] = null;

            minScore = Math.min(score, minScore);
            beta = Math.min(beta, score);

            if (beta <= alpha) break;
          }
        }
        if (beta <= alpha) break;
      }

      return minScore;
    }
  }

  // Strategic move selection - dynamic board size
  private getStrategicMove(board: Cell[][], emptyCells: AIMove[]): AIMove {
    const size = board.length;
    const center = Math.floor(size / 2);

    // Prefer center
    if (board[center][center] === null) {
      return { row: center, col: center };
    }

    // Prefer corners
    const corners = [
      { row: 0, col: 0 },
      { row: 0, col: size - 1 },
      { row: size - 1, col: 0 },
      { row: size - 1, col: size - 1 }
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
    maxPieces: number,
    winLength: number
  ): AIMove | null {
    if (moves.length >= maxPieces - 1) {
      const oldestMove = moves[0];
      const simulatedBoard = this.simulateBoardAfterRemoval(board, oldestMove);

      const winAfterRemoval = this.findWinningMove(simulatedBoard, this.aiPlayer, winLength);
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
    maxPieces: number,
    winLength: number
  ): AIMove {
    let bestMove: AIMove = emptyCells[0];
    let bestScore = -Infinity;

    for (const move of emptyCells) {
      const newBoard = board.map(row => [...row]);
      newBoard[move.row][move.col] = this.aiPlayer;

      let score = this.evaluateInfinityPosition(newBoard, moves, maxPieces, move, winLength);

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
    newMove: AIMove,
    winLength: number
  ): number {
    let score = 0;

    score += this.evaluatePosition(board, winLength);

    if (moves.length >= maxPieces) {
      const oldestMove = moves[0];
      const boardAfterRemoval = this.simulateBoardAfterRemoval(board, oldestMove);
      score += this.evaluatePosition(boardAfterRemoval, winLength) * 0.5;
    }

    return score;
  }

  // Basic position evaluation - dynamic board size and win length
  private evaluatePosition(board: Cell[][], winLength: number = 3): number {
    const size = board.length;
    let score = 0;

    // Collect all lines of length winLength
    const lines: Cell[][] = [];

    // Rows
    for (let r = 0; r < size; r++) {
      for (let c = 0; c <= size - winLength; c++) {
        lines.push(Array.from({ length: winLength }, (_, k) => board[r][c + k]));
      }
    }

    // Columns
    for (let c = 0; c < size; c++) {
      for (let r = 0; r <= size - winLength; r++) {
        lines.push(Array.from({ length: winLength }, (_, k) => board[r + k][c]));
      }
    }

    // Diagonals (top-left to bottom-right)
    for (let r = 0; r <= size - winLength; r++) {
      for (let c = 0; c <= size - winLength; c++) {
        lines.push(Array.from({ length: winLength }, (_, k) => board[r + k][c + k]));
      }
    }

    // Diagonals (top-right to bottom-left)
    for (let r = 0; r <= size - winLength; r++) {
      for (let c = winLength - 1; c < size; c++) {
        lines.push(Array.from({ length: winLength }, (_, k) => board[r + k][c - k]));
      }
    }

    for (const line of lines) {
      score += this.evaluateLine(line, winLength);
    }

    return score;
  }

  // Evaluate a single line - dynamic length
  private evaluateLine(line: Cell[], winLength: number): number {
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

    let score = 0;
    if (aiCount === winLength) score += 100;
    else if (aiCount === winLength - 1 && emptyCount === 1) score += 10;
    else if (aiCount >= 1 && emptyCount === winLength - aiCount) score += aiCount;

    if (humanCount === winLength) score -= 100;
    else if (humanCount === winLength - 1 && emptyCount === 1) score -= 10;
    else if (humanCount >= 1 && emptyCount === winLength - humanCount) score -= humanCount;

    return score;
  }

  // Helper methods - all dynamic board size
  private getEmptyCells(board: Cell[][]): AIMove[] {
    const emptyCells: AIMove[] = [];
    const size = board.length;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (board[row][col] === null) {
          emptyCells.push({ row, col });
        }
      }
    }
    return emptyCells;
  }

  private findWinningMove(board: Cell[][], player: Player, winLength: number = 3): AIMove | null {
    const size = board.length;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (board[row][col] === null) {
          board[row][col] = player;
          if (this.checkWinner(board, winLength) === player) {
            board[row][col] = null;
            return { row, col };
          }
          board[row][col] = null;
        }
      }
    }
    return null;
  }

  private checkWinner(board: Cell[][], winLength: number = 3): Player | null {
    const result = checkWinCondition(board, winLength);
    if (result) {
      // Return the player who occupies the winning cells
      const { row, col } = result.cells[0];
      return board[row][col];
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
    const size = board.length;
    return move.row >= 0 && move.row < size && move.col >= 0 && move.col < size &&
      board[move.row][move.col] === null;
  }

  // Simulate AI thinking time for better UX
  // Each difficulty has a range [min, max] to feel more human-like
  async simulateThinking(): Promise<void> {
    let minTime: number;
    let maxTime: number;

    switch (this.difficulty) {
      case 'noob':
        minTime = 150; maxTime = 500;
        break;
      case 'mediano':
        minTime = 300; maxTime = 700;
        break;
      case 'expert':
        minTime = 400; maxTime = 900;
        break;
      case 'challenger':
        minTime = 600; maxTime = 1200;
        break;
      case 'troll':
        // Troll has wider range — sometimes instant, sometimes slow (unpredictable)
        minTime = 100; maxTime = 1500;
        break;
      default:
        minTime = 300; maxTime = 700;
    }

    const delay = minTime + Math.random() * (maxTime - minTime);
    return new Promise(resolve => {
      setTimeout(resolve, delay);
    });
  }
}
