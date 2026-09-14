import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
  
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import PremiumCelebration from '../components/PremiumCelebration';
import { useI18n } from '../i18n/useI18n';
import { useGame } from '../contexts/GameContext';
import adMobService from '../services/adMobService';
import iapService, {
    PurchaseState,
    SUBSCRIPTION_PRICES,
    SUBSCRIPTION_PRODUCTS,
} from '../services/iapService';
import {
    BORDER_RADIUS,
    COLORS,
    SHADOWS,
    SPACING,
    createTextStyle,
} from '../utils/theme';

const NEW_LINE = String.fromCharCode(10);

const RemoveAdsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { playSound, triggerHaptics } = useGame();
    const { t } = useI18n();

    const [purchaseState, setPurchaseState] = useState<PurchaseState>(iapService.getState());
    const [isIapInitializing, setIsIapInitializing] = useState(true);
    const [showCelebration, setShowCelebration] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<string>(SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS);
    const pendingActionRef = useRef<'purchase' | 'restore' | null>(null);
    const prevPurchaseStateRef = useRef<PurchaseState>(iapService.getState());

    useEffect(() => {
        let isMounted = true;

        const unsubscribe = iapService.subscribe((state) => {
            if (isMounted) {
                setPurchaseState(state);
            }
        });

        const initializeServices = async () => {
            try {
                await adMobService.initialize();
                await iapService.initialize();

                if (isMounted) {
                    setPurchaseState(iapService.getState());
                }
            } finally {
                if (isMounted) {
                    setIsIapInitializing(false);
                }
            }
        };

        void initializeServices();

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        const prevState = prevPurchaseStateRef.current;

        if (pendingActionRef.current === 'purchase') {
            const purchaseCompleted = !prevState.isPurchased && purchaseState.isPurchased;
            const purchaseFinishedWithoutSuccess =
                prevState.isProcessing && !purchaseState.isProcessing && !purchaseState.isPurchased;

            if (purchaseCompleted) {
                pendingActionRef.current = null;
                setShowCelebration(true);
                void triggerHaptics('medium');
                void playSound('win');
            } else if (purchaseFinishedWithoutSuccess) {
                pendingActionRef.current = null;
                if (purchaseState.error) {
                    // The service hands back an i18n key so the message follows the UI language.
                    Alert.alert(t('errorTitle'), t(purchaseState.error as any), [{ text: 'OK' }]);
                }
            }
        }

        prevPurchaseStateRef.current = purchaseState;
    }, [playSound, purchaseState, triggerHaptics]);

    const handleGoBack = async () => {
        await triggerHaptics('light');
        await playSound('button');
        navigation.goBack();
    };

    const handlePurchase = async () => {
        if (isIapInitializing || pendingActionRef.current) {
            if (isIapInitializing) {
                Alert.alert(t('waitTitle'), 'Estamos carregando os precos da assinatura.');
            }
            return;
        }

        await triggerHaptics('medium');
        await playSound('button');

        pendingActionRef.current = 'purchase';
        const started = await iapService.requestSubscription(selectedProduct);

        if (!started) {
            pendingActionRef.current = null;
            const latestState = iapService.getState();
            if (latestState.error) {
                // Same as above: the state holds an i18n key, so it must be translated.
                Alert.alert(t('errorTitle'), t(latestState.error as any), [{ text: 'OK' }]);
            }
        }
    };

    const handleRestore = async () => {
        if (pendingActionRef.current) return; // Block if purchase/restore already in progress

        await triggerHaptics('light');
        await playSound('button');

        pendingActionRef.current = 'restore';
        try {
            const success = await iapService.restorePurchases();

            if (success) {
                Alert.alert(t('restoredTitle'), t('restoredBody'), [{ text: t('okGreat') }]);
            } else {
                Alert.alert(t('nothingFoundTitle'), t('nothingToRestore'), [{ text: 'OK' }]);
            }
        } catch (error) {
            Alert.alert(t('errorTitle'), t('restoreFailedBody'), [{ text: 'OK' }]);
        } finally {
            pendingActionRef.current = null;
        }
    };

    const handleCelebrationContinue = async () => {
        await triggerHaptics('light');
        await playSound('button');
        setShowCelebration(false);
        navigation.goBack();
    };

    const isSubscribed = iapService.isSubscribed();
    const remainingTime = iapService.getRemainingTime();
    const isLoading = purchaseState.isProcessing || isIapInitializing;
    const selectedPlanLabel =
        selectedProduct === SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS ? t('yearlyPlan') : t('monthlyPlan');

    return (
        <LinearGradient colors={['#0A0A0A', '#1A1A2E']} style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('removeAdsTitle')}</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.heroSection}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="rocket" size={60} color={COLORS.gold} />
                        </View>
                        <Text style={styles.heroTitle}>
                            {isSubscribed ? t('youArePremium') : t('heroNoInterruptions')}
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            {isSubscribed
                                ? t('premiumEnjoyBody').replace('{br}', NEW_LINE).replace('{time}', remainingTime)
                                : t('heroNoInterruptionsBody')
                            }
                        </Text>
                    </Animated.View>

                    {!isSubscribed && (
                        <>
                            <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.benefitsSection}>
                                <Text style={styles.sectionTitle}>{t('premiumBenefits')}</Text>

                                <View style={styles.benefitItem}>
                                    <View style={styles.benefitIcon}>
                                        <Ionicons name="close-circle" size={24} color={COLORS.error} />
                                    </View>
                                    <View style={styles.benefitText}>
                                        <Text style={styles.benefitTitle}>{t('benefitNoAds')}</Text>
                                        <Text style={styles.benefitDescription}>{t('benefitNoAdsDesc')}</Text>
                                    </View>
                                </View>

                                <View style={styles.benefitItem}>
                                    <View style={styles.benefitIcon}>
                                        <Ionicons name="flash" size={24} color={COLORS.warning} />
                                    </View>
                                    <View style={styles.benefitText}>
                                        <Text style={styles.benefitTitle}>{t('benefitSmooth')}</Text>
                                        <Text style={styles.benefitDescription}>{t('benefitSmoothDesc')}</Text>
                                    </View>
                                </View>

                                <View style={styles.benefitItem}>
                                    <View style={styles.benefitIcon}>
                                        <Ionicons name="heart" size={24} color={COLORS.xColor} />
                                    </View>
                                    <View style={styles.benefitText}>
                                        <Text style={styles.benefitTitle}>{t('benefitSupport')}</Text>
                                        <Text style={styles.benefitDescription}>{t('benefitSupportDesc')}</Text>
                                    </View>
                                </View>
                            </Animated.View>

                            <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.plansSection}>
                                <Text style={styles.sectionTitle}>{t('choosePlan')}</Text>

                                <TouchableOpacity
                                    style={[
                                        styles.planCard,
                                        selectedProduct === SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS && styles.planCardSelected,
                                    ]}
                                    onPress={() => setSelectedProduct(SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS)}
                                    activeOpacity={0.8}
                                    disabled={isLoading}
                                >
                                    <View style={styles.planInfo}>
                                        <Text style={styles.planTitle}>{t('planMonthlyShort')}</Text>
                                        <Text style={styles.planDescription}>
                                            {t('planMonthlyDesc')}
                                        </Text>
                                    </View>
                                    <View style={styles.planPrice}>
                                        <Text style={styles.priceText}>
                                            {isIapInitializing
                                                ? '...'
                                                : SUBSCRIPTION_PRICES[SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS].price}
                                        </Text>
                                        <Text style={styles.periodText}>{t('perMonthSuffix')}</Text>
                                    </View>
                                    {selectedProduct === SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS && (
                                        <View style={styles.selectedIndicator}>
                                            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                                        </View>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.planCard,
                                        selectedProduct === SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS && styles.planCardSelected,
                                    ]}
                                    onPress={() => setSelectedProduct(SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS)}
                                    activeOpacity={0.8}
                                    disabled={isLoading}
                                >
                                    <View style={styles.bestValueBadge}>
                                        <Text style={styles.bestValueText}>{t('bestValue')}</Text>
                                    </View>
                                    <View style={styles.planInfo}>
                                        <Text style={styles.planTitle}>{t('planYearlyShort')}</Text>
                                        <Text style={styles.planDescription}>
                                            {t('planYearlyDesc')}
                                        </Text>
                                    </View>
                                    <View style={styles.planPrice}>
                                        <Text style={styles.priceText}>
                                            {isIapInitializing
                                                ? '...'
                                                : SUBSCRIPTION_PRICES[SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS].price}
                                        </Text>
                                        <Text style={styles.periodText}>{t('perYearSuffix')}</Text>
                                    </View>
                                    {selectedProduct === SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS && (
                                        <View style={styles.selectedIndicator}>
                                            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>

                            <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.purchaseSection}>
                                <TouchableOpacity
                                    style={[styles.purchaseButton, isLoading && styles.purchaseButtonDisabled]}
                                    onPress={handlePurchase}
                                    disabled={isLoading}
                                    activeOpacity={0.85}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={COLORS.white} />
                                    ) : (
                                        <>
                                            <Ionicons name="diamond" size={24} color={COLORS.white} />
                                            <Text style={styles.purchaseButtonText}>{t('subscribeNow')}</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.restoreButton}
                                    onPress={handleRestore}
                                    disabled={isLoading}
                                    activeOpacity={0.75}
                                >
                                    <Text style={styles.restoreButtonText}>{t('restorePurchasesAction')}</Text>
                                </TouchableOpacity>

                                <Text style={styles.legalText}>{t('subscriptionRenewalNote')}</Text>
                            </Animated.View>
                        </>
                    )}

                    {isSubscribed && (
                        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.subscribedSection}>
                            <View style={styles.subscribedCard}>
                                <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
                                <Text style={styles.subscribedTitle}>{t('activeSubscription')}</Text>
                                <Text style={styles.subscribedInfo}>
                                    Plano:{' '}
                                    {purchaseState.productId === SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS ? 'Anual' : 'Mensal'}
                                </Text>
                                <Text style={styles.subscribedExpiry}>{remainingTime}</Text>
                            </View>
                        </Animated.View>
                    )}
                </ScrollView>
            </SafeAreaView>

            <PremiumCelebration
                visible={showCelebration}
                planLabel={selectedPlanLabel}
                onContinue={handleCelebrationContinue}
            />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.darkSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.white,
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xl * 2,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.gold + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
    },
    heroTitle: {
        ...createTextStyle('xl', 'bold'),
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    heroSubtitle: {
        ...createTextStyle('md', 'regular'),
        color: COLORS.lightGray,
        textAlign: 'center',
        lineHeight: 24,
    },
    benefitsSection: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.white,
        marginBottom: SPACING.md,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
    },
    benefitIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.darkBackground,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    benefitText: {
        flex: 1,
    },
    benefitTitle: {
        ...createTextStyle('md', 'semibold'),
        color: COLORS.white,
        marginBottom: 2,
    },
    benefitDescription: {
        ...createTextStyle('sm', 'regular'),
        color: COLORS.gray,
    },
    plansSection: {
        marginBottom: SPACING.xl,
    },
    planCard: {
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        borderWidth: 2,
        borderColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    planCardSelected: {
        borderColor: COLORS.gold,
        backgroundColor: COLORS.gold + '10',
    },
    bestValueBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.success,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderBottomLeftRadius: BORDER_RADIUS.md,
    },
    bestValueText: {
        ...createTextStyle('xs', 'bold'),
        color: COLORS.white,
    },
    planInfo: {
        flex: 1,
    },
    planTitle: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.white,
        marginBottom: 4,
    },
    planDescription: {
        ...createTextStyle('sm', 'regular'),
        color: COLORS.gray,
    },
    planPrice: {
        alignItems: 'flex-end',
        marginRight: SPACING.md,
    },
    priceText: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.gold,
    },
    periodText: {
        ...createTextStyle('sm', 'regular'),
        color: COLORS.gray,
    },
    selectedIndicator: {
        position: 'absolute',
        right: SPACING.md,
        top: '50%',
        marginTop: -12,
    },
    purchaseSection: {
        alignItems: 'center',
    },
    purchaseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.gold,
        borderRadius: BORDER_RADIUS.lg,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        width: '100%',
        gap: SPACING.sm,
        ...SHADOWS.medium,
    },
    purchaseButtonDisabled: {
        opacity: 0.6,
    },
    purchaseButtonText: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.white,
    },
    restoreButton: {
        marginTop: SPACING.md,
        padding: SPACING.md,
    },
    restoreButtonText: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.info,
    },
    legalText: {
        ...createTextStyle('xs', 'regular'),
        color: COLORS.gray,
        textAlign: 'center',
        marginTop: SPACING.lg,
        lineHeight: 18,
    },
    subscribedSection: {
        marginTop: SPACING.lg,
    },
    subscribedCard: {
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.success + '40',
    },
    subscribedTitle: {
        ...createTextStyle('xl', 'bold'),
        color: COLORS.white,
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
    },
    subscribedInfo: {
        ...createTextStyle('md', 'regular'),
        color: COLORS.lightGray,
    },
    subscribedExpiry: {
        ...createTextStyle('lg', 'semibold'),
        color: COLORS.gold,
        marginTop: SPACING.sm,
    },
});

export default RemoveAdsScreen;
