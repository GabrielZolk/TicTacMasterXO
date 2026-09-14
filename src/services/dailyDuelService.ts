import AsyncStorage from '@react-native-async-storage/async-storage';
import { storeService } from './storeService';
import { chestService } from './chestService';
import { DailyPuzzle, generateDailyPuzzle, getDateKey } from '../utils/dailyDuel';

const STORAGE_KEY = '@daily_duel';

export const MAX_ATTEMPTS = 3;
/** Stars for solving, indexed by attempts used (1-based). */
const REWARD_BY_ATTEMPT = [0, 120, 70, 40];

export interface DailyDuelState {
    /** Date key of the last duel the player engaged with. */
    lastPlayedDate: string;
    /** Attempts used today (0..MAX_ATTEMPTS). */
    attemptsUsed: number;
    /** Solved today? */
    solved: boolean;
    /** Moves the player needed on the successful attempt. */
    movesUsed: number;
    /** Ran out of attempts today. */
    failed: boolean;
    /** Consecutive days solved. */
    streak: number;
    bestStreak: number;
    /** Total duels solved, all time. */
    totalSolved: number;
}

const INITIAL_STATE: DailyDuelState = {
    lastPlayedDate: '',
    attemptsUsed: 0,
    solved: false,
    movesUsed: 0,
    failed: false,
    streak: 0,
    bestStreak: 0,
    totalSolved: 0,
};

const isYesterday = (dateKey: string, todayKey: string): boolean => {
    if (!dateKey) return false;
    const [y, m, d] = dateKey.split('-').map(Number);
    const [ty, tm, td] = todayKey.split('-').map(Number);
    const prev = Date.UTC(ty, tm - 1, td) - 86400000;
    return Date.UTC(y, m - 1, d) === prev;
};

class DailyDuelService {
    private state: DailyDuelState = { ...INITIAL_STATE };
    private puzzle: DailyPuzzle | null = null;
    private listeners: Set<() => void> = new Set();

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(l => l());
    }

    async initialize(): Promise<DailyDuelState> {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            this.state = raw
                ? { ...INITIAL_STATE, ...JSON.parse(raw) }
                : { ...INITIAL_STATE };
        } catch {
            this.state = { ...INITIAL_STATE };
        }

        this.rolloverIfNeeded();
        return this.state;
    }

    /** Resets today's progress when the calendar day changed. */
    private rolloverIfNeeded(): void {
        const today = getDateKey();
        if (this.state.lastPlayedDate === today) return;

        // Missing a day breaks the streak. Solving yesterday keeps it.
        if (!isYesterday(this.state.lastPlayedDate, today)) {
            this.state.streak = 0;
        }

        this.state.lastPlayedDate = today;
        this.state.attemptsUsed = 0;
        this.state.solved = false;
        this.state.failed = false;
        this.state.movesUsed = 0;
        this.puzzle = null;
    }

    getState(): DailyDuelState {
        this.rolloverIfNeeded();
        return { ...this.state };
    }

    /** Today's puzzle (same for every player on the same date). */
    getTodayPuzzle(): DailyPuzzle {
        this.rolloverIfNeeded();
        if (!this.puzzle || this.puzzle.dateKey !== getDateKey()) {
            this.puzzle = generateDailyPuzzle(getDateKey());
        }
        return this.puzzle;
    }

    /** True when the player can still start an attempt today. */
    canPlay(): boolean {
        const s = this.getState();
        return !s.solved && !s.failed && s.attemptsUsed < MAX_ATTEMPTS;
    }

    private async save(): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save daily duel state:', error);
        }
    }

    /** Consumes one attempt. Call when the player makes a losing move. */
    async recordFailedAttempt(): Promise<DailyDuelState> {
        this.rolloverIfNeeded();
        if (this.state.solved) return { ...this.state };

        this.state.attemptsUsed = Math.min(this.state.attemptsUsed + 1, MAX_ATTEMPTS);
        if (this.state.attemptsUsed >= MAX_ATTEMPTS) {
            this.state.failed = true;
            this.state.streak = 0;
        }

        await this.save();
        this.notifyListeners();
        return { ...this.state };
    }

    /** Records a solve and pays the reward. Idempotent for the day. */
    async recordSolved(movesUsed: number): Promise<{ state: DailyDuelState; stars: number; chest: boolean }> {
        this.rolloverIfNeeded();
        if (this.state.solved) {
            return { state: { ...this.state }, stars: 0, chest: false };
        }

        // Mark before awaiting so a double tap can't pay out twice.
        this.state.solved = true;
        this.state.movesUsed = movesUsed;
        this.state.attemptsUsed = Math.min(this.state.attemptsUsed + 1, MAX_ATTEMPTS);
        this.state.streak += 1;
        this.state.bestStreak = Math.max(this.state.bestStreak, this.state.streak);
        this.state.totalSolved += 1;

        const stars = REWARD_BY_ATTEMPT[this.state.attemptsUsed] ?? 40;
        // A 7-day streak also drops a chest — the reason to come back daily.
        const chest = this.state.streak > 0 && this.state.streak % 7 === 0;

        await this.save();

        try {
            if (stars > 0) {
                await storeService.addCurrency('stars', stars, `Duelo do Dia #${this.getTodayPuzzle().number}`);
            }
            if (chest) {
                await chestService.grantChest('epic');
            }
        } catch (error) {
            console.error('Failed to grant daily duel reward:', error);
        }

        this.notifyListeners();
        return { state: { ...this.state }, stars, chest };
    }

    /**
     * Wordle-style shareable result. Emoji squares encode the attempt the
     * player solved it on, so friends can compare without spoiling the board.
     */
    getShareText(): string {
        const s = this.getState();
        const puzzle = this.getTodayPuzzle();

        const squares: string[] = [];
        for (let i = 1; i <= MAX_ATTEMPTS; i++) {
            if (s.solved && i === s.attemptsUsed) squares.push('🟩');
            else if (i <= s.attemptsUsed) squares.push('🟥');
            else squares.push('⬜');
        }

        const scoreLine = s.solved
            ? `${s.attemptsUsed}/${MAX_ATTEMPTS}`
            : `X/${MAX_ATTEMPTS}`;

        const streakLine = s.streak > 1 ? `\n🔥 ${s.streak} dias seguidos` : '';

        return (
            `TicTac Duelo do Dia #${puzzle.number} ${scoreLine}\n` +
            `${squares.join('')}${streakLine}\n\n` +
            `Consegue vencer em ${puzzle.parMoves} jogada${puzzle.parMoves > 1 ? 's' : ''}?\n` +
            `https://play.google.com/store/apps/details?id=com.zolk.TicTacMasterXO`
        );
    }
}

export const dailyDuelService = new DailyDuelService();
