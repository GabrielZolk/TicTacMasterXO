// AdMob Service for TicTacMasterXO
// Using react-native-google-mobile-ads with safe failover for Expo Go

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Safe import pattern to allow running in Expo Go without native module
let mobileAds: any = {
    initialize: () => Promise.resolve(),
    setRequestConfiguration: () => Promise.resolve(),
};
let InterstitialAd: any = { createForAdRequest: () => ({ load: () => { }, show: () => { }, addAdEventListener: () => { } }) };
let RewardedAd: any = { createForAdRequest: () => ({ load: () => { }, show: () => { }, addAdEventListener: () => { } }) };
let BannerAd: any = () => null;
let BannerAdSize: any = {};
let TestIds: any = {
    INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
    REWARDED: 'ca-app-pub-3940256099942544/5224354917',
    BANNER: 'ca-app-pub-3940256099942544/6300978111',
};
let AdEventType: any = {};
let RewardedAdEventType: any = {};
let MaxAdContentRating: any = {};
let isNativeModuleAvailable = false;

try {
    // Attempt to require the module dynamically
    // This allows the code to load even if the module throws on initialization
    const rnGma = require('react-native-google-mobile-ads');

    // Only use it if it appears valid
    if (rnGma) {
        mobileAds = rnGma.default || rnGma;
        InterstitialAd = rnGma.InterstitialAd;
        RewardedAd = rnGma.RewardedAd;
        BannerAd = rnGma.BannerAd;
        BannerAdSize = rnGma.BannerAdSize;
        TestIds = rnGma.TestIds;
        AdEventType = rnGma.AdEventType;
        RewardedAdEventType = rnGma.RewardedAdEventType;
        MaxAdContentRating = rnGma.MaxAdContentRating;
        isNativeModuleAvailable = true;
    }
} catch (error) {
    console.warn('⚠️ AdMob native module not found. Running in mock mode (ads will not show).');
}

// Test Ad Units (use in development)
const TEST_AD_UNITS = {
    interstitial: TestIds.INTERSTITIAL,
    rewarded: TestIds.REWARDED,
    banner: TestIds.BANNER,
};

// Your production ad unit IDs
const PRODUCTION_AD_UNITS = {
    interstitial: {
        android: 'ca-app-pub-7541883201708712/7949048213',
        ios: 'ca-app-pub-7541883201708712/7949048213',
    },
    rewarded: {
        android: 'ca-app-pub-3940256099942544/5224354917',
        ios: 'ca-app-pub-3940256099942544/1712485313',
    },
    banner: {
        android: 'ca-app-pub-7541883201708712/5107246548',
        ios: 'ca-app-pub-7541883201708712/5107246548',
    },
};

// Use test ads in development, production ads in release
const isDevelopment = __DEV__;

export interface AdConfig {
    adsEnabled: boolean;
    isSubscribed: boolean;
    subscriptionExpiry: number | null;
    interstitialShowCount: number;
    lastInterstitialTime: number;
}

const STORAGE_KEY = '@ad_config';
const INTERSTITIAL_INTERVAL = 3; // Show interstitial every N games

const defaultAdConfig: AdConfig = {
    adsEnabled: true,
    isSubscribed: false,
    subscriptionExpiry: null,
    interstitialShowCount: 0,
    lastInterstitialTime: 0,
};

class AdMobService {
    private config: AdConfig = defaultAdConfig;
    private isInitialized = false;
    private interstitialAd: any = null;
    private rewardedAd: any = null;
    private interstitialLoaded = false;
    private rewardedLoaded = false;

    // Get the correct ad unit ID
    private getAdUnitId(type: 'interstitial' | 'rewarded' | 'banner'): string {
        if (isDevelopment || !isNativeModuleAvailable) {
            return TEST_AD_UNITS[type];
        }
        const platformKey = Platform.OS === 'ios' ? 'ios' : 'android';
        return PRODUCTION_AD_UNITS[type][platformKey];
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Load saved config
            const savedConfig = await AsyncStorage.getItem(STORAGE_KEY);
            if (savedConfig) {
                this.config = { ...defaultAdConfig, ...JSON.parse(savedConfig) };
            }

            // Check if subscription is still valid
            if (this.config.subscriptionExpiry && Date.now() > this.config.subscriptionExpiry) {
                this.config.isSubscribed = false;
                this.config.subscriptionExpiry = null;
                await this.saveConfig();
            }

            if (isNativeModuleAvailable) {
                // Initialize the Google Mobile Ads SDK
                await mobileAds().initialize();

                // Set request configuration
                await mobileAds().setRequestConfiguration({
                    maxAdContentRating: MaxAdContentRating.G,
                    tagForChildDirectedTreatment: false,
                    tagForUnderAgeOfConsent: false,
                });

                console.log('📢 AdMob SDK initialized successfully');
            } else {
                console.log('⚠️ AdMob running in mock mode - no native module');
            }

            // Pre-load ads if ads are enabled
            if (this.shouldShowAds()) {
                await this.loadInterstitialAd();
                await this.loadRewardedAd();
            }

            console.log(`📢 Ads enabled: ${this.shouldShowAds()}`);
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize AdMob:', error);
        }
    }

    private async loadInterstitialAd(): Promise<void> {
        if (!isNativeModuleAvailable) {
            this.interstitialLoaded = false; // Never ready in mock mode to avoid fake shows
            return;
        }

        try {
            const adUnitId = this.getAdUnitId('interstitial');
            this.interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
                requestNonPersonalizedAdsOnly: false,
            });

            this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
                console.log('📢 Interstitial ad loaded');
                this.interstitialLoaded = true;
            });

            this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
                console.error('📢 Interstitial ad error:', error);
                this.interstitialLoaded = false;
            });

            this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
                console.log('📢 Interstitial ad closed');
                this.interstitialLoaded = false;
                // Reload for next time
                this.loadInterstitialAd();
            });

            await this.interstitialAd.load();
        } catch (error) {
            console.error('Failed to load interstitial ad:', error);
        }
    }

    private async loadRewardedAd(): Promise<void> {
        if (!isNativeModuleAvailable) {
            this.rewardedLoaded = false;
            return;
        }

        try {
            const adUnitId = this.getAdUnitId('rewarded');
            this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
                requestNonPersonalizedAdsOnly: false,
            });

            this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
                console.log('📢 Rewarded ad loaded');
                this.rewardedLoaded = true;
            });

            this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward: any) => {
                console.log('📢 User earned reward:', reward);
            });

            this.rewardedAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
                console.error('📢 Rewarded ad error:', error);
                this.rewardedLoaded = false;
            });

            this.rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
                console.log('📢 Rewarded ad closed');
                this.rewardedLoaded = false;
                // Reload for next time
                this.loadRewardedAd();
            });

            await this.rewardedAd.load();
        } catch (error) {
            console.error('Failed to load rewarded ad:', error);
        }
    }

    private async saveConfig(): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
        } catch (error) {
            console.error('Failed to save ad config:', error);
        }
    }

    shouldShowAds(): boolean {
        // Don't show ads if subscribed
        if (this.config.isSubscribed) {
            return false;
        }

        // Check subscription expiry
        if (this.config.subscriptionExpiry && Date.now() < this.config.subscriptionExpiry) {
            return false;
        }

        return this.config.adsEnabled;
    }

    // Get banner ad unit ID for current platform
    getBannerAdUnitId(): string {
        return this.getAdUnitId('banner');
    }

    // Check if interstitial is ready
    isInterstitialReady(): boolean {
        return this.interstitialLoaded && this.interstitialAd !== null;
    }

    // Check if rewarded is ready
    isRewardedReady(): boolean {
        return this.rewardedLoaded && this.rewardedAd !== null;
    }

    // Show interstitial ad
    async showInterstitial(): Promise<boolean> {
        if (!this.shouldShowAds()) return false;
        if (!isNativeModuleAvailable) return false;

        if (!this.isInterstitialReady()) {
            console.log('📢 Interstitial not ready, loading...');
            await this.loadInterstitialAd();
            return false;
        }

        try {
            await this.interstitialAd?.show();
            return true;
        } catch (error) {
            console.error('Failed to show interstitial:', error);
            return false;
        }
    }

    // Show rewarded ad and return promise that resolves with reward info
    async showRewarded(): Promise<{ type: string; amount: number } | null> {
        if (!isNativeModuleAvailable) {
            // Mock reward for development in Expo Go
            console.log('⚠️ Giving mock reward (Expo Go mode)');
            return { type: 'mock-reward', amount: 10 };
        }

        if (!this.isRewardedReady()) {
            console.log('📢 Rewarded not ready, loading...');
            await this.loadRewardedAd();
            return null;
        }

        return new Promise((resolve) => {
            if (!this.rewardedAd) {
                resolve(null);
                return;
            }

            // Listen for reward earned
            const unsubscribe = this.rewardedAd.addAdEventListener(
                RewardedAdEventType.EARNED_REWARD,
                (reward: any) => {
                    unsubscribe();
                    resolve(reward);
                }
            );

            // Listen for close without reward
            const unsubscribeClose = this.rewardedAd.addAdEventListener(
                AdEventType.CLOSED,
                () => {
                    unsubscribeClose();
                    // If resolve wasn't called by reward, resolve with null
                }
            );

            this.rewardedAd.show().catch((error: any) => {
                console.error('Failed to show rewarded ad:', error);
                unsubscribe();
                unsubscribeClose();
                resolve(null);
            });
        });
    }

    // Track game completion and show interstitial if appropriate
    async onGameComplete(): Promise<boolean> {
        if (!this.shouldShowAds()) return false;

        this.config.interstitialShowCount++;
        await this.saveConfig();

        // Show interstitial every N games
        if (this.config.interstitialShowCount >= INTERSTITIAL_INTERVAL) {
            this.config.interstitialShowCount = 0;
            this.config.lastInterstitialTime = Date.now();
            await this.saveConfig();
            return await this.showInterstitial();
        }

        return false;
    }

    // Set subscription status
    async setSubscription(isSubscribed: boolean, expiryTimestamp?: number): Promise<void> {
        this.config.isSubscribed = isSubscribed;
        this.config.subscriptionExpiry = expiryTimestamp || null;
        await this.saveConfig();
        console.log(`📢 Subscription updated: ${isSubscribed ? 'Active' : 'Inactive'}`);
    }

    // Grant temporary ad-free experience (e.g., after watching rewarded ad)
    async grantTemporaryAdFree(durationMs: number = 30 * 60 * 1000): Promise<void> {
        const expiry = Date.now() + durationMs;
        this.config.subscriptionExpiry = expiry;
        await this.saveConfig();
        console.log(`📢 Temporary ad-free granted for ${durationMs / 60000} minutes`);
    }

    // Check subscription status
    isSubscribed(): boolean {
        if (this.config.isSubscribed && this.config.subscriptionExpiry) {
            return Date.now() < this.config.subscriptionExpiry;
        }
        return this.config.isSubscribed;
    }

    // Get config for UI
    getConfig(): AdConfig {
        return { ...this.config };
    }

    // Reset for testing
    async resetConfig(): Promise<void> {
        this.config = defaultAdConfig;
        await this.saveConfig();
    }
}

// Export BannerAd and BannerAdSize for use in components
export { BannerAd, BannerAdSize };

export const adMobService = new AdMobService();
export default adMobService;
