// In-App Purchase service for TicTacMasterXO.
// Uses react-native-iap with a small service wrapper so the rest of the app
// can subscribe to premium state changes without talking to billing directly.

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import adMobService from './adMobService';
import { storeService } from './storeService';
import { battlepassService } from './battlepassService';

export const SUBSCRIPTION_PRODUCTS = {
    MONTHLY_NO_ADS: 'tictacmaster_noads_monthly',
    YEARLY_NO_ADS: 'tictacmaster_noads_yearly',
} as const;

export const CONSUMABLE_PRODUCTS = {
    STARS_500: 'tictacmaster_stars_500',
    STARS_1200: 'tictacmaster_stars_1200',
    STARS_3000: 'tictacmaster_stars_3000',
    BATTLEPASS_PREMIUM: 'tictacmaster_battlepass_s1',
} as const;

/**
 * Star packs. `price` is only what we show until the store answers —
 * loadConsumables() replaces it with the price Play actually charges.
 *
 * The strings below are the real Brazilian prices, not the ones we typed in the
 * Console: Play converts and rounds per region, so R$ 4,90 became R$ 4,89 and
 * R$ 9,90 became R$ 9,99. Outside Brazil the fallback is wrong by construction —
 * it exists for the first frames and for devices without billing, nothing else.
 */
export const CONSUMABLE_DETAILS: {
    [key: string]: { stars: number; price: string; bonus: string };
} = {
    [CONSUMABLE_PRODUCTS.STARS_500]: {
        stars: 500,
        price: 'R$ 4,89',
        bonus: '',
    },
    [CONSUMABLE_PRODUCTS.STARS_1200]: {
        stars: 1200,
        price: 'R$ 9,99',
        bonus: '+20%',
    },
    [CONSUMABLE_PRODUCTS.STARS_3000]: {
        stars: 3000,
        price: 'R$ 19,99',
        bonus: '+50%',
    },
};

/** Formatted prices the store reported, in the user's own currency. */
const livePrices: Record<string, string> = {};

/**
 * Price to display for a product: what the store said, or `fallback` while the
 * store has not answered yet.
 */
export const getProductPrice = (productId: string, fallback: string): string =>
    livePrices[productId] || fallback;

// Only `price` is read (RemoveAdsScreen). The old `period` and `description`
// fields were dead Portuguese-only copy that duplicated the i18n keys
// planMonthlyDesc / planYearlyDesc — rendering them would have shown Portuguese
// to a player in any other language.
export const SUBSCRIPTION_PRICES: {
    [key: string]: { price: string };
} = {
    [SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS]: { price: 'R$ 6,90' },
    [SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS]: { price: 'R$ 49,90' },
};

export interface PurchaseState {
    isProcessing: boolean;
    isPurchased: boolean;
    expiryDate: Date | null;
    productId: string | null;
    error: string | null;
}

const STORAGE_KEY = '@purchase_state';
/** Ledger of transaction ids already credited (idempotency for redeliveries). */
const GRANTED_TX_KEY = '@granted_transactions';

let RNIap: any = null;
let isIAPAvailable = false;
let loadedSubscriptions: any[] = [];

class IAPService {
    private purchaseState: PurchaseState = {
        isProcessing: false,
        isPurchased: false,
        expiryDate: null,
        productId: null,
        error: null,
    };

    private isInitialized = false;
    private initializationPromise: Promise<void> | null = null;
    private listeners: ((state: PurchaseState) => void)[] = [];
    private purchaseUpdateSubscription: any = null;
    private purchaseErrorSubscription: any = null;
    private purchaseTimeout: ReturnType<typeof setTimeout> | null = null;

    private cloneState(): PurchaseState {
        return {
            ...this.purchaseState,
            expiryDate: this.purchaseState.expiryDate ? new Date(this.purchaseState.expiryDate) : null,
        };
    }

    private toNumber(value: any): number | null {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string') {
            const parsed = Number(value);
            if (Number.isFinite(parsed)) return parsed;
        }
        return null;
    }

    private getPurchaseTimestampMs(purchase: any): number | null {
        if (!purchase) return null;

        const candidates = [
            purchase.transactionDate,
            purchase.purchaseTime,
            purchase.purchaseTimeAndroid,
            purchase.transactionTimestamp,
            purchase.originalTransactionDateIOS,
        ];

        for (const candidate of candidates) {
            const parsed = this.toNumber(candidate);
            if (parsed && parsed > 0) {
                return parsed;
            }
        }

        return null;
    }

    private resolveExpiryDate(productId: string, purchase: any): Date {
        const explicitDate = purchase?.expiryDate || purchase?.expirationDate || purchase?.expirationDateIOS;
        if (explicitDate) {
            const parsed = new Date(explicitDate);
            if (!Number.isNaN(parsed.getTime())) return parsed;
        }

        const explicitMillis = this.toNumber(purchase?.expiryTimeMillis ?? purchase?.expirationTimeMillis);
        if (explicitMillis && explicitMillis > 0) {
            const parsed = new Date(explicitMillis);
            if (!Number.isNaN(parsed.getTime())) return parsed;
        }

        const purchaseTimeMs = this.getPurchaseTimestampMs(purchase);
        const baseDate = purchaseTimeMs ? new Date(purchaseTimeMs) : new Date();

        if (productId === SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS) {
            baseDate.setMonth(baseDate.getMonth() + 1);
            return baseDate;
        }

        if (productId === SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS) {
            baseDate.setFullYear(baseDate.getFullYear() + 1);
            return baseDate;
        }

        return baseDate;
    }

    private selectBestOffer(offerDetails: any[]): { offerToken: string | null; phase: any | null } {
        let chosenPhase: any = null;
        let chosenOfferToken: string | null = null;

        offerDetails.forEach((offer: any) => {
            const phases = offer?.pricingPhases?.pricingPhaseList || [];
            if (!phases.length) return;

            const infiniteRecurring = phases.find((phase: any) => phase?.recurrenceMode === 2);
            const candidatePhase = infiniteRecurring || phases[phases.length - 1];
            if (!candidatePhase?.formattedPrice) return;

            if (!chosenPhase) {
                chosenPhase = candidatePhase;
                chosenOfferToken = offer?.offerToken || null;
                return;
            }

            const currentMicros = Number(chosenPhase?.priceAmountMicros || Number.MAX_SAFE_INTEGER);
            const candidateMicros = Number(candidatePhase?.priceAmountMicros || Number.MAX_SAFE_INTEGER);
            if (candidateMicros < currentMicros) {
                chosenPhase = candidatePhase;
                chosenOfferToken = offer?.offerToken || null;
            }
        });

        return { offerToken: chosenOfferToken, phase: chosenPhase };
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;
        if (this.initializationPromise) {
            await this.initializationPromise;
            return;
        }

        this.initializationPromise = this.performInitialization();

        try {
            await this.initializationPromise;
        } finally {
            this.initializationPromise = null;
        }
    }

    private async performInitialization(): Promise<void> {
        try {
            const savedState = await AsyncStorage.getItem(STORAGE_KEY);
            if (savedState) {
                const parsed = JSON.parse(savedState);
                const parsedExpiryDate = parsed.expiryDate ? new Date(parsed.expiryDate) : null;

                this.purchaseState = {
                    ...this.purchaseState,
                    ...parsed,
                    expiryDate: parsedExpiryDate && !Number.isNaN(parsedExpiryDate.getTime()) ? parsedExpiryDate : null,
                };
            }

            if (this.purchaseState.expiryDate) {
                const isExpired = new Date() > this.purchaseState.expiryDate;
                if (isExpired) {
                    console.log('Subscription expired, resetting local purchase state');
                    await this.resetPurchaseState();
                } else {
                    await adMobService.setSubscription(true, this.purchaseState.expiryDate.getTime());
                }
            }

            try {
                RNIap = require('react-native-iap');
                console.log('react-native-iap module loaded');

                const availableFunctions = Object.keys(RNIap).filter((key) => typeof RNIap[key] === 'function');
                console.log('Available RNIap functions:', availableFunctions.slice(0, 20).join(', '));

                if (typeof RNIap.initConnection === 'function') {
                    const result = await RNIap.initConnection();
                    console.log('IAP connection result:', result);
                    isIAPAvailable = true;
                } else if (typeof RNIap.setup === 'function') {
                    await RNIap.setup({ storekitMode: 'STOREKIT2_MODE' });
                    console.log('IAP setup complete');
                    isIAPAvailable = true;
                } else {
                    console.log('No initConnection or setup function found');
                    isIAPAvailable = false;
                }

                if (isIAPAvailable) {
                    this.setupPurchaseListeners();
                    await this.loadSubscriptions();
                    await this.loadConsumables();
                }
            } catch (iapError: any) {
                console.log('IAP not available:', iapError?.message);
                isIAPAvailable = false;
            }

            console.log('IAP service initialized');
            console.log(`Subscription active: ${this.purchaseState.isPurchased}`);
            console.log(`IAP available: ${isIAPAvailable}`);

            this.isInitialized = true;
            this.notifyListeners();
        } catch (error) {
            console.error('Failed to initialize IAP:', error);
        }
    }

    private setupPurchaseListeners(): void {
        if (!RNIap) return;

        try {
            if (this.purchaseUpdateSubscription?.remove) {
                this.purchaseUpdateSubscription.remove();
            }
            if (this.purchaseErrorSubscription?.remove) {
                this.purchaseErrorSubscription.remove();
            }

            this.purchaseUpdateSubscription = null;
            this.purchaseErrorSubscription = null;

            if (typeof RNIap.purchaseUpdatedListener === 'function') {
                this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
                    async (purchase: any) => {
                        console.log('Purchase update received:', JSON.stringify(purchase, null, 2));
                        this.clearPurchaseTimeout();
                        await this.handlePurchaseUpdate(purchase);
                    }
                );
                console.log('purchaseUpdatedListener set up');
            }

            if (typeof RNIap.purchaseErrorListener === 'function') {
                this.purchaseErrorSubscription = RNIap.purchaseErrorListener((error: any) => {
                    console.error('Purchase error:', error);

                    if (error.code === 'E_USER_CANCELLED' || error.code === 'UserCancelled') {
                        this.purchaseState.error = null;
                    } else {
                        const friendlyMsg = this.getFriendlyErrorMessage(error);
                        this.purchaseState.error = friendlyMsg || null;
                    }

                    this.clearPurchaseTimeout();
                    this.purchaseState.isProcessing = false;
                    this.notifyListeners();
                });
                console.log('purchaseErrorListener set up');
            }
        } catch (error) {
            console.error('Error setting up purchase listeners:', error);
        }
    }

    private async handlePurchaseUpdate(purchase: any): Promise<void> {
        if (!purchase) return;

        const hasReceipt = purchase.transactionReceipt || purchase.purchaseToken;
        if (!hasReceipt) return;

        if (Platform.OS === 'android') {
            const androidState = purchase.purchaseStateAndroid ?? purchase.purchaseState;
            if (typeof androidState === 'number' && androidState !== 1) {
                console.log(`Purchase not completed yet (state: ${androidState})`);
                this.purchaseState.isProcessing = false;
                this.notifyListeners();
                return;
            }
        }

        try {
            if (Platform.OS === 'android' && purchase.purchaseToken) {
                try {
                    if (typeof RNIap.acknowledgePurchaseAndroid === 'function') {
                        await RNIap.acknowledgePurchaseAndroid({
                            token: purchase.purchaseToken,
                            developerPayload: '',
                        });
                        console.log('Purchase acknowledged on Android');
                    }
                } catch (ackError: any) {
                    console.log('Acknowledge note:', ackError?.message);
                }
            }

            try {
                if (typeof RNIap.finishTransaction === 'function') {
                    const isConsumable = !!CONSUMABLE_DETAILS[purchase.productId];
                    await RNIap.finishTransaction({
                        purchase,
                        isConsumable,
                    });
                    console.log(`Transaction finished (consumable: ${isConsumable})`);
                }
            } catch (finishError: any) {
                console.log('Finish transaction note:', finishError?.message);
            }

            await this.processPurchase(purchase);
        } catch (error) {
            console.error('Error handling purchase update:', error);
        }
    }

    private async loadSubscriptions(): Promise<void> {
        if (!RNIap) {
            console.log('RNIap not available, cannot load subscriptions');
            return;
        }

        try {
            const skus = [
                SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS,
                SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS,
            ];

            let subscriptions: any[] = [];

            if (typeof RNIap.getSubscriptions === 'function') {
                subscriptions = await RNIap.getSubscriptions({ skus });
            } else if (typeof RNIap.fetchProducts === 'function') {
                subscriptions = await RNIap.fetchProducts({ skus, type: 'subs' });
            }

            loadedSubscriptions = subscriptions || [];

            if (!loadedSubscriptions.length) {
                console.log('No subscriptions were returned from the store');
                return;
            }

            if (Platform.OS === 'android') {
                loadedSubscriptions.forEach((sub: any) => {
                    const offerDetails = sub.subscriptionOfferDetails || sub.subscriptionOfferDetailsAndroid;
                    const { phase: chosenPhase } = this.selectBestOffer(offerDetails || []);
                    const productId = sub.productId || sub.id;

                    if (chosenPhase?.formattedPrice && SUBSCRIPTION_PRICES[productId]) {
                        SUBSCRIPTION_PRICES[productId].price = chosenPhase.formattedPrice;
                    }
                });
            }

            this.notifyListeners();
        } catch (error) {
            console.error('Error loading subscriptions:', error);
        }
    }

    /**
     * Formatted price of a one-time product, as Play reports it for this user.
     * Billing Library 7 moved it under the one-time offer; older shapes expose
     * it flat, so read the offer first and fall back to the flat fields.
     */
    private resolveProductPrice(product: any): string | null {
        const offers = product?.oneTimePurchaseOfferDetailsAndroid
            || product?.oneTimePurchaseOfferDetails;

        const offerPrice = Array.isArray(offers)
            ? offers.find((offer: any) => offer?.formattedPrice)?.formattedPrice
            : offers?.formattedPrice;

        return offerPrice || product?.displayPrice || product?.localizedPrice || null;
    }

    /**
     * Loads the real price of every one-time product.
     *
     * Without this the app advertises a hardcoded Brazilian string to every
     * country — and it is wrong even in Brazil, because Play rounds whatever
     * price we set in the Console (we asked R$ 9,90 and it sells for R$ 9,99).
     */
    private async loadConsumables(): Promise<void> {
        if (!RNIap) {
            console.log('RNIap not available, cannot load one-time products');
            return;
        }

        try {
            const skus = Object.values(CONSUMABLE_PRODUCTS) as string[];

            let products: any[] = [];

            if (typeof RNIap.fetchProducts === 'function') {
                products = await RNIap.fetchProducts({ skus, type: 'in-app' });
            } else if (typeof RNIap.getProducts === 'function') {
                products = await RNIap.getProducts({ skus });
            }

            if (!products?.length) {
                console.log('No one-time products were returned from the store');
                return;
            }

            products.forEach((product: any) => {
                const productId = product?.id || product?.productId;
                const price = this.resolveProductPrice(product);
                if (!productId || !price) return;

                livePrices[productId] = price;

                // Mirror into the pack table so screens reading it need no change.
                if (CONSUMABLE_DETAILS[productId]) {
                    CONSUMABLE_DETAILS[productId].price = price;
                }
            });

            console.log('Store prices loaded:', JSON.stringify(livePrices));
            this.notifyListeners();
        } catch (error) {
            console.error('Error loading one-time products:', error);
        }
    }

    /** Transaction ids already credited, so Play redeliveries never double-pay. */
    private async getGrantedTransactions(): Promise<string[]> {
        try {
            const raw = await AsyncStorage.getItem(GRANTED_TX_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    private async isTransactionGranted(transactionId: string): Promise<boolean> {
        const granted = await this.getGrantedTransactions();
        return granted.includes(transactionId);
    }

    private async markTransactionGranted(transactionId?: string): Promise<void> {
        if (!transactionId) return;
        try {
            const granted = await this.getGrantedTransactions();
            if (granted.includes(transactionId)) return;
            granted.push(transactionId);
            // Keep the ledger bounded; ids far in the past can't be redelivered.
            const trimmed = granted.slice(-200);
            await AsyncStorage.setItem(GRANTED_TX_KEY, JSON.stringify(trimmed));
        } catch (error) {
            console.error('Failed to record granted transaction:', error);
        }
    }

    private async processPurchase(purchase: any): Promise<void> {
        const productId = purchase.productId;
        console.log('Processing purchase for:', productId);

        // IDEMPOTENCY: Play re-delivers any purchase that was never acknowledged
        // (app killed or offline before finishTransaction). Without this ledger
        // the same star pack was granted again on every relaunch — free currency.
        const transactionId = purchase.transactionId || purchase.purchaseToken || purchase.orderId;
        if (transactionId && (await this.isTransactionGranted(transactionId))) {
            console.log('Purchase already granted, skipping:', transactionId);
            this.purchaseState.isProcessing = false;
            this.notifyListeners();
            return;
        }

        // Handle battle pass premium purchase
        if (productId === CONSUMABLE_PRODUCTS.BATTLEPASS_PREMIUM) {
            await battlepassService.setPremium(true);
            await this.markTransactionGranted(transactionId);
            this.purchaseState.isProcessing = false;
            this.notifyListeners();
            console.log('Battle Pass Premium activated');
            return;
        }

        // Handle consumable star packs
        const consumableInfo = CONSUMABLE_DETAILS[productId];
        if (consumableInfo) {
            await storeService.addCurrency('stars', consumableInfo.stars, `Comprou pacote de ${consumableInfo.stars} estrelas`);
            await this.markTransactionGranted(transactionId);
            this.purchaseState.isProcessing = false;
            this.notifyListeners();
            console.log(`Consumable processed: ${consumableInfo.stars} stars added`);
            return;
        }

        if (
            productId !== SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS &&
            productId !== SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS
        ) {
            return;
        }

        const expiryDate = this.resolveExpiryDate(productId, purchase);
        if (Number.isNaN(expiryDate.getTime()) || expiryDate.getTime() <= Date.now()) {
            console.log(`Ignoring invalid or expired entitlement for ${productId}`);
            this.purchaseState.isProcessing = false;
            this.notifyListeners();
            return;
        }

        this.purchaseState = {
            isProcessing: false,
            isPurchased: true,
            expiryDate,
            productId,
            error: null,
        };

        await adMobService.setSubscription(true, expiryDate.getTime());
        await this.saveState();
        this.notifyListeners();

        console.log(`Purchase processed: ${productId}, expires: ${expiryDate.toISOString()}`);
    }

    private async saveState(): Promise<void> {
        try {
            await AsyncStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    ...this.purchaseState,
                    expiryDate: this.purchaseState.expiryDate?.toISOString() || null,
                })
            );
        } catch (error) {
            console.error('Failed to save purchase state:', error);
        }
    }

    private notifyListeners(): void {
        const snapshot = this.cloneState();
        this.listeners.forEach((listener) => listener(snapshot));
    }

    private clearPurchaseTimeout(): void {
        if (!this.purchaseTimeout) return;
        clearTimeout(this.purchaseTimeout);
        this.purchaseTimeout = null;
    }

    private startPurchaseTimeout(): void {
        this.clearPurchaseTimeout();
        this.purchaseTimeout = setTimeout(() => {
            if (!this.purchaseState.isProcessing) return;

            this.purchaseState.isProcessing = false;
            if (!this.purchaseState.isPurchased && !this.purchaseState.error) {
                this.purchaseState.error = 'iapErrIncomplete';
            }

            this.notifyListeners();
            this.purchaseTimeout = null;
        }, 60000);
    }

    subscribe(listener: (state: PurchaseState) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((currentListener) => currentListener !== listener);
        };
    }

    getState(): PurchaseState {
        return this.cloneState();
    }

    isSubscribed(): boolean {
        if (!this.purchaseState.isPurchased) return false;
        if (!this.purchaseState.expiryDate) return false;
        return new Date() < this.purchaseState.expiryDate;
    }

    getExpiryDate(): Date | null {
        return this.purchaseState.expiryDate ? new Date(this.purchaseState.expiryDate) : null;
    }

    async requestSubscription(productId: string): Promise<boolean> {
        console.log('Requesting subscription for:', productId);
        await this.initialize();

        if (!isIAPAvailable || !RNIap) {
            this.purchaseState.error = 'iapErrSystemUnavailable';
            this.notifyListeners();
            return false;
        }

        this.purchaseState.isProcessing = true;
        this.purchaseState.error = null;
        this.notifyListeners();
        this.startPurchaseTimeout();

        try {
            let subscription = loadedSubscriptions.find((sub: any) => (sub.productId || sub.id) === productId);

            if (!subscription) {
                await this.loadSubscriptions();
                subscription = loadedSubscriptions.find((sub: any) => (sub.productId || sub.id) === productId);
            }

            if (!subscription) {
                throw new Error('Produto não configurado. Tente novamente mais tarde.');
            }

            if (Platform.OS === 'android') {
                const offerDetails = subscription.subscriptionOfferDetails || subscription.subscriptionOfferDetailsAndroid;
                if (!offerDetails || !offerDetails.length) {
                    throw new Error('Oferta de assinatura indisponível no momento.');
                }

                const { offerToken } = this.selectBestOffer(offerDetails);
                if (!offerToken) {
                    throw new Error('Oferta de assinatura indisponível no momento.');
                }

                if (typeof RNIap.requestSubscription === 'function') {
                    await RNIap.requestSubscription({
                        sku: productId,
                        subscriptionOffers: [
                            {
                                sku: productId,
                                offerToken,
                            },
                        ],
                    });
                } else if (typeof RNIap.requestPurchase === 'function') {
                    await RNIap.requestPurchase({
                        request: {
                            google: {
                                skus: [productId],
                                subscriptionOffers: [
                                    {
                                        sku: productId,
                                        offerToken,
                                    },
                                ],
                            },
                        },
                        type: 'subs',
                    });
                } else {
                    throw new Error('Nenhuma API de compra disponível.');
                }
            } else if (typeof RNIap.requestSubscription === 'function') {
                await RNIap.requestSubscription({ sku: productId });
            } else if (typeof RNIap.requestPurchase === 'function') {
                await RNIap.requestPurchase({
                    request: {
                        apple: { sku: productId },
                    },
                    type: 'subs',
                });
            } else {
                throw new Error('Nenhuma API de compra disponível.');
            }

            console.log('Subscription request sent');
            return true;
        } catch (error: any) {
            console.error('Failed to request subscription:', error);

            this.clearPurchaseTimeout();
            this.purchaseState.isProcessing = false;

            const friendlyMsg = this.getFriendlyErrorMessage(error);
            this.purchaseState.error = friendlyMsg || null;
            this.notifyListeners();
            return false;
        }
    }

    async restorePurchases(): Promise<boolean> {
        console.log('Restoring purchases');
        await this.initialize();

        if (!isIAPAvailable || !RNIap) {
            if (this.purchaseState.expiryDate && new Date() < this.purchaseState.expiryDate) {
                return true;
            }
            return false;
        }

        this.purchaseState.isProcessing = true;
        this.purchaseState.error = null;
        this.notifyListeners();

        try {
            let availablePurchases: any[] = [];

            if (typeof RNIap.getAvailablePurchases === 'function') {
                availablePurchases = await RNIap.getAvailablePurchases();
            }

            // Restore the Battle Pass Premium entitlement too. It was filtered
            // out before, so a player who paid for it lost it on reinstall and
            // "Restore purchases" reported nothing found.
            const hasBattlePass = (availablePurchases || []).some(
                (purchase: any) => purchase.productId === CONSUMABLE_PRODUCTS.BATTLEPASS_PREMIUM
            );
            if (hasBattlePass) {
                try {
                    await battlepassService.setPremium(true);
                    console.log('Battle Pass Premium restored');
                } catch (error) {
                    console.error('Failed to restore Battle Pass Premium:', error);
                }
            }

            const matchingSubscriptions = (availablePurchases || []).filter((purchase: any) => {
                return (
                    purchase.productId === SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS ||
                    purchase.productId === SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS
                );
            });

            const activeSubscription = matchingSubscriptions.sort((a: any, b: any) => {
                const aTime = this.getPurchaseTimestampMs(a) || 0;
                const bTime = this.getPurchaseTimestampMs(b) || 0;
                return bTime - aTime;
            })[0];

            if (activeSubscription) {
                await this.processPurchase(activeSubscription);
                this.purchaseState.isProcessing = false;
                this.notifyListeners();
                return true;
            }

            this.purchaseState.isProcessing = false;
            this.purchaseState.error = null;
            this.notifyListeners();
            // Restoring only the Battle Pass still counts as a successful restore
            return hasBattlePass;
        } catch (error: any) {
            this.purchaseState.isProcessing = false;
            this.purchaseState.error = error.message || 'Erro ao restaurar';
            this.notifyListeners();
            console.error('Failed to restore purchases:', error);
            return false;
        }
    }

    async resetPurchaseState(): Promise<void> {
        this.purchaseState = {
            isProcessing: false,
            isPurchased: false,
            expiryDate: null,
            productId: null,
            error: null,
        };
        await adMobService.setSubscription(false);
        await this.saveState();
        this.notifyListeners();
    }

    getRemainingTime(): string {
        if (!this.purchaseState.expiryDate) return '';

        const now = new Date();
        const expiry = this.purchaseState.expiryDate;

        if (now >= expiry) return 'Expirado';

        const diff = expiry.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days > 30) {
            const months = Math.floor(days / 30);
            return `${months} ${months === 1 ? 'mes' : 'meses'} restantes`;
        }

        return `${days} ${days === 1 ? 'dia' : 'dias'} restantes`;
    }

    async cleanup(): Promise<void> {
        try {
            this.clearPurchaseTimeout();

            if (this.purchaseUpdateSubscription?.remove) {
                this.purchaseUpdateSubscription.remove();
            }
            if (this.purchaseErrorSubscription?.remove) {
                this.purchaseErrorSubscription.remove();
            }
            if (RNIap?.endConnection) {
                await RNIap.endConnection();
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        } finally {
            this.purchaseUpdateSubscription = null;
            this.purchaseErrorSubscription = null;
            this.isInitialized = false;
            this.initializationPromise = null;
        }
    }

    /**
     * Maps a raw IAP error to an i18n KEY, not to text. These messages reach the
     * user through an Alert, and shipping the Portuguese literal from here meant
     * anyone playing in another language read the error in Portuguese.
     */
    private getFriendlyErrorMessage(error: any): string {
        const rawMsg = (error?.message || '').toLowerCase();
        const code = error?.code || '';

        // User cancelled — not an error
        if (code === 'E_USER_CANCELLED' || rawMsg.includes('cancel')) {
            return '';
        }
        // Our own wiring, not the store. "missing purchase request configuration"
        // is what react-native-iap throws when the call itself is malformed, and a
        // bare 'sku' match catches every "you must provide skus" variant. Both used
        // to be reported as "product unavailable", which sent us hunting through the
        // Play Console for products that were active the whole time. Keep them
        // separate and loud.
        if (rawMsg.includes('missing purchase request configuration') ||
            rawMsg.includes('must provide') ||
            rawMsg.includes('invalid request')) {
            console.error('IAP call is malformed — this is an app bug, not the store:', error?.message);
            return 'iapErrGeneric';
        }
        // Product genuinely not configured in Play Store / App Store Connect
        if (rawMsg.includes('item unavailable') ||
            rawMsg.includes('product not found') ||
            rawMsg.includes('not configured') ||
            rawMsg.includes('sku not found') ||
            rawMsg.includes('unknown sku')) {
            return 'iapErrProductUnavailable';
        }
        // Billing/payment issue
        if (rawMsg.includes('billing') || rawMsg.includes('payment')) {
            return 'iapErrPayment';
        }
        // Network issue
        if (rawMsg.includes('network') || rawMsg.includes('connection')) {
            return 'iapErrNetwork';
        }
        // Fallback
        return 'iapErrGeneric';
    }

    async requestConsumable(productId: string): Promise<boolean> {
        console.log('Requesting consumable:', productId);
        await this.initialize();

        if (!isIAPAvailable || !RNIap) {
            this.purchaseState.error = 'iapErrNotOnDevice';
            this.notifyListeners();
            return false;
        }

        this.purchaseState.isProcessing = true;
        this.purchaseState.error = null;
        this.notifyListeners();
        this.startPurchaseTimeout();

        try {
            if (typeof RNIap.requestPurchase === 'function') {
                // react-native-iap 14 takes the request nested per platform plus an
                // explicit `type`. The flat `{ sku, skus }` below is the v12/v13
                // shape: the subscription path above was already migrated, this one
                // was not, so every star and battle-pass purchase threw
                // "missing purchase request configuration" before Play was ever
                // reached — and the mapper turned that into "this purchase is not
                // available yet", which reads exactly like a Console problem.
                await RNIap.requestPurchase({
                    request: {
                        google: { skus: [productId] },
                        apple: { sku: productId },
                    },
                    type: 'in-app',
                });
            } else {
                throw new Error('Nenhuma API de compra disponível.');
            }

            console.log('Consumable purchase request sent');
            return true;
        } catch (error: any) {
            console.error('Failed to request consumable:', error);
            this.clearPurchaseTimeout();
            this.purchaseState.isProcessing = false;

            const friendlyMsg = this.getFriendlyErrorMessage(error);
            // Empty string = user cancelled, don't show anything
            this.purchaseState.error = friendlyMsg || null;
            this.notifyListeners();
            return false;
        }
    }

    isIAPAvailable(): boolean {
        return isIAPAvailable;
    }

    getLoadedSubscriptions(): any[] {
        return loadedSubscriptions;
    }
}

export const iapService = new IAPService();
export default iapService;
