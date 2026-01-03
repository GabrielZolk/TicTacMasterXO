// Banner Ad Component for TicTacMasterXO
// Wraps react-native-google-mobile-ads BannerAd

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import adMobService from '../services/adMobService';

// Import BannerAd components conditionally
let BannerAd: any = null;
let BannerAdSize: any = null;

try {
    const mobileAds = require('react-native-google-mobile-ads');
    BannerAd = mobileAds.BannerAd;
    BannerAdSize = mobileAds.BannerAdSize;
} catch (error) {
    console.log('⚠️ react-native-google-mobile-ads not available');
}

interface AdBannerProps {
    size?: 'BANNER' | 'LARGE_BANNER' | 'MEDIUM_RECTANGLE' | 'FULL_BANNER' | 'LEADERBOARD';
    style?: any;
}

const AdBanner: React.FC<AdBannerProps> = ({ size = 'BANNER', style }) => {
    const [showAds, setShowAds] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const checkAdsStatus = async () => {
            await adMobService.initialize();
            setShowAds(adMobService.shouldShowAds());
        };
        checkAdsStatus();
    }, []);

    // Don't render if ads shouldn't be shown or component not available
    if (!showAds || !BannerAd || !BannerAdSize) {
        return null;
    }

    const adUnitId = adMobService.getBannerAdUnitId();

    // Map size string to BannerAdSize
    const sizeMap: Record<string, any> = {
        'BANNER': BannerAdSize.BANNER,
        'LARGE_BANNER': BannerAdSize.LARGE_BANNER,
        'MEDIUM_RECTANGLE': BannerAdSize.MEDIUM_RECTANGLE,
        'FULL_BANNER': BannerAdSize.FULL_BANNER,
        'LEADERBOARD': BannerAdSize.LEADERBOARD,
    };

    const bannerSize = sizeMap[size] || BannerAdSize.BANNER;

    return (
        <View style={[styles.container, style, !isLoaded && styles.hidden]}>
            <BannerAd
                unitId={adUnitId}
                size={bannerSize}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: false,
                }}
                onAdLoaded={() => {
                    console.log('📢 Banner ad loaded');
                    setIsLoaded(true);
                }}
                onAdFailedToLoad={(error: any) => {
                    console.error('📢 Banner ad failed to load:', error);
                    setIsLoaded(false);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    hidden: {
        height: 0,
        opacity: 0,
    },
});

export default AdBanner;
