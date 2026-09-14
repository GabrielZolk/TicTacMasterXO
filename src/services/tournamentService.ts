import AsyncStorage from '@react-native-async-storage/async-storage';
import { TournamentState, TOURNAMENT_CONFIG } from '../types/tournament';
import { storeService } from './storeService';
import { chestService } from './chestService';

const STORAGE_KEY = '@tournament_state';

const INITIAL_STATE: TournamentState = {
    isActive: false,
    currentRound: 0,
    wins: 0,
    lost: false,
};

class TournamentService {
    private state: TournamentState = { ...INITIAL_STATE };
    private listeners: Set<() => void> = new Set();
    // Time-based dedupe: avoid double-recording due to remount races.
    private lastRecordedAt: number = 0;
    private lastRecordedResult: any = null;

    /**
     * Restores an in-progress tournament. The entry fee (50 ⭐) is charged at
     * start(), so keeping the run only in memory meant a crash, a force-close
     * or the OS reaping the app silently burned those stars with no way to
     * resume and no refund.
     */
    async initialize(): Promise<void> {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = { ...INITIAL_STATE, ...JSON.parse(raw) };
                // Discard a corrupt/finished run rather than resuming into it
                if (parsed.isActive && parsed.currentRound < TOURNAMENT_CONFIG.rounds.length) {
                    this.state = parsed;
                } else {
                    this.state = { ...INITIAL_STATE };
                    await AsyncStorage.removeItem(STORAGE_KEY);
                }
            }
        } catch (error) {
            console.error('Failed to restore tournament state:', error);
            this.state = { ...INITIAL_STATE };
        }
        this.notifyListeners();
    }

    private async persist(): Promise<void> {
        try {
            if (this.state.isActive) {
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
            } else {
                await AsyncStorage.removeItem(STORAGE_KEY);
            }
        } catch (error) {
            console.error('Failed to persist tournament state:', error);
        }
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(l => l());
    }

    getState(): TournamentState {
        return { ...this.state };
    }

    getConfig() {
        return TOURNAMENT_CONFIG;
    }

    isActive(): boolean {
        return this.state.isActive;
    }

    getCurrentRound() {
        if (!this.state.isActive) return null;
        return TOURNAMENT_CONFIG.rounds[this.state.currentRound] || null;
    }

    async start(): Promise<boolean> {
        // Deduct entry fee
        const wallet = await storeService.getWallet();
        if (wallet.stars < TOURNAMENT_CONFIG.entryFee) {
            return false;
        }

        const spent = await storeService.spendCurrency(
            'stars',
            TOURNAMENT_CONFIG.entryFee,
            'tournament_entry',
            'Entrada no Torneio'
        );
        if (!spent) return false;

        this.state = {
            isActive: true,
            currentRound: 0,
            wins: 0,
            lost: false,
        };
        this.lastRecordedAt = 0;
        this.lastRecordedResult = null;
        await this.persist();
        this.notifyListeners();
        return true;
    }

    // Tier rewards — proportional to real wins
    // Each win is worth ~100⭐ + chest tier scales with total wins
    private getCompletionReward(totalWins: number): { stars: number; chest: 'common' | 'rare' | 'epic' | null } {
        switch (totalWins) {
            case 3: return { stars: 300, chest: 'epic' };
            case 2: return { stars: 200, chest: 'rare' };
            case 1: return { stars: 100, chest: 'common' };
            case 0: return { stars: 50, chest: null }; // passou só empatando
            default: return { stars: 50, chest: null };
        }
    }

    // Called after each tournament game
    async recordResult(won: boolean, isDraw: boolean = false): Promise<{
        tournamentOver: boolean;
        won: boolean;
        isDraw: boolean;
        totalWins: number;
        reward?: { stars: number; chest?: string };
    }> {
        if (!this.state.isActive) {
            return { tournamentOver: true, won: false, isDraw: false, totalWins: 0 };
        }

        // Anti-duplicate: if recordResult was just called (within 1.5s) with the
        // same outcome, return the cached result instead of advancing the round
        // again. Protects against remount races (e.g. navigation.replace)
        // where a fresh GameScreen sees the previous game's terminal state and
        // re-fires the recording effect before the parent context resets.
        const now = Date.now();
        if (this.lastRecordedResult && now - this.lastRecordedAt < 1500) {
            return this.lastRecordedResult;
        }

        // Helper: cache result so the dedupe at the top of this method can
        // return it on a duplicate call without mutating state again.
        const cache = (result: any) => {
            this.lastRecordedAt = Date.now();
            this.lastRecordedResult = result;
            return result;
        };

        // DRAW: advance the round but don't count as a win (no bonus)
        if (isDraw) {
            this.state.currentRound++;

            // Tournament finished after draw on last round
            if (this.state.currentRound >= TOURNAMENT_CONFIG.rounds.length) {
                const completion = this.getCompletionReward(this.state.wins);
                if (completion.stars > 0) {
                    await storeService.addCurrency('stars', completion.stars, `Torneio (${this.state.wins}v)`);
                }
                if (completion.chest) {
                    await chestService.grantChest(completion.chest);
                }
                this.state.isActive = false;
                await this.persist();
                this.notifyListeners();
                return cache({
                    tournamentOver: true,
                    won: this.state.wins === TOURNAMENT_CONFIG.rounds.length, // só "won" se 3 vitórias REAIS
                    isDraw: false,
                    totalWins: this.state.wins,
                    reward: { stars: completion.stars, chest: completion.chest || undefined },
                });
            }

            // Still has rounds to play
            await this.persist();
            this.notifyListeners();
            return cache({
                tournamentOver: false,
                won: false,
                isDraw: true,
                totalWins: this.state.wins,
            });
        }

        // WIN: advance + count win + bonus
        if (won) {
            this.state.wins++;
            this.state.currentRound++;

            // Tournament completed (last round)
            if (this.state.currentRound >= TOURNAMENT_CONFIG.rounds.length) {
                const completion = this.getCompletionReward(this.state.wins);
                if (completion.stars > 0) {
                    await storeService.addCurrency('stars', completion.stars, `Torneio (${this.state.wins}v)`);
                }
                if (completion.chest) {
                    await chestService.grantChest(completion.chest);
                }
                this.state.isActive = false;
                await this.persist();
                this.notifyListeners();
                return cache({
                    tournamentOver: true,
                    won: this.state.wins === TOURNAMENT_CONFIG.rounds.length,
                    isDraw: false,
                    totalWins: this.state.wins,
                    reward: { stars: completion.stars, chest: completion.chest || undefined },
                });
            }

            // More rounds to play
            await this.persist();
            this.notifyListeners();
            return cache({
                tournamentOver: false,
                won: true,
                isDraw: false,
                totalWins: this.state.wins,
            });
        }

        // LOSS — tournament over (eliminated)
        this.state.lost = true;
        this.state.isActive = false;

        const consolation = TOURNAMENT_CONFIG.rewards.loss;
        if (consolation.stars > 0) {
            await storeService.addCurrency('stars', consolation.stars, 'Torneio — consolacao');
        }

        await this.persist();
        this.notifyListeners();
        return cache({
            tournamentOver: true,
            won: false,
            isDraw: false,
            totalWins: this.state.wins,
            reward: { stars: consolation.stars },
        });
    }

    cancel(): void {
        this.state = { ...INITIAL_STATE };
        this.lastRecordedAt = 0;
        this.lastRecordedResult = null;
        // Fire-and-forget: clears the persisted run so it isn't resumed later
        this.persist().catch(() => {});
        this.notifyListeners();
    }
}

export const tournamentService = new TournamentService();
