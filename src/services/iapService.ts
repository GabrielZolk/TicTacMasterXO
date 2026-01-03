// In-App Purchase Service for TicTacMasterXO
// Uses react-native-iap v14+ for real purchases

import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import adMobService from './adMobService';

// Subscription product IDs - must match exactly with Google Play Console
export const SUBSCRIPTION_PRODUCTS = {
    MONTHLY_NO_ADS: 'tictacmaster_noads_monthly',
    YEARLY_NO_ADS: 'tictacmaster_noads_yearly',
};

// Subscription prices (for display purposes - actual prices come from stores)
export const SUBSCRIPTION_PRICES = {
    [SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS]: {
        price: 'R$ 6,90',
        period: 'mês',
        description: 'Sem anúncios por 1 mês',
    },
    [SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS]: {
        price: 'R$ 49,90',
        period: 'ano',
        description: 'Sem anúncios por 1 ano (economize 40%!)',
    },
};

export interface PurchaseState {
    isProcessing: boolean;
    isPurchased: boolean;
    expiryDate: Date | null;
    productId: string | null;
    error: string | null;
}

const STORAGE_KEY = '@purchase_state';

// Will store the loaded IAP module
let RNIap: any = null;
let isIAPAvailable = false;
let subscriptionOfferTokens: Map<string, string> = new Map();

class IAPService {
    private purchaseState: PurchaseState = {
        isProcessing: false,
        isPurchased: false,
        expiryDate: null,
        productId: null,
        error: null,
    };

    private isInitialized = false;
    private listeners: ((state: PurchaseState) => void)[] = [];
    private purchaseUpdateSubscription: any = null;
    private purchaseErrorSubscription: any = null;

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Load saved purchase state
            const savedState = await AsyncStorage.getItem(STORAGE_KEY);
            if (savedState) {
                const parsed = JSON.parse(savedState);
                this.purchaseState = {
                    ...this.purchaseState,
                    ...parsed,
                    expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : null,
                };
            }

            // Check if subscription is still valid
            if (this.purchaseState.expiryDate) {
                const isExpired = new Date() > this.purchaseState.expiryDate;
                if (isExpired) {
                    console.log('🔔 Subscription expired, resetting state');
                    await this.resetPurchaseState();
                } else {
                    // Still valid - inform AdMob service
                    await adMobService.setSubscription(true, this.purchaseState.expiryDate.getTime());
                }
            }

            // Try to import and initialize react-native-iap
            try {
                RNIap = require('react-native-iap');
                console.log('✅ react-native-iap module loaded');

                // Initialize the IAP connection
                const result = await RNIap.initConnection();
                console.log('💳 IAP Connection result:', result);
                isIAPAvailable = true;

                // Set up purchase listeners
                this.setupPurchaseListeners();

                // Pre-load subscription info
                await this.loadSubscriptions();

            } catch (iapError: any) {
                console.log('⚠️ IAP not available:', iapError.message);
                isIAPAvailable = false;
            }

            console.log('💳 IAP Service initialized');
            console.log(`💳 Subscription active: ${this.purchaseState.isPurchased}`);
            console.log(`💳 IAP available: ${isIAPAvailable}`);

            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize IAP:', error);
        }
    }

    private setupPurchaseListeners(): void {
        if (!RNIap) return;

        try {
            // Listen for successful purchases
            this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
                async (purchase: any) => {
                    console.log('📦 Purchase update received:', JSON.stringify(purchase, null, 2));

                    if (purchase && purchase.transactionReceipt) {
                        try {
                            // Finish the transaction
                            if (Platform.OS === 'android') {
                                await RNIap.acknowledgePurchaseAndroid({ token: purchase.purchaseToken });
                            }
                            await RNIap.finishTransaction({ purchase, isConsumable: false });
                            console.log('✅ Transaction finished');

                            // Process the purchase
                            await this.processPurchase(purchase);
                        } catch (error) {
                            console.error('Error finishing transaction:', error);
                        }
                    }
                }
            );

            // Listen for purchase errors
            this.purchaseErrorSubscription = RNIap.purchaseErrorListener(
                (error: any) => {
                    console.error('❌ Purchase error:', error);

                    // User cancelled is not really an error
                    if (error.code === 'E_USER_CANCELLED') {
                        console.log('User cancelled the purchase');
                    } else {
                        this.purchaseState.error = error.message || 'Falha na compra';
                    }

                    this.purchaseState.isProcessing = false;
                    this.notifyListeners();
                }
            );

            console.log('✅ Purchase listeners set up');
        } catch (error) {
            console.error('Error setting up purchase listeners:', error);
        }
    }

    private async loadSubscriptions(): Promise<void> {
        if (!RNIap) return;

        try {
            const skus = [
                SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS,
                SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS,
            ];

            console.log('📋 Loading subscriptions for SKUs:', skus);
            const subscriptions = await RNIap.getSubscriptions({ skus });
            console.log('📋 Loaded subscriptions:', JSON.stringify(subscriptions, null, 2));

            // Store offer tokens for Android
            if (Platform.OS === 'android' && subscriptions) {
                subscriptions.forEach((sub: any) => {
                    if (sub.subscriptionOfferDetails && sub.subscriptionOfferDetails.length > 0) {
                        const offerToken = sub.subscriptionOfferDetails[0].offerToken;
                        subscriptionOfferTokens.set(sub.productId, offerToken);
                        console.log(`📝 Stored offer token for ${sub.productId}: ${offerToken?.substring(0, 20)}...`);
                    }

                    // Update display prices
                    if (sub.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[0]) {
                        const priceInfo = sub.subscriptionOfferDetails[0].pricingPhases.pricingPhaseList[0];
                        const formattedPrice = priceInfo.formattedPrice;

                        if (sub.productId === SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS) {
                            SUBSCRIPTION_PRICES[SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS].price = formattedPrice;
                        } else if (sub.productId === SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS) {
                            SUBSCRIPTION_PRICES[SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS].price = formattedPrice;
                        }
                    }
                });
            }

        } catch (error) {
            console.error('Error loading subscriptions:', error);
        }
    }

    private async processPurchase(purchase: any): Promise<void> {
        const productId = purchase.productId;
        console.log('📦 Processing purchase for:', productId);

        // Validate which product was purchased
        if (
            productId === SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS ||
            productId === SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS
        ) {
            // Calculate expiry date
            let expiryDate = new Date();
            if (productId === SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS) {
                expiryDate.setMonth(expiryDate.getMonth() + 1);
            } else if (productId === SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS) {
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            }

            // Update state
            this.purchaseState = {
                isProcessing: false,
                isPurchased: true,
                expiryDate,
                productId,
                error: null,
            };

            // Update AdMob service
            await adMobService.setSubscription(true, expiryDate.getTime());

            // Save state
            await this.saveState();
            this.notifyListeners();

            console.log(`✅ Purchase processed: ${productId}, expires: ${expiryDate}`);
        }
    }

    private async saveState(): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                ...this.purchaseState,
                expiryDate: this.purchaseState.expiryDate?.toISOString() || null,
            }));
        } catch (error) {
            console.error('Failed to save purchase state:', error);
        }
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.purchaseState));
    }

    // Subscribe to state changes
    subscribe(listener: (state: PurchaseState) => void): () => void {
        this.listeners.push(listener);
        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // Get current state
    getState(): PurchaseState {
        return { ...this.purchaseState };
    }

    // Check if subscription is active
    isSubscribed(): boolean {
        if (!this.purchaseState.isPurchased) return false;
        if (!this.purchaseState.expiryDate) return false;
        return new Date() < this.purchaseState.expiryDate;
    }

    // Get subscription expiry date
    getExpiryDate(): Date | null {
        return this.purchaseState.expiryDate;
    }

    // Request a subscription purchase
    async requestSubscription(productId: string): Promise<boolean> {
        console.log('🛒 Requesting subscription for:', productId);

        // If IAP not available, show error
        if (!isIAPAvailable || !RNIap) {
            console.log('⚠️ IAP not available');
            this.purchaseState.error = 'Sistema de compras não disponível.';
            this.notifyListeners();
            Alert.alert(
                'Não disponível',
                'O sistema de compras não está disponível no momento. Verifique sua conexão com a Play Store.',
                [{ text: 'OK' }]
            );
            return false;
        }

        this.purchaseState.isProcessing = true;
        this.purchaseState.error = null;
        this.notifyListeners();

        try {
            // For Android, we need the offer token
            if (Platform.OS === 'android') {
                let offerToken = subscriptionOfferTokens.get(productId);

                // If we don't have the token, try to load subscriptions again
                if (!offerToken) {
                    console.log('📋 Offer token not found, reloading subscriptions...');
                    await this.loadSubscriptions();
                    offerToken = subscriptionOfferTokens.get(productId);
                }

                if (!offerToken) {
                    throw new Error('Produto não configurado. Por favor, tente novamente mais tarde.');
                }

                console.log('🚀 Requesting subscription with offer token...');
                await RNIap.requestSubscription({
                    sku: productId,
                    subscriptionOffers: [{
                        sku: productId,
                        offerToken: offerToken,
                    }],
                });
            } else {
                // iOS
                await RNIap.requestSubscription({ sku: productId });
            }

            // The result will come through purchaseUpdatedListener
            console.log('✅ Subscription request sent');
            return true;
        } catch (error: any) {
            console.error('Failed to request subscription:', error);

            this.purchaseState.isProcessing = false;
            this.purchaseState.error = error.message || 'Falha ao processar compra';
            this.notifyListeners();

            // Show user-friendly error
            if (error.code !== 'E_USER_CANCELLED') {
                Alert.alert(
                    'Erro',
                    error.message || 'Não foi possível processar sua compra. Tente novamente.',
                    [{ text: 'OK' }]
                );
            }

            return false;
        }
    }

    // Restore purchases from the store
    async restorePurchases(): Promise<boolean> {
        console.log('🔄 Restoring purchases...');

        // If IAP not available, check local state only
        if (!isIAPAvailable || !RNIap) {
            console.log('⚠️ IAP not available, checking local state only');
            if (this.purchaseState.expiryDate && new Date() < this.purchaseState.expiryDate) {
                console.log('✅ Found valid local subscription');
                return true;
            }
            return false;
        }

        this.purchaseState.isProcessing = true;
        this.notifyListeners();

        try {
            // Get available purchases from store
            const availablePurchases = await RNIap.getAvailablePurchases();
            console.log('📦 Available purchases:', JSON.stringify(availablePurchases, null, 2));

            // Find active subscription
            const activeSubscription = availablePurchases?.find((purchase: any) =>
                purchase.productId === SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS ||
                purchase.productId === SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS
            );

            if (activeSubscription) {
                await this.processPurchase(activeSubscription);
                console.log('✅ Subscription restored successfully');
                this.purchaseState.isProcessing = false;
                this.notifyListeners();
                return true;
            }

            this.purchaseState.isProcessing = false;
            this.notifyListeners();
            console.log('ℹ️ No active subscription to restore');
            return false;
        } catch (error: any) {
            this.purchaseState.isProcessing = false;
            this.purchaseState.error = error.message || 'Erro ao restaurar';
            this.notifyListeners();
            console.error('Failed to restore purchases:', error);
            return false;
        }
    }

    // Reset purchase state (for testing or when subscription expires)
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

    // Calculate remaining subscription time
    getRemainingTime(): string {
        if (!this.purchaseState.expiryDate) return '';

        const now = new Date();
        const expiry = this.purchaseState.expiryDate;

        if (now >= expiry) return 'Expirado';

        const diff = expiry.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days > 30) {
            const months = Math.floor(days / 30);
            return `${months} ${months === 1 ? 'mês' : 'meses'} restantes`;
        }

        return `${days} ${days === 1 ? 'dia' : 'dias'} restantes`;
    }

    // Cleanup when app closes
    async cleanup(): Promise<void> {
        if (this.purchaseUpdateSubscription) {
            this.purchaseUpdateSubscription.remove();
        }
        if (this.purchaseErrorSubscription) {
            this.purchaseErrorSubscription.remove();
        }
        if (RNIap) {
            try {
                await RNIap.endConnection();
            } catch (error) {
                console.error('Error ending IAP connection:', error);
            }
        }
    }

    // Check if IAP is available (real purchases possible)
    isIAPAvailable(): boolean {
        return isIAPAvailable;
    }
}

export const iapService = new IAPService();
export default iapService;
