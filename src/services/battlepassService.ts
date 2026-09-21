import AsyncStorage from '@react-native-async-storage/async-storage';
import { BattlePassProgress, BattlePassReward, BATTLEPASS_XP } from '../types/battlepass';
import { CURRENT_SEASON } from '../data/battlepassSeasons';
import { storeService } from './storeService';

const STORAGE_KEY = '@tictacmasterxo:battlepass';

const INITIAL_PROGRESS: BattlePassProgress = {
    seasonId: CURRENT_SEASON.id,
    currentXp: 0,
    currentLevel: 0,
    isPremium: false,
    claimedFreeRewards: [],
    claimedPremiumRewards: [],
};

class BattlePassService {
    private progress: BattlePassProgress | null = null;
    private listeners: Set<() => void> = new Set();

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(l => l());
    }

    async initialize(): Promise<BattlePassProgress> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data) as BattlePassProgress;
                // Reset if season changed
                if (parsed.seasonId !== CURRENT_SEASON.id) {
                    this.progress = { ...INITIAL_PROGRESS };
                } else {
                    this.progress = parsed;
                }
            } else {
                this.progress = { ...INITIAL_PROGRESS };
            }
            await this.save();
            return this.progress;
        } catch (error) {
            console.error('Error initializing battle pass:', error);
            this.progress = { ...INITIAL_PROGRESS };
            return this.progress;
        }
    }

    private async save(): Promise<void> {
        if (this.progress) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
        }
    }

    async getProgress(): Promise<BattlePassProgress> {
        if (!this.progress) await this.initialize();
        // A COPY, never the live object. `claimReward` and `addXp` mutate
        // `this.progress` in place, so handing the same reference out meant the
        // screen's `setProgress(p)` was given the very object it already held —
        // and React skips the re-render when the identity matches. The claimed
        // tier stayed drawn as unclaimed until the screen was closed and opened
        // again, which is exactly what "precisa sair e entrar" looked like.
        // The arrays are copied too: `claimedFreeRewards.push` would otherwise
        // keep mutating a snapshot the caller had already taken.
        return {
            ...this.progress!,
            claimedFreeRewards: [...this.progress!.claimedFreeRewards],
            claimedPremiumRewards: [...this.progress!.claimedPremiumRewards],
        };
    }

    getSeason() {
        return CURRENT_SEASON;
    }

    isSeasonActive(): boolean {
        const now = Date.now();
        return now >= CURRENT_SEASON.startDate && now <= CURRENT_SEASON.endDate;
    }

    getDaysRemaining(): number {
        const diff = CURRENT_SEASON.endDate - Date.now();
        return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
    }

    // Add XP and level up if needed
    async addXp(amount: number): Promise<{ leveledUp: boolean; newLevel: number }> {
        if (!this.progress) await this.initialize();

        this.progress!.currentXp += amount;

        // Check for level ups
        let leveledUp = false;
        const tiers = CURRENT_SEASON.tiers;

        for (const tier of tiers) {
            if (this.progress!.currentLevel < tier.level && this.progress!.currentXp >= tier.xpRequired) {
                this.progress!.currentLevel = tier.level;
                leveledUp = true;
            }
        }

        await this.save();
        this.notifyListeners();
        return { leveledUp, newLevel: this.progress!.currentLevel };
    }

    // Called after a game ends — returns xp gained and level up info
    async onGameEnd(won: boolean, isDraw: boolean, isSpecialMode: boolean, currentStreak: number): Promise<{ xp: number; leveledUp: boolean; newLevel: number }> {
        let xp = 0;

        if (won) {
            xp += BATTLEPASS_XP.WIN;
            if (isSpecialMode) xp += BATTLEPASS_XP.SPECIAL_MODE_WIN;
            if (currentStreak === 3) xp += BATTLEPASS_XP.WIN_STREAK_3;
            if (currentStreak === 5) xp += BATTLEPASS_XP.WIN_STREAK_5;
        } else if (isDraw) {
            xp += BATTLEPASS_XP.DRAW;
        } else {
            xp += BATTLEPASS_XP.LOSS;
        }

        if (xp > 0) {
            const result = await this.addXp(xp);
            return { xp, ...result };
        }
        return { xp: 0, leveledUp: false, newLevel: this.progress?.currentLevel || 0 };
    }

    async onDailyLogin(): Promise<number> {
        await this.addXp(BATTLEPASS_XP.DAILY_LOGIN);
        return BATTLEPASS_XP.DAILY_LOGIN;
    }

    // Claim a reward
    async claimReward(level: number, isPremiumReward: boolean): Promise<{ success: boolean; reward?: BattlePassReward }> {
        if (!this.progress) await this.initialize();

        // Validate level is reached
        if (this.progress!.currentLevel < level) {
            return { success: false };
        }

        // Check premium access
        if (isPremiumReward && !this.progress!.isPremium) {
            return { success: false };
        }

        // Check already claimed
        const claimedList = isPremiumReward ? this.progress!.claimedPremiumRewards : this.progress!.claimedFreeRewards;
        if (claimedList.includes(level)) {
            return { success: false };
        }

        // Find the reward
        const tier = CURRENT_SEASON.tiers.find(t => t.level === level);
        if (!tier) return { success: false };

        const reward = isPremiumReward ? tier.premiumReward : tier.freeReward;

        // Mark as claimed BEFORE awaiting the grant. Marking afterwards left an
        // await-sized window where a second tap passed the same guard and the
        // reward was paid twice.
        claimedList.push(level);

        // Grant the reward
        if (reward.type === 'stars' && reward.amount) {
            await storeService.addCurrency('stars', reward.amount, `Battle Pass Nível ${level}`);
        } else if (reward.id) {
            await storeService.grantItem(reward.id);
        }

        await this.save();
        this.notifyListeners();

        return { success: true, reward };
    }

    async setPremium(isPremium: boolean): Promise<void> {
        if (!this.progress) await this.initialize();
        this.progress!.isPremium = isPremium;
        await this.save();
        this.notifyListeners();
    }

    async reset(): Promise<void> {
        this.progress = { ...INITIAL_PROGRESS };
        await this.save();
        this.notifyListeners();
    }
}

export const battlepassService = new BattlePassService();
