import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChestRarity, ChestReward, CHEST_CONFIGS } from '../types/chest';
import { storeService } from './storeService';
import { boostService } from './boostService';

const STORAGE_KEY = '@tictacmasterxo:chests';

interface ChestState {
    pendingChests: ChestRarity[];      // chests waiting to be opened
    gamesUntilNextChest: number;       // countdown to next chest drop
    totalChestsOpened: number;
    lastChestTime: number;
}

const INITIAL_STATE: ChestState = {
    pendingChests: [],
    gamesUntilNextChest: 1, // First chest drops on first win (good onboarding)
    totalChestsOpened: 0,
    lastChestTime: 0,
};

class ChestService {
    private state: ChestState | null = null;
    private listeners: Set<() => void> = new Set();

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(l => l());
    }

    async initialize(): Promise<void> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            // Merge over defaults so state saved by an older version still has
            // every field (a missing counter would read undefined and NaN out).
            const loaded: ChestState = data
                ? { ...INITIAL_STATE, ...JSON.parse(data) }
                : { ...INITIAL_STATE };
            if (!Array.isArray(loaded.pendingChests)) {
                loaded.pendingChests = [];
            }
            this.state = loaded;
        } catch {
            this.state = { ...INITIAL_STATE };
        }
    }

    /** Lifetime chests opened — feeds the "chests_opened" achievement. */
    getTotalOpened(): number {
        return this.state?.totalChestsOpened || 0;
    }

    private async save(): Promise<void> {
        if (this.state) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        }
    }

    private getState(): ChestState {
        return this.state || INITIAL_STATE;
    }

    getPendingChests(): ChestRarity[] {
        return this.getState().pendingChests;
    }

    hasPendingChest(): boolean {
        return this.getState().pendingChests.length > 0;
    }

    // Grant a chest directly (for tournament wins, admin rewards, etc.)
    async grantChest(rarity: ChestRarity): Promise<void> {
        if (!this.state) await this.initialize();
        this.state!.pendingChests.push(rarity);
        await this.save();
        this.notifyListeners();
    }

    // Called after a win — may drop a chest
    async onWin(): Promise<ChestRarity | null> {
        if (!this.state) await this.initialize();

        this.state!.gamesUntilNextChest--;

        if (this.state!.gamesUntilNextChest <= 0) {
            // Drop a chest! Determine rarity
            const rarity = this.rollChestRarity();
            this.state!.pendingChests.push(rarity);

            // Reset countdown: 2-5 games until next chest
            this.state!.gamesUntilNextChest = 2 + Math.floor(Math.random() * 4);

            await this.save();
            this.notifyListeners();
            return rarity;
        }

        await this.save();
        return null;
    }

    private rollChestRarity(): ChestRarity {
        const roll = Math.random() * 100;
        if (roll < 5) return 'epic';      // 5%
        if (roll < 25) return 'rare';     // 20%
        return 'common';                   // 75%
    }

    // Open a chest and get rewards
    async openChest(index: number = 0): Promise<ChestReward[]> {
        if (!this.state) await this.initialize();

        const chests = this.state!.pendingChests;
        if (index < 0 || index >= chests.length) return [];

        const rarity = chests[index];
        // Defensive: validate rarity exists in CHEST_CONFIGS
        const config = CHEST_CONFIGS[rarity];
        if (!config) {
            console.warn('Invalid chest rarity, removing:', rarity);
            chests.splice(index, 1);
            await this.save();
            this.notifyListeners();
            return [];
        }
        const rewards: ChestReward[] = [];

        // Pick rewards based on weights
        for (let i = 0; i < config.rewardCount; i++) {
            const reward = this.pickWeightedReward(config.possibleRewards);
            if (reward) rewards.push(reward);
        }

        // Grant all rewards
        for (const reward of rewards) {
            await this.grantReward(reward);
        }

        // Remove opened chest
        chests.splice(index, 1);
        this.state!.totalChestsOpened++;
        this.state!.lastChestTime = Date.now();

        await this.save();
        this.notifyListeners();
        return rewards;
    }

    // Open chest instantly by watching ad (no cost)
    async openChestWithAd(index: number = 0): Promise<ChestReward[] | null> {
        // Caller should show rewarded ad first, then call this
        return this.openChest(index);
    }

    // Open chest by spending stars
    async openChestWithStars(index: number = 0): Promise<ChestReward[] | null> {
        if (!this.state) await this.initialize();
        const chests = this.state!.pendingChests;
        if (index >= chests.length) return null;

        const rarity = chests[index];
        const cost = rarity === 'epic' ? 50 : rarity === 'rare' ? 30 : 15;

        const spent = await storeService.spendCurrency('stars', cost, `chest_${rarity}`, `Abrir ${CHEST_CONFIGS[rarity].name}`);
        if (!spent) return null;

        return this.openChest(index);
    }

    private pickWeightedReward(pool: { reward: ChestReward; weight: number }[]): ChestReward {
        const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
        let roll = Math.random() * totalWeight;

        for (const item of pool) {
            roll -= item.weight;
            if (roll <= 0) return { ...item.reward };
        }

        return { ...pool[pool.length - 1].reward };
    }

    private async grantReward(reward: ChestReward): Promise<void> {
        switch (reward.type) {
            case 'stars':
                if (reward.amount) {
                    await storeService.addCurrency('stars', reward.amount, `Bau: ${reward.name}`);
                }
                break;
            case 'boost':
                if (reward.id && reward.amount) {
                    // Public API: persists AND notifies, so boost counters in
                    // the store and game screens refresh immediately.
                    await boostService.grant(reward.id, reward.amount);
                }
                break;
            case 'item':
                if (reward.id) {
                    await storeService.grantItem(reward.id);
                }
                break;
        }
    }

    async reset(): Promise<void> {
        this.state = { ...INITIAL_STATE };
        await this.save();
        this.notifyListeners();
    }
}

export const chestService = new ChestService();
