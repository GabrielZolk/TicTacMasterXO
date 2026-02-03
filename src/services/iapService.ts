// In-App Purchase Service for TicTacMasterXO
// Uses react-native-iap v14+ with useIAP pattern (adapted for service pattern)

import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import adMobService from './adMobService';

// Subscription product IDs - must match exactly with Google Play Console
export const SUBSCRIPTION_PRODUCTS = {
    MONTHLY_NO_ADS: 'tictacmaster_noads_monthly',
    YEARLY_NO_ADS: 'tictacmaster_noads_yearly',
};

// Subscription prices (for display purposes - actual prices come from stores)
export const SUBSCRIPTION_PRICES: { [key: string]: { price: string; period: string; description: string } } = {
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

// Will store the loaded IAP module and subscriptions data
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

                // Log available functions for debugging
                const availableFunctions = Object.keys(RNIap).filter(key => typeof RNIap[key] === 'function');
                console.log('📋 Available RNIap functions:', availableFunctions.slice(0, 20).join(', '));

                // Initialize the IAP connection
                if (RNIap.initConnection) {
                    const result = await RNIap.initConnection();
                    console.log('💳 IAP Connection result:', result);
                    isIAPAvailable = true;
                } else if (RNIap.setup) {
                    // Alternative API
                    await RNIap.setup({ storekitMode: 'STOREKIT2_MODE' });
                    console.log('💳 IAP Setup complete');
                    isIAPAvailable = true;
                } else {
                    console.log('⚠️ No initConnection or setup function found');
                    isIAPAvailable = false;
                }

                if (isIAPAvailable) {
                    // Set up purchase listeners
                    this.setupPurchaseListeners();

                    // Pre-load subscription info
                    await this.loadSubscriptions();
                }

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
            // Listen for successful purchases - check for both v14 and v12/13 API
            if (typeof RNIap.purchaseUpdatedListener === 'function') {
                this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
                    async (purchase: any) => {
                        console.log('📦 Purchase update received:', JSON.stringify(purchase, null, 2));
                        await this.handlePurchaseUpdate(purchase);
                    }
                );
                console.log('✅ purchaseUpdatedListener set up');
            }

            // Listen for purchase errors
            if (typeof RNIap.purchaseErrorListener === 'function') {
                this.purchaseErrorSubscription = RNIap.purchaseErrorListener(
                    (error: any) => {
                        console.error('❌ Purchase error:', error);

                        // User cancelled is not really an error
                        if (error.code === 'E_USER_CANCELLED' || error.code === 'UserCancelled') {
                            console.log('User cancelled the purchase');
                        } else {
                            this.purchaseState.error = error.message || 'Falha na compra';
                        }

                        this.purchaseState.isProcessing = false;
                        this.notifyListeners();
                    }
                );
                console.log('✅ purchaseErrorListener set up');
            }

            console.log('✅ Purchase listeners configured');
        } catch (error) {
            console.error('Error setting up purchase listeners:', error);
        }
    }

    private async handlePurchaseUpdate(purchase: any): Promise<void> {
        if (!purchase) return;

        const hasReceipt = purchase.transactionReceipt || purchase.purchaseToken;
        if (!hasReceipt) return;

        // Avoid granting entitlement for pending/unspecified Android purchases
        if (Platform.OS === 'android') {
            const androidState = purchase.purchaseStateAndroid ?? purchase.purchaseState;
            if (typeof androidState === 'number' && androidState !== 1) {
                console.log(`⚠️ Purchase not completed (state: ${androidState}). Ignoring update.`);
                this.purchaseState.isProcessing = false;
                this.notifyListeners();
                return;
            }
        }

        try {
            // Acknowledge the purchase for Android
            if (Platform.OS === 'android' && purchase.purchaseToken) {
                try {
                    if (typeof RNIap.acknowledgePurchaseAndroid === 'function') {
                        await RNIap.acknowledgePurchaseAndroid({
                            token: purchase.purchaseToken,
                            developerPayload: '',
                        });
                        console.log('✅ Purchase acknowledged (Android)');
                    }
                } catch (ackError: any) {
                    // May already be acknowledged
                    console.log('Acknowledge note:', ackError.message);
                }
            }

            // Finish the transaction
            try {
                if (typeof RNIap.finishTransaction === 'function') {
                    await RNIap.finishTransaction({
                        purchase,
                        isConsumable: false,
                    });
                    console.log('✅ Transaction finished');
                }
            } catch (finishError: any) {
                console.log('Finish transaction note:', finishError.message);
            }

            // Process the purchase
            await this.processPurchase(purchase);
        } catch (error) {
            console.error('Error handling purchase update:', error);
        }
    }

    private async loadSubscriptions(): Promise<void> {
        if (!RNIap) {
            console.log('❌ RNIap not available, cannot load subscriptions');
            return;
        }

        try {
            const skus = [
                SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS,
                SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS,
            ];

            console.log('='.repeat(60));
            console.log('📋 LOADING SUBSCRIPTIONS - DEBUG INFO');
            console.log('='.repeat(60));
            console.log('📋 SKUs being requested:', JSON.stringify(skus));

            // Try different API methods
            let subscriptions: any[] = [];

            if (typeof RNIap.getSubscriptions === 'function') {
                // v12/v13/v14 API
                subscriptions = await RNIap.getSubscriptions({ skus });
            } else if (typeof RNIap.fetchProducts === 'function') {
                // Alternative API
                const result = await RNIap.fetchProducts({ skus, type: 'subs' });
                subscriptions = result || [];
            }

            loadedSubscriptions = subscriptions || [];

            console.log('📋 Number of subscriptions returned:', loadedSubscriptions.length);

            if (loadedSubscriptions.length > 0) {
                console.log('📋 First subscription structure:', JSON.stringify(loadedSubscriptions[0], null, 2));
            }

            if (!loadedSubscriptions || loadedSubscriptions.length === 0) {
                console.log('⚠️ NO SUBSCRIPTIONS FOUND! Possible causes:');
                console.log('   1. SKUs do not match exactly with Play Console');
                console.log('   2. Subscriptions are not "Active" in Play Console');
                console.log('   3. App is not published in any test track');
                console.log('   4. Testing account is not a licensed tester');
                console.log('   5. App not installed from Play Store');
                return;
            }

            // Update prices from store
            if (Platform.OS === 'android') {
                loadedSubscriptions.forEach((sub: any) => {
                    console.log(`📝 Processing subscription: ${sub.productId || sub.id}`);

                    // v14 structure: subscriptionOfferDetails or subscriptionOfferDetailsAndroid
                    const offerDetails = sub.subscriptionOfferDetails || sub.subscriptionOfferDetailsAndroid;

                    if (offerDetails && offerDetails.length > 0) {
                        console.log(`✅ Found ${offerDetails.length} offer(s) for ${sub.productId || sub.id}`);

                        // Get price from first offer
                        const pricingPhases = offerDetails[0]?.pricingPhases?.pricingPhaseList;
                        if (pricingPhases && pricingPhases.length > 0) {
                            const formattedPrice = pricingPhases[0].formattedPrice;
                            const productId = sub.productId || sub.id;
                            if (formattedPrice && SUBSCRIPTION_PRICES[productId]) {
                                SUBSCRIPTION_PRICES[productId].price = formattedPrice;
                                console.log(`💰 Updated price for ${productId}: ${formattedPrice}`);
                            }
                        }
                    } else {
                        console.log(`⚠️ No offer details for ${sub.productId || sub.id}`);
                    }
                });
            }

            console.log('📋 Loaded subscriptions count:', loadedSubscriptions.length);
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

    // Request a subscription purchase - v14 API compatible
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
            // Find the subscription in loaded subscriptions
            const subscription = loadedSubscriptions.find(
                (sub: any) => (sub.productId || sub.id) === productId
            );

            if (!subscription) {
                console.log('❌ Subscription not found in loaded subscriptions');
                console.log('   Looking for:', productId);
                console.log('   Available:', loadedSubscriptions.map((s: any) => s.productId || s.id).join(', '));

                // Try to reload subscriptions
                await this.loadSubscriptions();
                const retrySubscription = loadedSubscriptions.find(
                    (sub: any) => (sub.productId || sub.id) === productId
                );

                if (!retrySubscription) {
                    throw new Error('Produto não configurado. Por favor, tente novamente mais tarde.');
                }
            }

            const sub = subscription || loadedSubscriptions.find(
                (s: any) => (s.productId || s.id) === productId
            );

            if (Platform.OS === 'android') {
                // Get offer details for Android (v14 structure)
                const offerDetails = sub?.subscriptionOfferDetails || sub?.subscriptionOfferDetailsAndroid;

                if (!offerDetails || offerDetails.length === 0) {
                    console.log('❌ No offer details found for subscription');
                    throw new Error('Produto não configurado. Por favor, tente novamente mais tarde.');
                }

                const offerToken = offerDetails[0].offerToken;
                console.log('🚀 Requesting subscription with offer token:', offerToken?.substring(0, 30) + '...');

                // Try v14 requestPurchase API first
                if (typeof RNIap.requestPurchase === 'function') {
                    console.log('📦 Using requestPurchase API');
                    await RNIap.requestPurchase({
                        request: {
                            google: {
                                skus: [productId],
                                subscriptionOffers: [{
                                    sku: productId,
                                    offerToken: offerToken,
                                }],
                            },
                        },
                        type: 'subs',
                    });
                } else if (typeof RNIap.requestSubscription === 'function') {
                    // Fallback to requestSubscription
                    console.log('📦 Using requestSubscription API');
                    await RNIap.requestSubscription({
                        sku: productId,
                        subscriptionOffers: [{
                            sku: productId,
                            offerToken: offerToken,
                        }],
                    });
                } else {
                    throw new Error('Nenhuma API de compra disponível');
                }
            } else {
                // iOS - simpler API
                if (typeof RNIap.requestPurchase === 'function') {
                    await RNIap.requestPurchase({
                        request: {
                            apple: { sku: productId },
                        },
                        type: 'subs',
                    });
                } else if (typeof RNIap.requestSubscription === 'function') {
                    await RNIap.requestSubscription({ sku: productId });
                }
            }

            console.log('✅ Subscription request sent');
            return true;
        } catch (error: any) {
            console.error('Failed to request subscription:', error);

            this.purchaseState.isProcessing = false;
            this.purchaseState.error = error.message || 'Falha ao processar compra';
            this.notifyListeners();

            // Show user-friendly error
            if (error.code !== 'E_USER_CANCELLED' && error.code !== 'UserCancelled') {
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
            let availablePurchases: any[] = [];

            if (typeof RNIap.getAvailablePurchases === 'function') {
                availablePurchases = await RNIap.getAvailablePurchases();
            }

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

    // Reset purchase state
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
        try {
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
        }
    }

    // Check if IAP is available
    isIAPAvailable(): boolean {
        return isIAPAvailable;
    }

    // Get loaded subscriptions for debugging
    getLoadedSubscriptions(): any[] {
        return loadedSubscriptions;
    }
}

export const iapService = new IAPService();
export default iapService;
