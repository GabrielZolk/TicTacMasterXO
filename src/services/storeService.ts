import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    StoreData,
    PlayerWallet,
    PlayerInventory,
    Transaction,
    CurrencyType,
    StoreItem,
    REWARD_AMOUNTS,
} from '../types/store';

const STORE_DATA_KEY = '@tictacmasterxo:store_data';

// Dados iniciais da loja
const INITIAL_STORE_DATA: StoreData = {
    wallet: {
        stars: 100, // Jogadores começam com 100 stars
        lastUpdated: Date.now(),
    },
    inventory: {
        ownedItems: ['theme_dark', 'theme_light', 'symbols_default', 'effect_none'], // Itens gratuitos iniciais
        equippedTheme: 'theme_dark',
        equippedSymbols: 'symbols_default',
        equippedEffect: 'effect_none',
    },
    transactions: [],
    consecutiveDays: 0,
};

class StoreService {
    private storeData: StoreData | null = null;
    private listeners: Set<() => void> = new Set();

    // Subscribe to inventory changes
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    // Notify all listeners
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }

    // ==================== INICIALIZAÇÃO ====================

    async initialize(): Promise<StoreData> {
        try {
            const data = await AsyncStorage.getItem(STORE_DATA_KEY);

            if (data) {
                this.storeData = JSON.parse(data);
                return this.storeData!;
            } else {
                // Primeira vez - criar dados iniciais
                this.storeData = INITIAL_STORE_DATA;
                await this.save();
                return this.storeData;
            }
        } catch (error) {
            console.error('Error initializing store:', error);
            this.storeData = INITIAL_STORE_DATA;
            return this.storeData;
        }
    }

    async save(): Promise<void> {
        try {
            if (this.storeData) {
                await AsyncStorage.setItem(STORE_DATA_KEY, JSON.stringify(this.storeData));
            }
        } catch (error) {
            console.error('Error saving store data:', error);
        }
    }

    // ==================== WALLET ====================

    async getWallet(): Promise<PlayerWallet> {
        if (!this.storeData) {
            await this.initialize();
        }
        return this.storeData!.wallet;
    }

    async getCurrency(type: CurrencyType): Promise<number> {
        const wallet = await this.getWallet();
        return wallet[type];
    }

    async addCurrency(
        type: CurrencyType,
        amount: number,
        reason: string
    ): Promise<boolean> {
        try {
            if (!this.storeData) {
                await this.initialize();
            }

            this.storeData!.wallet[type] += amount;
            this.storeData!.wallet.lastUpdated = Date.now();

            // Adicionar transação
            const transaction: Transaction = {
                id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'earn',
                currency: type,
                amount,
                reason,
                timestamp: Date.now(),
            };
            this.storeData!.transactions.push(transaction);

            await this.save();
            return true;
        } catch (error) {
            console.error('Error adding currency:', error);
            return false;
        }
    }

    async spendCurrency(
        type: CurrencyType,
        amount: number,
        itemId: string,
        reason: string
    ): Promise<boolean> {
        try {
            if (!this.storeData) {
                await this.initialize();
            }

            // Verificar se tem saldo suficiente
            if (this.storeData!.wallet[type] < amount) {
                return false;
            }

            this.storeData!.wallet[type] -= amount;
            this.storeData!.wallet.lastUpdated = Date.now();

            // Adicionar transação
            const transaction: Transaction = {
                id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'spend',
                currency: type,
                amount,
                itemId,
                reason,
                timestamp: Date.now(),
            };
            this.storeData!.transactions.push(transaction);

            await this.save();
            return true;
        } catch (error) {
            console.error('Error spending currency:', error);
            return false;
        }
    }

    // ==================== INVENTÁRIO ====================

    async getInventory(): Promise<PlayerInventory> {
        if (!this.storeData) {
            await this.initialize();
        }
        return this.storeData!.inventory;
    }

    async ownsItem(itemId: string): Promise<boolean> {
        const inventory = await this.getInventory();
        return inventory.ownedItems.includes(itemId);
    }

    async purchaseItem(item: StoreItem): Promise<{ success: boolean; message: string }> {
        try {
            if (!this.storeData) {
                await this.initialize();
            }

            // Verificar se já possui o item
            if (await this.ownsItem(item.id)) {
                return { success: false, message: 'Item já possui este item' };
            }

            // Usar stars como moeda única
            const currencyType: CurrencyType = 'stars';
            const amount = item.price.stars;

            if (!amount || amount <= 0) {
                return { success: false, message: 'Preço inválido' };
            }

            // Tentar gastar a moeda
            const spent = await this.spendCurrency(
                currencyType,
                amount,
                item.id,
                `Comprou ${item.name}`
            );

            if (!spent) {
                return { success: false, message: 'Estrelas insuficientes' };
            }

            // Adicionar ao inventário
            this.storeData!.inventory.ownedItems.push(item.id);
            await this.save();

            return { success: true, message: 'Item comprado com sucesso!' };
        } catch (error) {
            console.error('Error purchasing item:', error);
            return { success: false, message: 'Erro ao comprar item' };
        }
    }

    async equipItem(itemId: string, itemType: 'theme' | 'symbol' | 'effect' | 'avatar'): Promise<boolean> {
        try {
            if (!this.storeData) {
                await this.initialize();
            }

            // Verificar se possui o item
            if (!(await this.ownsItem(itemId))) {
                return false;
            }

            // Equipar baseado no tipo
            switch (itemType) {
                case 'theme':
                    this.storeData!.inventory.equippedTheme = itemId;
                    break;
                case 'symbol':
                    this.storeData!.inventory.equippedSymbols = itemId;
                    break;
                case 'effect':
                    this.storeData!.inventory.equippedEffect = itemId;
                    break;
                case 'avatar':
                    this.storeData!.inventory.equippedAvatar = itemId;
                    break;
            }

            await this.save();
            this.notifyListeners(); // Notify listeners of inventory change
            return true;
        } catch (error) {
            console.error('Error equipping item:', error);
            return false;
        }
    }

    // ==================== RECOMPENSAS ====================

    async rewardWin(isSpecialMode: boolean, currentStreak: number): Promise<number> {
        let totalStars = 0;

        // Recompensa base
        const baseReward = isSpecialMode ? REWARD_AMOUNTS.WIN_SPECIAL_MODE : REWARD_AMOUNTS.WIN_CLASSIC;
        totalStars += baseReward;

        // Bônus de sequência
        if (currentStreak > 1) {
            const streakBonus = (currentStreak - 1) * REWARD_AMOUNTS.WIN_STREAK_BONUS;
            totalStars += streakBonus;
        }

        // Adicionar as estrelas
        await this.addCurrency('stars', totalStars, `Vitória no jogo (${currentStreak}x streak)`);

        return totalStars;
    }

    async claimDailyReward(): Promise<{ success: boolean; amount: number; consecutiveDays: number }> {
        try {
            if (!this.storeData) {
                await this.initialize();
            }

            const now = Date.now();
            const lastReward = this.storeData!.lastDailyReward || 0;
            const dayInMs = 24 * 60 * 60 * 1000;

            // Verificar se já recebeu hoje
            if (now - lastReward < dayInMs) {
                return { success: false, amount: 0, consecutiveDays: this.storeData!.consecutiveDays || 0 };
            }

            // Verificar se é consecutivo (dentro de 48h)
            const isConsecutive = now - lastReward < dayInMs * 2;

            if (isConsecutive) {
                this.storeData!.consecutiveDays = (this.storeData!.consecutiveDays || 0) + 1;
            } else {
                this.storeData!.consecutiveDays = 1;
            }

            // Calcular recompensa (aumenta a cada dia consecutivo, max 7 dias)
            const daysMultiplier = Math.min(this.storeData!.consecutiveDays, 7);
            const rewardAmount = REWARD_AMOUNTS.DAILY_LOGIN + (daysMultiplier - 1) * 10;

            await this.addCurrency('stars', rewardAmount, `Login diário (dia ${this.storeData!.consecutiveDays})`);
            this.storeData!.lastDailyReward = now;
            await this.save();

            return {
                success: true,
                amount: rewardAmount,
                consecutiveDays: this.storeData!.consecutiveDays
            };
        } catch (error) {
            console.error('Error claiming daily reward:', error);
            return { success: false, amount: 0, consecutiveDays: 0 };
        }
    }

    async canClaimDailyReward(): Promise<boolean> {
        if (!this.storeData) {
            await this.initialize();
        }

        const now = Date.now();
        const lastReward = this.storeData!.lastDailyReward || 0;
        const dayInMs = 24 * 60 * 60 * 1000;

        return now - lastReward >= dayInMs;
    }

    // ==================== TRANSAÇÕES ====================

    async getTransactionHistory(limit: number = 50): Promise<Transaction[]> {
        if (!this.storeData) {
            await this.initialize();
        }

        return this.storeData!.transactions
            .slice(-limit)
            .reverse();
    }

    // ==================== RESET (para debug) ====================

    async reset(): Promise<void> {
        this.storeData = INITIAL_STORE_DATA;
        await this.save();
    }
}

export const storeService = new StoreService();
