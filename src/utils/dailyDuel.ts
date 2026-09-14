import { Board, Cell, Player } from '../types/game';

/**
 * Daily Duel — one shared puzzle per calendar day, identical for every player.
 *
 * The puzzle is a mid-game position where X (the player) has at least one move
 * that forces a win against perfect defence. Everything is derived from the
 * date string, so no server is involved and two players on the same day always
 * get the same board — which is what makes the shared result meaningful.
 */

/** Day 1 of the Daily Duel, used to number the puzzles. */
const EPOCH = Date.UTC(2026, 0, 1); // 2026-01-01

export interface DailyPuzzle {
    /** Puzzle number shown to players (#1, #2, …). */
    number: number;
    /** Date key in YYYY-MM-DD (local time). */
    dateKey: string;
    /** Starting position — X is always to move. */
    board: Board;
    /** Fewest X moves needed to win with perfect play from both sides. */
    parMoves: number;
}

/** Local-date key, so the puzzle flips at the player's own midnight. */
export const getDateKey = (date: Date = new Date()): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const getPuzzleNumber = (dateKey: string): number => {
    const [y, m, d] = dateKey.split('-').map(Number);
    const utc = Date.UTC(y, m - 1, d);
    return Math.floor((utc - EPOCH) / 86400000) + 1;
};

/** Deterministic PRNG (mulberry32) seeded from the date string. */
const makeRng = (seed: string) => {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    let a = h >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const LINES: number[][] = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
];

type Flat = Cell[];

const flatten = (board: Board): Flat => board.flat();
const unflatten = (flat: Flat): Board => [
    [flat[0], flat[1], flat[2]],
    [flat[3], flat[4], flat[5]],
    [flat[6], flat[7], flat[8]],
];

const winnerOf = (f: Flat): Player | null => {
    for (const [a, b, c] of LINES) {
        if (f[a] && f[a] === f[b] && f[a] === f[c]) return f[a] as Player;
    }
    return null;
};

const isFull = (f: Flat): boolean => f.every(c => c !== null);

/**
 * Full minimax on a 3x3 board (instant — at most 9! leaves, memoised by the
 * shallow depth). Returns the score from X's perspective:
 *   +10 - depth  → X wins (sooner is better)
 *   depth - 10   → O wins
 *   0            → draw
 */
const minimax = (f: Flat, turn: Player, depth: number): number => {
    const w = winnerOf(f);
    if (w === 'X') return 10 - depth;
    if (w === 'O') return depth - 10;
    if (isFull(f)) return 0;

    if (turn === 'X') {
        let best = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (f[i] !== null) continue;
            f[i] = 'X';
            best = Math.max(best, minimax(f, 'O', depth + 1));
            f[i] = null;
        }
        return best;
    }

    let best = Infinity;
    for (let i = 0; i < 9; i++) {
        if (f[i] !== null) continue;
        f[i] = 'O';
        best = Math.min(best, minimax(f, 'X', depth + 1));
        f[i] = null;
    }
    return best;
};

/** Score of the position with `turn` to move, from X's perspective. */
export const evaluate = (board: Board, turn: Player): number =>
    minimax(flatten(board), turn, 0);

/** All indices that keep a forced X win (used to validate the player's move). */
const winningMoves = (f: Flat): number[] => {
    const moves: number[] = [];
    for (let i = 0; i < 9; i++) {
        if (f[i] !== null) continue;
        f[i] = 'X';
        const score = minimax(f, 'O', 1);
        f[i] = null;
        if (score > 0) moves.push(i);
    }
    return moves;
};

/** True when X, to move, can force a win against perfect defence. */
export const isForcedWinForX = (board: Board): boolean =>
    winningMoves(flatten(board)).length > 0;

/** Number of X moves needed to win with best play (X to move). */
const movesToWin = (f: Flat): number => {
    const score = minimax(f, 'X', 0);
    if (score <= 0) return 0;
    // score = 10 - depth, where depth counts plies. X moves on even plies,
    // so plies = 10 - score and X's own move count is ceil(plies / 2).
    const plies = 10 - score;
    return Math.ceil(plies / 2);
};

/** O's best defensive reply (maximally delays / avoids the loss). */
export const bestDefenceMove = (board: Board): { row: number; col: number } | null => {
    const f = flatten(board);
    let bestScore = Infinity;
    let bestIndex = -1;
    for (let i = 0; i < 9; i++) {
        if (f[i] !== null) continue;
        f[i] = 'O';
        const score = minimax(f, 'X', 1);
        f[i] = null;
        if (score < bestScore) {
            bestScore = score;
            bestIndex = i;
        }
    }
    if (bestIndex < 0) return null;
    return { row: Math.floor(bestIndex / 3), col: bestIndex % 3 };
};

/** Does this X move keep the win forced? */
export const isCorrectMove = (board: Board, row: number, col: number): boolean => {
    const f = flatten(board);
    const idx = row * 3 + col;
    if (f[idx] !== null) return false;
    f[idx] = 'X';
    return minimax(f, 'O', 1) > 0;
};

export const boardWinner = (board: Board): Player | null => winnerOf(flatten(board));
export const boardIsFull = (board: Board): boolean => isFull(flatten(board));

/**
 * Builds the puzzle for a given day: plays random legal moves from an empty
 * board until it lands on a position where X is to move and has a forced win.
 * Deterministic for a given dateKey.
 */
export const generateDailyPuzzle = (dateKey: string = getDateKey()): DailyPuzzle => {
    const rng = makeRng(dateKey);
    // Fallback if no multi-move puzzle turns up: the first 1-move one we saw.
    let easiest: { flat: Flat; par: number } | null = null;

    for (let attempt = 0; attempt < 600; attempt++) {
        const f: Flat = Array(9).fill(null);
        // 2 or 3 moves per side, so X is always to move on an even ply count
        const pairs = 2 + Math.floor(rng() * 2);
        let ok = true;

        for (let p = 0; p < pairs * 2; p++) {
            const empties: number[] = [];
            for (let i = 0; i < 9; i++) if (f[i] === null) empties.push(i);
            if (empties.length === 0) { ok = false; break; }
            const pick = empties[Math.floor(rng() * empties.length)];
            f[pick] = p % 2 === 0 ? 'X' : 'O';
            // A position that is already decided is not a puzzle
            if (winnerOf(f)) { ok = false; break; }
        }

        if (!ok) continue;

        const par = movesToWin([...f]);

        // Prefer a puzzle that takes 2–3 moves: a 1-move position is just
        // "spot the obvious win" and makes a poor daily challenge.
        if (par >= 2 && par <= 3) {
            return {
                number: getPuzzleNumber(dateKey),
                dateKey,
                board: unflatten(f),
                parMoves: par,
            };
        }

        if (par === 1 && !easiest) {
            easiest = { flat: [...f], par };
        }
    }

    if (easiest) {
        return {
            number: getPuzzleNumber(dateKey),
            dateKey,
            board: unflatten(easiest.flat),
            parMoves: easiest.par,
        };
    }

    // Deterministic fallback: a known forced-win position (X to move)
    const fallback: Flat = [
        'X', null, null,
        null, 'X', 'O',
        'O', null, null,
    ];
    return {
        number: getPuzzleNumber(dateKey),
        dateKey,
        board: unflatten(fallback),
        parMoves: movesToWin([...fallback]) || 2,
    };
};
