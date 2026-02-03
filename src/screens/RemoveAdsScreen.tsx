import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

import {
    COLORS,
    SPACING,
    BORDER_RADIUS,
    SHADOWS,
    createTextStyle,
} from '../utils/theme';
import iapService, {
    SUBSCRIPTION_PRODUCTS,
    SUBSCRIPTION_PRICES,
    PurchaseState
} from '../services/iapService';
import adMobService from '../services/adMobService';
import { useGame } from '../contexts/GameContext';

const RemoveAdsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { playSound, triggerHaptics } = useGame();

    const [purchaseState, setPurchaseState] = useState<PurchaseState>(iapService.getState());
    const [selectedProduct, setSelectedProduct] = useState<string>(SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS);
    const pendingActionRef = useRef<'purchase' | 'restore' | null>(null);
    const prevPurchaseStateRef = useRef<PurchaseState>(iapService.getState());

    useEffect(() => {
        // Initialize services
        adMobService.initialize();
        iapService.initialize();

        // Subscribe to purchase state changes
        const unsubscribe = iapService.subscribe((state) => {
            setPurchaseState(state);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        const prevState = prevPurchaseStateRef.current;

        if (pendingActionRef.current === 'purchase') {
            const purchaseCompleted = !prevState.isPurchased && purchaseState.isPurchased;
            const purchaseFinishedWithoutSuccess = prevState.isProcessing && !purchaseState.isProcessing && !purchaseState.isPurchased;

            if (purchaseCompleted) {
                pendingActionRef.current = null;
                (async () => {
                    await playSound('win');
                    Alert.alert(
                        'ðŸŽ‰ ParabÃ©ns!',
                        'Sua assinatura foi ativada com sucesso! Aproveite o jogo sem anÃºncios.',
                        [{ text: 'Ã“timo!' }]
                    );
                })();
            } else if (purchaseFinishedWithoutSuccess) {
                pendingActionRef.current = null;
                if (purchaseState.error) {
                    Alert.alert(
                        'Erro',
                        purchaseState.error || 'NÃ£o foi possÃ­vel processar sua compra. Tente novamente.',
                        [{ text: 'OK' }]
                    );
                }
            }
        }

        prevPurchaseStateRef.current = purchaseState;
    }, [purchaseState, playSound]);

    const handleGoBack = async () => {
        await triggerHaptics('light');
        await playSound('button');
        navigation.goBack();
    };

    const handlePurchase = async () => {
        await triggerHaptics('medium');
        await playSound('button');

        try {
            pendingActionRef.current = 'purchase';
            // Use requestSubscription which handles both real and simulated purchases
            const started = await iapService.requestSubscription(selectedProduct);
            if (!started) {
                pendingActionRef.current = null;
            }
        } catch (error) {
            Alert.alert('Erro', 'Ocorreu um erro ao processar sua compra.');
        }
    };

    const handleRestore = async () => {
        await triggerHaptics('light');
        await playSound('button');

        try {
            const success = await iapService.restorePurchases();

            if (success) {
                Alert.alert(
                    '✅ Restaurado!',
                    'Sua assinatura foi restaurada com sucesso!',
                    [{ text: 'Ótimo!' }]
                );
            } else {
                Alert.alert(
                    'Nada encontrado',
                    'Não encontramos uma assinatura ativa para restaurar.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            Alert.alert('Erro', 'Ocorreu um erro ao restaurar compras.');
        }
    };

    const isSubscribed = iapService.isSubscribed();
    const remainingTime = iapService.getRemainingTime();
    const isLoading = purchaseState.isProcessing;

    return (
        <LinearGradient colors={['#0A0A0A', '#1A1A2E']} style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Remover Anúncios</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hero Section */}
                    <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.heroSection}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="rocket" size={60} color={COLORS.gold} />
                        </View>
                        <Text style={styles.heroTitle}>
                            {isSubscribed ? '🎉 Você é Premium!' : '✨ Jogue sem interrupções!'}
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            {isSubscribed
                                ? `Aproveite o jogo sem anúncios!\n${remainingTime}`
                                : 'Remova todos os anúncios e tenha uma experiência premium.'
                            }
                        </Text>
                    </Animated.View>

                    {!isSubscribed && (
                        <>
                            {/* Benefits */}
                            <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.benefitsSection}>
                                <Text style={styles.sectionTitle}>Benefícios Premium</Text>

                                <View style={styles.benefitItem}>
                                    <View style={styles.benefitIcon}>
                                        <Ionicons name="close-circle" size={24} color={COLORS.error} />
                                    </View>
                                    <View style={styles.benefitText}>
                                        <Text style={styles.benefitTitle}>Sem anúncios</Text>
                                        <Text style={styles.benefitDescription}>
                                            Jogue sem interrupções de vídeos ou banners
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.benefitItem}>
                                    <View style={styles.benefitIcon}>
                                        <Ionicons name="flash" size={24} color={COLORS.warning} />
                                    </View>
                                    <View style={styles.benefitText}>
                                        <Text style={styles.benefitTitle}>Experiência fluida</Text>
                                        <Text style={styles.benefitDescription}>
                                            Transições suaves entre partidas
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.benefitItem}>
                                    <View style={styles.benefitIcon}>
                                        <Ionicons name="heart" size={24} color={COLORS.xColor} />
                                    </View>
                                    <View style={styles.benefitText}>
                                        <Text style={styles.benefitTitle}>Apoie o desenvolvedor</Text>
                                        <Text style={styles.benefitDescription}>
                                            Ajude a manter o jogo atualizado
                                        </Text>
                                    </View>
                                </View>
                            </Animated.View>

                            {/* Subscription Options */}
                            <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.plansSection}>
                                <Text style={styles.sectionTitle}>Escolha seu plano</Text>

                                {/* Monthly Plan */}
                                <TouchableOpacity
                                    style={[
                                        styles.planCard,
                                        selectedProduct === SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS && styles.planCardSelected,
                                    ]}
                                    onPress={() => setSelectedProduct(SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.planInfo}>
                                        <Text style={styles.planTitle}>Mensal</Text>
                                        <Text style={styles.planDescription}>
                                            {SUBSCRIPTION_PRICES[SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS].description}
                                        </Text>
                                    </View>
                                    <View style={styles.planPrice}>
                                        <Text style={styles.priceText}>
                                            {SUBSCRIPTION_PRICES[SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS].price}
                                        </Text>
                                        <Text style={styles.periodText}>/mês</Text>
                                    </View>
                                    {selectedProduct === SUBSCRIPTION_PRODUCTS.MONTHLY_NO_ADS && (
                                        <View style={styles.selectedIndicator}>
                                            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                                        </View>
                                    )}
                                </TouchableOpacity>

                                {/* Yearly Plan */}
                                <TouchableOpacity
                                    style={[
                                        styles.planCard,
                                        selectedProduct === SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS && styles.planCardSelected,
                                    ]}
                                    onPress={() => setSelectedProduct(SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.bestValueBadge}>
                                        <Text style={styles.bestValueText}>MELHOR VALOR</Text>
                                    </View>
                                    <View style={styles.planInfo}>
                                        <Text style={styles.planTitle}>Anual</Text>
                                        <Text style={styles.planDescription}>
                                            {SUBSCRIPTION_PRICES[SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS].description}
                                        </Text>
                                    </View>
                                    <View style={styles.planPrice}>
                                        <Text style={styles.priceText}>
                                            {SUBSCRIPTION_PRICES[SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS].price}
                                        </Text>
                                        <Text style={styles.periodText}>/ano</Text>
                                    </View>
                                    {selectedProduct === SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS && (
                                        <View style={styles.selectedIndicator}>
                                            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>

                            {/* Purchase Button */}
                            <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.purchaseSection}>
                                <TouchableOpacity
                                    style={[styles.purchaseButton, isLoading && styles.purchaseButtonDisabled]}
                                    onPress={handlePurchase}
                                    disabled={isLoading}
                                    activeOpacity={0.8}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={COLORS.white} />
                                    ) : (
                                        <>
                                            <Ionicons name="diamond" size={24} color={COLORS.white} />
                                            <Text style={styles.purchaseButtonText}>Assinar Agora</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.restoreButton}
                                    onPress={handleRestore}
                                    disabled={isLoading}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.restoreButtonText}>Restaurar compras</Text>
                                </TouchableOpacity>

                                <Text style={styles.legalText}>
                                    A assinatura será renovada automaticamente a menos que seja cancelada pelo menos 24 horas antes do fim do período atual.
                                </Text>
                            </Animated.View>
                        </>
                    )}

                    {isSubscribed && (
                        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.subscribedSection}>
                            <View style={styles.subscribedCard}>
                                <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
                                <Text style={styles.subscribedTitle}>Assinatura Ativa</Text>
                                <Text style={styles.subscribedInfo}>
                                    Plano: {purchaseState.productId === SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS ? 'Anual' : 'Mensal'}
                                </Text>
                                <Text style={styles.subscribedExpiry}>
                                    {remainingTime}
                                </Text>
                            </View>
                        </Animated.View>
                    )}
                </ScrollView>
            </SafeAreaView>
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
