import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
  
    TouchableOpacity,
    TextInput,
    Alert,
    Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
// Clipboard is optional — works without expo-clipboard
let Clipboard: any = null;
try { Clipboard = require('expo-clipboard'); } catch {}

import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n/useI18n';
import { useGame } from '../contexts/GameContext';
import { referralService, REFERRAL_REWARD } from '../services/referralService';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createTextStyle } from '../utils/theme';
import AppHeader from '../components/AppHeader';

const ReferralScreen: React.FC = () => {
    const { colors } = useTheme();
    const { playSound, triggerHaptics } = useGame();
    const { t } = useI18n();

    const [myCode, setMyCode] = useState('------');
    const [inputCode, setInputCode] = useState('');
    const [stats, setStats] = useState({ invitedCount: 0, totalEarned: 0 });
    const [hasUsed, setHasUsed] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        await referralService.initialize();
        setMyCode(referralService.getMyCode());
        setStats(referralService.getStats());
        setHasUsed(referralService.hasUsedCode());

        // Check if anyone used our code
        const newInvites = await referralService.checkInvites();
        if (newInvites > 0) {
            Alert.alert(t('newInvitesTitle'), t('newInvitesBody').replace('{count}', String(newInvites)).replace('{stars}', String(newInvites * REFERRAL_REWARD)));
            setStats(referralService.getStats());
        }
    };

    const handleShare = async () => {
        await triggerHaptics('medium');
        try {
            await Share.share({
                message: referralService.getShareMessage(),
            });
        } catch {
            // User cancelled
        }
    };

    const handleCopyCode = async () => {
        await triggerHaptics('light');
        try {
            // Clipboard may not be available
            if (Clipboard && Clipboard.setStringAsync) {
                await Clipboard.setStringAsync(myCode);
            }
        } catch {}
        await playSound('button');
        Alert.alert(t('copiedTitle'), t('codeCopiedBody'));
    };

    const handleUseCode = async () => {
        if (submitting || !inputCode.trim()) return;
        setSubmitting(true);
        await triggerHaptics('medium');

        const result = await referralService.useCode(inputCode);

        // The service returns an i18n key, not text, so the message follows the
        // UI language instead of always coming out in Portuguese.
        const body = t(result.message as any).replace('{stars}', String(REFERRAL_REWARD));

        if (result.success) {
            await playSound('win');
            Alert.alert(t('successTitle'), body);
            setHasUsed(true);
        } else {
            Alert.alert(t('errorTitle'), body);
        }

        setSubmitting(false);
    };

    return (
        <LinearGradient colors={[colors.background, colors.background + 'E0']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <AppHeader title={t('inviteFriendsTitle')} showBack />

                <View style={styles.content}>
                    {/* My code section */}
                    <Animated.View entering={FadeInUp.duration(400)} style={styles.codeCard}>
                        <Text style={styles.codeLabel}>{t('referralCodeLabel')}</Text>
                        <TouchableOpacity onPress={handleCopyCode} activeOpacity={0.7}>
                            <Text style={styles.codeText}>{myCode}</Text>
                        </TouchableOpacity>
                        <Text style={styles.codeTip}>{t('tapToCopy')}</Text>

                        <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.8}>
                            <Ionicons name="share-social" size={20} color={COLORS.white} />
                            <Text style={styles.shareButtonText}>{t('shareAction')}</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Stats */}
                    <Animated.View entering={FadeInUp.delay(150).duration(400)} style={styles.statsCard}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.invitedCount}</Text>
                            <Text style={styles.statLabel}>{t('friendsInvited')}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.totalEarned} ⭐</Text>
                            <Text style={styles.statLabel}>{t('starsEarned')}</Text>
                        </View>
                    </Animated.View>

                    {/* Reward info */}
                    <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.rewardInfo}>
                        <Ionicons name="gift" size={24} color={COLORS.gold} />
                        <Text style={styles.rewardText}>{t('referralRewardInfo').replace('{stars}', String(REFERRAL_REWARD))}</Text>
                    </Animated.View>

                    {/* Enter code section */}
                    {!hasUsed && (
                        <Animated.View entering={FadeInUp.delay(450).duration(400)} style={styles.enterCodeCard}>
                            <Text style={styles.enterCodeLabel}>{t('haveFriendCode')}</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.codeInput}
                                    placeholder={t('codePlaceholder')}
                                    placeholderTextColor={COLORS.gray}
                                    value={inputCode}
                                    onChangeText={setInputCode}
                                    maxLength={6}
                                    autoCapitalize="characters"
                                />
                                <TouchableOpacity
                                    style={[styles.useButton, submitting && { opacity: 0.5 }]}
                                    onPress={handleUseCode}
                                    disabled={submitting}
                                >
                                    <Text style={styles.useButtonText}>{submitting ? '...' : 'Usar'}</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    )}

                    {hasUsed && (
                        <Animated.View entering={FadeInUp.delay(450).duration(400)} style={styles.usedBadge}>
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                            <Text style={styles.usedText}>{t('codeAlreadyUsed')}</Text>
                        </Animated.View>
                    )}
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
    codeCard: {
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.xl,
        alignItems: 'center',
        marginBottom: SPACING.md,
        ...SHADOWS.medium,
    },
    codeLabel: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.lightGray,
        marginBottom: SPACING.sm,
    },
    codeText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.gold,
        letterSpacing: 8,
    },
    codeTip: {
        ...createTextStyle('xs', 'regular'),
        color: COLORS.gray,
        marginTop: 4,
        marginBottom: SPACING.md,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.xColor,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: BORDER_RADIUS.lg,
        gap: 8,
        ...SHADOWS.medium,
    },
    shareButtonText: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        ...SHADOWS.light,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: COLORS.darkTertiary,
    },
    statValue: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.white,
    },
    statLabel: {
        ...createTextStyle('xs', 'regular'),
        color: COLORS.gray,
        marginTop: 2,
    },
    rewardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gold + '15',
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    rewardText: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.gold,
        flex: 1,
    },
    enterCodeCard: {
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        ...SHADOWS.light,
    },
    enterCodeLabel: {
        ...createTextStyle('sm', 'bold'),
        color: COLORS.white,
        marginBottom: SPACING.sm,
    },
    inputRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    codeInput: {
        flex: 1,
        backgroundColor: COLORS.darkBackground,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: 12,
        ...createTextStyle('lg', 'bold'),
        color: COLORS.white,
        letterSpacing: 4,
        textAlign: 'center',
    },
    useButton: {
        backgroundColor: COLORS.success,
        paddingHorizontal: 24,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    useButtonText: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
    },
    usedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'center',
        padding: SPACING.md,
    },
    usedText: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.success,
    },
});

export default ReferralScreen;
