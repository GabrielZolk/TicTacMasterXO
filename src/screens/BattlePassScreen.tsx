import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
  
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme } from '../hooks/useTheme';
import { useGame } from '../contexts/GameContext';
import { useI18n } from '../i18n/useI18n';
import { rewardLabel } from '../i18n/rewardLabel';
import { battlepassService } from '../services/battlepassService';
import iapService, { CONSUMABLE_PRODUCTS, getProductPrice } from '../services/iapService';
import { BattlePassProgress, BattlePassTier } from '../types/battlepass';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createTextStyle } from '../utils/theme';
import AppHeader from '../components/AppHeader';

const { width } = Dimensions.get('window');

const BattlePassScreen: React.FC = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { playSound, triggerHaptics } = useGame();
    const { t, tc } = useI18n();

    const [progress, setProgress] = useState<BattlePassProgress | null>(null);
    const [loading, setLoading] = useState(true);

    const season = battlepassService.getSeason();
    const daysLeft = battlepassService.getDaysRemaining();

    // What Play charges in this user's country; the season value is the fallback
    // until the store answers. Re-read on every store event so the price stops
    // being stale the moment it loads.
    const [premiumPrice, setPremiumPrice] = useState(
        () => getProductPrice(CONSUMABLE_PRODUCTS.BATTLEPASS_PREMIUM, season.premiumPrice)
    );

    useEffect(() => {
        const syncPrice = () =>
            setPremiumPrice(getProductPrice(CONSUMABLE_PRODUCTS.BATTLEPASS_PREMIUM, season.premiumPrice));

        syncPrice();
        return iapService.subscribe(syncPrice);
    }, [season.premiumPrice]);

    useEffect(() => {
        loadProgress();
    }, []);

    const loadProgress = async () => {
        const p = await battlepassService.getProgress();
        setProgress(p);
        setLoading(false);
    };

    const handleClaimReward = async (level: number, isPremium: boolean) => {
        await triggerHaptics('medium');
        const result = await battlepassService.claimReward(level, isPremium);
        if (result.success && result.reward) {
            await playSound('win');
            Alert.alert(t('rewardTitle'), t('rewardReceivedBody').replace('{reward}', `${result.reward.icon} ${rewardLabel(result.reward, tc)}`));
            await loadProgress();
        } else if (isPremium && !progress?.isPremium) {
            Alert.alert(t('premiumRequiredTitle'), t('premiumRequiredBody'));
        }
    };

    const [purchasing, setPurchasing] = useState(false);

    const handleBuyPremium = async () => {
        if (purchasing) return;
        await triggerHaptics('heavy');

        Alert.alert(
            t('premiumPass'),
            t('premiumPassBuyBody').replace('{price}', premiumPrice),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('buy'),
                    onPress: async () => {
                        setPurchasing(true);
                        try {
                            const started = await iapService.requestConsumable(CONSUMABLE_PRODUCTS.BATTLEPASS_PREMIUM);
                            if (started) {
                                // Listen for purchase completion
                                const unsubscribe = iapService.subscribe((state) => {
                                    if (!state.isProcessing) {
                                        unsubscribe();
                                        setPurchasing(false);
                                        loadProgress();
                                        playSound('win');
                                    }
                                });
                            } else {
                                setPurchasing(false);
                                const state = iapService.getState();
                                if (state.error) Alert.alert(t('errorTitle'), state.error);
                            }
                        } catch {
                            setPurchasing(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading || !progress) {
        return null;
    }

    // Calculate XP progress to next level
    const currentTier = season.tiers.find(t => t.level === progress.currentLevel);
    const nextTier = season.tiers.find(t => t.level === progress.currentLevel + 1);
    const xpForNext = nextTier ? nextTier.xpRequired : progress.currentXp;
    const xpProgress = nextTier
        ? (progress.currentXp - (currentTier?.xpRequired || 0)) / (xpForNext - (currentTier?.xpRequired || 0))
        : 1;

    const renderTier = (tier: BattlePassTier, index: number) => {
        const isUnlocked = progress.currentLevel >= tier.level;
        const freeClaimed = progress.claimedFreeRewards.includes(tier.level);
        const premiumClaimed = progress.claimedPremiumRewards.includes(tier.level);
        const canClaimFree = isUnlocked && !freeClaimed;
        const canClaimPremium = isUnlocked && !premiumClaimed && progress.isPremium;

        return (
            <Animated.View
                key={tier.level}
                entering={FadeInUp.delay(index * 60).duration(300)}
                style={[styles.tierRow, !isUnlocked && styles.tierLocked]}
            >
                {/* Level indicator */}
                <View style={[styles.levelBadge, isUnlocked && styles.levelBadgeUnlocked]}>
                    <Text style={styles.levelText}>{tier.level}</Text>
                </View>

                {/* Free reward */}
                <TouchableOpacity
                    style={[
                        styles.rewardCard,
                        freeClaimed && styles.rewardClaimed,
                        canClaimFree && styles.rewardClaimable,
                    ]}
                    onPress={() => canClaimFree && handleClaimReward(tier.level, false)}
                    disabled={!canClaimFree}
                >
                    <Text style={styles.rewardIcon}>{tier.freeReward.icon}</Text>
                    <Text style={styles.rewardName} numberOfLines={1}>{rewardLabel(tier.freeReward, tc)}</Text>
                    {freeClaimed && <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />}
                    {canClaimFree && <Text style={styles.claimText}>{t('claimReward')}</Text>}
                </TouchableOpacity>

                {/* Premium reward */}
                <TouchableOpacity
                    style={[
                        styles.rewardCard,
                        styles.rewardPremium,
                        premiumClaimed && styles.rewardClaimed,
                        canClaimPremium && styles.rewardClaimable,
                        !progress.isPremium && styles.rewardLocked,
                    ]}
                    onPress={() => {
                        if (canClaimPremium) handleClaimReward(tier.level, true);
                        else if (!progress.isPremium) handleBuyPremium();
                    }}
                    disabled={premiumClaimed}
                >
                    {!progress.isPremium && <Ionicons name="lock-closed" size={12} color={COLORS.gold} style={styles.lockIcon} />}
                    <Text style={styles.rewardIcon}>{tier.premiumReward.icon}</Text>
                    <Text style={[styles.rewardName, { color: COLORS.gold }]} numberOfLines={1}>{rewardLabel(tier.premiumReward, tc)}</Text>
                    {premiumClaimed && <Ionicons name="checkmark-circle" size={16} color={COLORS.gold} />}
                    {canClaimPremium && <Text style={[styles.claimText, { color: COLORS.gold }]}>{t('claimReward')}</Text>}
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <LinearGradient colors={[colors.background, '#1A0A2E']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <AppHeader title={t('battlePass')} showBack />

                {/* Season info */}
                <View style={styles.seasonHeader}>
                    <Text style={styles.seasonName}>{tc(`season.${season.id}`, season.name)}</Text>
                    <Text style={styles.daysLeft}>{daysLeft} {t('daysRemaining')}</Text>
                </View>

                {/* XP Progress */}
                <View style={styles.xpSection}>
                    <View style={styles.xpRow}>
                        <Text style={styles.xpLabel}>{t('level')} {progress.currentLevel}</Text>
                        <Text style={styles.xpValue}>{progress.currentXp} XP</Text>
                    </View>
                    <View style={styles.xpBarBg}>
                        <View style={[styles.xpBarFill, { width: `${Math.min(xpProgress * 100, 100)}%` }]} />
                    </View>
                    {nextTier && (
                        <Text style={styles.xpNext}>{t('nextLevelXp').replace('{xp}', String(nextTier.xpRequired))}</Text>
                    )}
                </View>

                {/* Premium button */}
                {!progress.isPremium && (
                    <TouchableOpacity style={styles.premiumButton} onPress={handleBuyPremium} activeOpacity={0.8}>
                        <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.premiumGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Ionicons name="star" size={18} color="#1A0A2E" />
                            <Text style={styles.premiumButtonText}>{t('premiumPass')} — {premiumPrice}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* Column headers */}
                <View style={styles.columnHeaders}>
                    <View style={styles.levelHeaderSpace} />
                    <Text style={styles.columnHeader}>{t('free')}</Text>
                    <Text style={[styles.columnHeader, { color: COLORS.gold }]}>{t('premium')}</Text>
                </View>

                {/* Tiers */}
                <ScrollView style={styles.tiersScroll} showsVerticalScrollIndicator={false}>
                    {season.tiers.map((tier, index) => renderTier(tier, index))}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    seasonHeader: {
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    seasonName: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.white,
    },
    daysLeft: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.warning,
    },
    xpSection: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
    },
    xpRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    xpLabel: {
        ...createTextStyle('sm', 'bold'),
        color: COLORS.white,
    },
    xpValue: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.lightGray,
    },
    xpBarBg: {
        height: 8,
        backgroundColor: COLORS.darkSecondary,
        borderRadius: 4,
        overflow: 'hidden',
    },
    xpBarFill: {
        height: '100%',
        backgroundColor: COLORS.xColor,
        borderRadius: 4,
    },
    xpNext: {
        ...createTextStyle('xs', 'regular'),
        color: COLORS.gray,
        marginTop: 4,
        textAlign: 'right',
    },
    premiumButton: {
        marginHorizontal: SPACING.lg,
        marginVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
    },
    premiumGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    premiumButtonText: {
        ...createTextStyle('md', 'bold'),
        color: '#1A0A2E',
    },
    columnHeaders: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.xs,
        alignItems: 'center',
    },
    levelHeaderSpace: { width: 36 },
    columnHeader: {
        flex: 1,
        ...createTextStyle('xs', 'bold'),
        color: COLORS.lightGray,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    tiersScroll: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
    },
    tierRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
        gap: SPACING.xs,
    },
    tierLocked: { opacity: 0.5 },
    levelBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.darkSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.gray,
    },
    levelBadgeUnlocked: {
        borderColor: COLORS.xColor,
        backgroundColor: COLORS.xColor + '30',
    },
    levelText: {
        ...createTextStyle('sm', 'bold'),
        color: COLORS.white,
    },
    rewardCard: {
        flex: 1,
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.sm,
        alignItems: 'center',
        minHeight: 70,
        justifyContent: 'center',
        gap: 2,
    },
    rewardPremium: {
        borderWidth: 1,
        borderColor: COLORS.gold + '30',
    },
    rewardClaimed: {
        opacity: 0.6,
        backgroundColor: COLORS.darkTertiary,
    },
    rewardClaimable: {
        borderWidth: 2,
        borderColor: COLORS.success,
    },
    rewardLocked: {
        borderColor: COLORS.gold + '20',
    },
    rewardIcon: { fontSize: 20 },
    rewardName: {
        ...createTextStyle('xs', 'medium'),
        color: COLORS.white,
        textAlign: 'center',
    },
    claimText: {
        ...createTextStyle('xs', 'bold'),
        color: COLORS.success,
    },
    lockIcon: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
});

export default BattlePassScreen;
