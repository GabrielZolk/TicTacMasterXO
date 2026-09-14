import AsyncStorage from '@react-native-async-storage/async-storage';
import { RankedProfile, RANKED_POINTS, getLeagueForPoints, LeagueTier } from '../types/ranked';
import { Difficulty } from '../types/game';

const STORAGE_KEY = '@tictacmasterxo:ranked';

const INITIAL_PROFILE: RankedProfile = {
    points: 0,
    tier: 'bronze',
    wins: 0,
    losses: 0,
    draws: 0,
    winStreak: 0,
    bestStreak: 0,
    gamesPlayed: 0,
    seasonId: 'season_1',
};

class RankedService {
    private profile: RankedProfile | null = null;
    private listeners: Set<() => void> = new Set();

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(l => l());
    }

    async initialize(): Promise<RankedProfile> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (data) {
                // Merge over defaults: a profile saved by an older version is
                // missing any field added since, and `undefined + points` is NaN.
                this.profile = { ...INITIAL_PROFILE, ...JSON.parse(data) };
            } else {
                this.profile = { ...INITIAL_PROFILE };
            }
            await this.save();
            return this.profile!;
        } catch (error) {
            console.error('Error initializing ranked:', error);
            this.profile = { ...INITIAL_PROFILE };
            return this.profile;
        }
    }

    private async save(): Promise<void> {
        if (this.profile) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
        }
    }

    async getProfile(): Promise<RankedProfile> {
        if (!this.profile) await this.initialize();
        return this.profile!;
    }

    private getDifficultyMultiplier(difficulty?: Difficulty): number {
        switch (difficulty) {
            case 'noob': return RANKED_POINTS.DIFF_NOOB;
            case 'mediano': return RANKED_POINTS.DIFF_MEDIANO;
            case 'expert': return RANKED_POINTS.DIFF_EXPERT;
            case 'challenger': return RANKED_POINTS.DIFF_CHALLENGER;
            case 'troll': return RANKED_POINTS.DIFF_TROLL;
            default: return 1.0; // online/human
        }
    }

    async recordGame(
        won: boolean,
        isDraw: boolean,
        difficulty?: Difficulty
    ): Promise<{ pointsChange: number; newTier: LeagueTier; promoted: boolean; demoted: boolean }> {
        if (!this.profile) await this.initialize();

        const oldTier = this.profile!.tier;
        const multiplier = this.getDifficultyMultiplier(difficulty);
        let pointsChange = 0;

        if (isDraw) {
            pointsChange = Math.round(RANKED_POINTS.DRAW * multiplier);
            this.profile!.draws++;
            this.profile!.winStreak = 0;
        } else if (won) {
            this.profile!.winStreak++;
            if (this.profile!.winStreak > this.profile!.bestStreak) {
                this.profile!.bestStreak = this.profile!.winStreak;
            }
            const streakBonus = Math.max(0, (this.profile!.winStreak - 1)) * RANKED_POINTS.WIN_STREAK_BONUS;
            pointsChange = Math.round((RANKED_POINTS.WIN_BASE + streakBonus) * multiplier);
            this.profile!.wins++;
        } else {
            pointsChange = Math.round(RANKED_POINTS.LOSS_BASE * multiplier);
            this.profile!.winStreak = 0;
            this.profile!.losses++;
        }

        this.profile!.points = Math.max(0, this.profile!.points + pointsChange);
        this.profile!.gamesPlayed++;

        const newLeague = getLeagueForPoints(this.profile!.points);
        this.profile!.tier = newLeague.tier;

        await this.save();
        this.notifyListeners();

        return {
            pointsChange,
            newTier: newLeague.tier,
            promoted: newLeague.tier !== oldTier && this.profile!.points > 0 && RANKED_POINTS.WIN_BASE > 0 && won,
            demoted: newLeague.tier !== oldTier && !won && !isDraw,
        };
    }

    async reset(): Promise<void> {
        this.profile = { ...INITIAL_PROFILE };
        await this.save();
        this.notifyListeners();
    }
}

export const rankedService = new RankedService();
