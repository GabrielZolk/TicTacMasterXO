import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    StoreData,
    PlayerWallet,
    PlayerInventory,
    Transaction,
    CurrencyType,
    StoreItem,
    REWARD_AMOUNTS,
    MAX_REWARDED_ADS_PER_DAY,
} from '../types/store';

const STORE_DATA_KEY = '@tictacmasterxo:store_data';

// Dados iniciais da loja
const INITIAL_STORE_DATA: StoreData = {
    wallet: {
        stars: 100, // Jogadores começam com 100 stars
        lastUpdated: Date.now(),
    },
    inventory: {
        ownedItems: ['theme_dark', 'theme_light', 'symbols_default', 'effect_none', 'skin_default', 'line_default', 'draw_default'], // Itens gratuitos iniciais
        equippedTheme: 'theme_dark',
        equippedSymbols: 'symbols_default',
        equippedEffect: 'effect_none',
        equippedBoardSkin: 'skin_default',
        equippedWinLine: 'line_default',
        equippedDrawMark: 'draw_default',
    },
    transactions: [],
    lastDailyReward: 0,
    consecutiveDays: 0,
    adsWatchedToday: 0,
    adsWatchedDate: '',
};

/**
 * A DEEP COPY of the initial data. Assigning INITIAL_STORE_DATA directly shares
 * the module-level object by reference: every later mutation (spending stars,
 * buying an item) edited the constant itself, so a "reset" restored the already
 * mutated object and a failed load could persist a corrupted default.
 */
const freshStoreData = (): StoreData => JSON.parse(JSON.stringify(INITIAL_STORE_DATA));

class StoreService {
    private storeData: StoreData | null = null;
    /** Set when the initial read threw — blocks save() so real data survives. */
    private loadFailed = false;
    private listeners: Set<() => void> = new Set();
    private purchaseLock = false;

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
                // Merge over the defaults so data saved by an older version still
                // has every field. Newly added counters (e.g. adsWatchedToday)
                // would otherwise be undefined and break arithmetic on them.
                const parsed = JSON.parse(data);
                this.storeData = {
                    ...freshStoreData(),
                    ...parsed,
                    wallet: { ...freshStoreData().wallet, ...(parsed.wallet || {}) },
                    inventory: { ...freshStoreData().inventory, ...(parsed.inventory || {}) },
                };
                // Migration: ensure board skin defaults exist for existing users
                if (this.storeData && this.storeData.inventory) {
                    if (!this.storeData.inventory.equippedBoardSkin) {
                        this.storeData.inventory.equippedBoardSkin = 'skin_default';
                    }
                    if (!this.storeData.inventory.ownedItems.includes('skin_default')) {
                        this.storeData.inventory.ownedItems.push('skin_default');
                    }
                    // Mesma migracao para o alinhador: sem isto quem ja tem o jogo
                    // instalado fica com `undefined` e sem o item gratuito, e o bug
                    // passaria por todo teste feito em instalacao limpa.
                    if (!this.storeData.inventory.equippedWinLine) {
                        this.storeData.inventory.equippedWinLine = 'line_default';
                    }
                    if (!this.storeData.inventory.ownedItems.includes('line_default')) {
                        this.storeData.inventory.ownedItems.push('line_default');
                    }
                    if (!this.storeData.inventory.equippedDrawMark) {
                        this.storeData.inventory.equippedDrawMark = 'draw_default';
                    }
                    if (!this.storeData.inventory.ownedItems.includes('draw_default')) {
                        this.storeData.inventory.ownedItems.push('draw_default');
                    }
                    await this.save();
                }
                return this.snapshot();
            } else {
                // Primeira vez - criar dados iniciais
                this.storeData = freshStoreData();
                await this.save();
                return this.snapshot();
            }
        } catch (error) {
            console.error('Error initializing store:', error);
            // The read failed — we do NOT know the real wallet/inventory. Serve
            // defaults in memory but block saving, otherwise the next purchase
            // would persist those defaults over everything the player owns.
            this.loadFailed = true;
            this.storeData = freshStoreData();
            return this.snapshot();
        }
    }

    /**
     * Fresh objects for whoever asks for the store state.
     *
     * Everything here is mutated in place (`wallet.stars -= cost`,
     * `ownedItems.push(...)`), so handing out the live references meant a
     * screen doing `setWallet(await getWallet())` after a purchase passed React
     * the *same* object it already held — React bailed out of the re-render and
     * the screen kept showing the pre-purchase balance until it was remounted.
     * Nobody writes through these objects (writes go through addCurrency /
     * spendCurrency / purchaseItem), so a copy costs nothing and makes every
     * consumer re-render correctly.
     */
    private snapshot(): StoreData {
        const d = this.storeData!;
        return {
            ...d,
            wallet: { ...d.wallet },
            inventory: { ...d.inventory, ownedItems: [...d.inventory.ownedItems] },
            transactions: [...d.transactions],
        };
    }

    async save(): Promise<void> {
        // Never overwrite real data with the defaults we fell back to.
        if (this.loadFailed) {
            console.warn('Store save skipped: initial load failed, data would be overwritten');
            return;
        }
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
        return { ...this.storeData!.wallet };
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
        return { ...this.storeData!.inventory, ownedItems: [...this.storeData!.inventory.ownedItems] };
    }

    async ownsItem(itemId: string): Promise<boolean> {
        const inventory = await this.getInventory();
        return inventory.ownedItems.includes(itemId);
    }

    /** `message` is an i18n key, resolved by the caller so it follows the UI language. */
    async purchaseItem(item: StoreItem): Promise<{ success: boolean; message: string }> {
        // Prevent concurrent purchases
        if (this.purchaseLock) {
            return { success: false, message: 'purchaseInProgress' };
        }
        this.purchaseLock = true;

        try {
            if (!this.storeData) {
                await this.initialize();
            }

            // Verificar se já possui o item
            if (await this.ownsItem(item.id)) {
                return { success: false, message: 'alreadyOwned' };
            }

            // Usar stars como moeda única
            const currencyType: CurrencyType = 'stars';
            const amount = item.price.stars;

            if (!amount || amount <= 0) {
                return { success: false, message: 'invalidPrice' };
            }

            // Tentar gastar a moeda
            const spent = await this.spendCurrency(
                currencyType,
                amount,
                item.id,
                `Comprou ${item.name}`
            );

            if (!spent) {
                return { success: false, message: 'insufficientStars' };
            }

            // Adicionar ao inventário
            this.storeData!.inventory.ownedItems.push(item.id);
            await this.save();
            // Without this, subscribers (useEquippedItems, other screens) kept
            // showing the pre-purchase inventory until something else refreshed.
            this.notifyListeners();

            return { success: true, message: 'purchaseSuccess' };
        } catch (error) {
            console.error('Error purchasing item:', error);
            return { success: false, message: 'purchaseError' };
        } finally {
            this.purchaseLock = false;
        }
    }

    async equipItem(itemId: string, itemType: 'theme' | 'symbol' | 'effect' | 'avatar' | 'board_skin' | 'win_line' | 'draw_mark'): Promise<boolean> {
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
                case 'board_skin':
                    this.storeData!.inventory.equippedBoardSkin = itemId;
                    break;
                case 'win_line':
                    this.storeData!.inventory.equippedWinLine = itemId;
                    break;
                case 'draw_mark':
                    this.storeData!.inventory.equippedDrawMark = itemId;
                    break;
                default:
                    // A tela chama isto com `item.type as any`. Sem este ramo, um
                    // tipo que ninguem tratou caia fora do switch e mesmo assim
                    // salvava, avisava os ouvintes e devolvia true: a loja dizia
                    // "equipado" e nada tinha sido equipado.
                    console.warn('equipItem: tipo sem tratamento ->', itemType);
                    return false;
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

            // Anti-cheat: the reward is driven by the device clock, so winding
            // the clock BACKWARDS used to look like "a different day" and paid
            // out again. A timestamp earlier than the last claim can only mean
            // the clock moved back, so refuse it.
            if (lastReward > 0 && now < lastReward) {
                console.warn('Daily reward refused: device clock moved backwards');
                return { success: false, amount: 0, consecutiveDays: this.storeData!.consecutiveDays || 0 };
            }

            // Compare calendar days (not raw timestamps) to handle timezone correctly
            const todayStr = new Date(now).toDateString();
            const lastRewardStr = lastReward > 0 ? new Date(lastReward).toDateString() : '';

            // Already claimed today
            if (todayStr === lastRewardStr) {
                return { success: false, amount: 0, consecutiveDays: this.storeData!.consecutiveDays || 0 };
            }

            // A claim must be at least ~20h after the previous one. Winding the
            // clock FORWARD by a day passes the calendar-day check, but real
            // elapsed time can't be faked away within one session.
            const MIN_INTERVAL_MS = 20 * 60 * 60 * 1000;
            if (lastReward > 0 && now - lastReward < MIN_INTERVAL_MS) {
                return { success: false, amount: 0, consecutiveDays: this.storeData!.consecutiveDays || 0 };
            }

            // Check if last claim was exactly yesterday (consecutive)
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();
            const isConsecutive = lastRewardStr === yesterdayStr;

            if (isConsecutive) {
                this.storeData!.consecutiveDays = (this.storeData!.consecutiveDays || 0) + 1;
            } else {
                this.storeData!.consecutiveDays = 1;
            }

            // Calcular recompensa (aumenta a cada dia consecutivo, max 7 dias)
            const daysMultiplier = Math.min(this.storeData!.consecutiveDays, 7);
            const rewardAmount = REWARD_AMOUNTS.DAILY_LOGIN + (daysMultiplier - 1) * 10;

            // Stamp the claim BEFORE awaiting the grant so a double tap can't
            // pass the date guard twice.
            this.storeData!.lastDailyReward = now;

            await this.addCurrency('stars', rewardAmount, `Login diário (dia ${this.storeData!.consecutiveDays})`);
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

        const lastReward = this.storeData!.lastDailyReward || 0;
        if (lastReward === 0) return true;

        const todayStr = new Date().toDateString();
        const lastRewardStr = new Date(lastReward).toDateString();
        return todayStr !== lastRewardStr;
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

    // ==================== GRANT ITEM (for battle pass, chests, etc) ====================

    async grantItem(itemId: string): Promise<boolean> {
        try {
            if (!this.storeData) await this.initialize();
            if (this.storeData!.inventory.ownedItems.includes(itemId)) return true; // already owned
            this.storeData!.inventory.ownedItems.push(itemId);
            await this.save();
            this.notifyListeners();
            return true;
        } catch (error) {
            console.error('Error granting item:', error);
            return false;
        }
    }

    // ==================== REWARDED AD ====================

    /** Local calendar day key — the counter resets at the player's midnight. */
    private todayKey(): string {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    /** Rolls the daily counter over when the date changed. */
    private rolloverAdCounter(): void {
        if (!this.storeData) return;
        const today = this.todayKey();
        if (this.storeData.adsWatchedDate !== today) {
            this.storeData.adsWatchedDate = today;
            this.storeData.adsWatchedToday = 0;
        }
    }

    /** How many paid rewarded ads the player can still watch today. */
    async getRemainingAdRewards(): Promise<number> {
        if (!this.storeData) {
            await this.initialize();
        }
        this.rolloverAdCounter();
        const used = this.storeData!.adsWatchedToday || 0;
        return Math.max(0, MAX_REWARDED_ADS_PER_DAY - used);
    }

    async canWatchRewardedAd(): Promise<boolean> {
        return (await this.getRemainingAdRewards()) > 0;
    }

    /**
     * Pays out for a completed rewarded ad, capped at MAX_REWARDED_ADS_PER_DAY.
     * Returns 0 when the daily cap is already reached, so the caller can tell
     * the player instead of silently granting nothing.
     */
    async rewardWatchAd(): Promise<number> {
        if (!this.storeData) {
            await this.initialize();
        }
        this.rolloverAdCounter();

        const used = this.storeData!.adsWatchedToday || 0;
        if (used >= MAX_REWARDED_ADS_PER_DAY) {
            return 0;
        }

        // Count BEFORE awaiting the grant so a double tap can't pass the cap twice
        this.storeData!.adsWatchedToday = used + 1;

        const amount = REWARD_AMOUNTS.WATCH_AD;
        await this.addCurrency('stars', amount, 'Assistiu anúncio');
        this.notifyListeners();
        return amount;
    }

    // ==================== RESET (para debug) ====================

    async reset(): Promise<void> {
        this.loadFailed = false;
        this.storeData = freshStoreData();
        await this.save();
        this.notifyListeners();
    }
}

export const storeService = new StoreService();
