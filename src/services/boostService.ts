import AsyncStorage from '@react-native-async-storage/async-storage';
import { BOOSTS, BoostItem } from '../types/boosts';
import { storeService } from './storeService';

const STORAGE_KEY = '@tictacmasterxo:boosts';

interface BoostInventory {
    [boostId: string]: number; // quantity owned
}

class BoostService {
    private inventory: BoostInventory = {};
    private listeners: Set<() => void> = new Set();

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(l => l());
    }

    private initialized = false;

    async initialize(): Promise<void> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                this.inventory = parsed && typeof parsed === 'object' ? parsed : {};
            }
        } catch (error) {
            console.error('Error initializing boosts:', error);
        } finally {
            this.initialized = true;
        }
    }

    /**
     * Grants boosts without charging stars (chest rewards, gifts).
     * Chests used to reach into this service's private inventory via `as any`,
     * which skipped notifyListeners (counters went stale) and could clobber the
     * player's real inventory if it hadn't loaded yet.
     */
    async grant(boostId: string, amount: number = 1): Promise<void> {
        if (amount <= 0) return;
        // Never write before the stored inventory has been read back
        if (!this.initialized) {
            await this.initialize();
        }
        this.inventory[boostId] = (this.inventory[boostId] || 0) + amount;
        await this.save();
        this.notifyListeners();
    }

    private async save(): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.inventory));
    }

    getQuantity(boostId: string): number {
        return this.inventory[boostId] || 0;
    }

    getAll(): { boost: BoostItem; quantity: number }[] {
        return BOOSTS.map(boost => ({
            boost,
            quantity: this.getQuantity(boost.id),
        }));
    }

    async purchase(boostId: string): Promise<boolean> {
        const boost = BOOSTS.find(b => b.id === boostId);
        if (!boost) return false;

        const spent = await storeService.spendCurrency('stars', boost.price, boostId, `Comprou boost: ${boost.name}`);
        if (!spent) return false;

        this.inventory[boostId] = (this.inventory[boostId] || 0) + 1;
        await this.save();
        this.notifyListeners();
        return true;
    }

    async use(boostId: string): Promise<boolean> {
        if (this.getQuantity(boostId) <= 0) return false;

        this.inventory[boostId]--;
        await this.save();
        this.notifyListeners();
        return true;
    }

    async reset(): Promise<void> {
        this.inventory = {};
        await this.save();
        this.notifyListeners();
    }
}

export const boostService = new BoostService();
