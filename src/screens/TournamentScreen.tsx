import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
  
    TouchableOpacity,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme } from '../hooks/useTheme';
import { useGame } from '../contexts/GameContext';
import { useI18n } from '../i18n/useI18n';
import { tournamentService } from '../services/tournamentService';
import { TOURNAMENT_CONFIG } from '../types/tournament';
import { storeService } from '../services/storeService';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createTextStyle } from '../utils/theme';
import AppHeader from '../components/AppHeader';

const TournamentScreen: React.FC = () => {
    const { colors } = useTheme();
    const { playSound, triggerHaptics } = useGame();
    const { t } = useI18n();
    const navigation = useNavigation();

    const [wallet, setWallet] = useState(0);
    const [tournamentState, setTournamentState] = useState(tournamentService.getState());

    useEffect(() => {
        loadData();
        // Defensive: if a previous tournament left a half-finished state
        // (currentRound out of range or all rounds played), reset before showing UI
        const s = tournamentService.getState();
        if (s.isActive && s.currentRound >= TOURNAMENT_CONFIG.rounds.length) {
            tournamentService.cancel();
        }
        setTournamentState(tournamentService.getState());
        const unsub = tournamentService.subscribe(() => {
            setTournamentState(tournamentService.getState());
        });
        return unsub;
    }, []);

    const loadData = async () => {
        const w = await storeService.getWallet();
        setWallet(w.stars);
    };

    const handleStart = async () => {
        await triggerHaptics('heavy');

        if (wallet < TOURNAMENT_CONFIG.entryFee) {
            Alert.alert(
                t('tournamentInsufficientStars'),
                t('tournamentInsufficientStarsBody').replace('{fee}', String(TOURNAMENT_CONFIG.entryFee)),
            );
            return;
        }

        Alert.alert(
            t('tournamentEnterTitle'),
            t('tournamentEnterBody').replace('{fee}', String(TOURNAMENT_CONFIG.entryFee)),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('tournamentEnterAction'),
                    onPress: async () => {
                        const started = await tournamentService.start();
                        if (started) {
                            await playSound('button');
                            await loadData();
                            // Navigate to first round
                            const round = tournamentService.getCurrentRound();
                            if (round) {
                                (navigation as any).navigate('Game', {
                                    mode: 'classic',
                                    opponent: 'ai',
                                    difficulty: round.difficulty,
                                });
                            }
                        }
                    },
                },
            ]
        );
    };

    const handleContinue = async () => {
        await triggerHaptics('medium');
        await playSound('button');
        const round = tournamentService.getCurrentRound();
        if (round) {
            (navigation as any).navigate('Game', {
                mode: 'classic',
                opponent: 'ai',
                difficulty: round.difficulty,
            });
        }
    };

    return (
        <LinearGradient colors={[colors.background, '#1A0A00']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <AppHeader title={t('tournament')} showBack />

                <View style={styles.content}>
                    {/* Trophy */}
                    <Animated.View entering={FadeInUp.duration(500)} style={styles.trophySection}>
                        <Text style={styles.trophyIcon}>🏆</Text>
                        <Text style={styles.trophyTitle}>{t('tournament')}</Text>
                        <Text style={styles.trophyDesc}>{t('tournamentLongDesc')}</Text>
                    </Animated.View>

                    {/* Rounds overview */}
                    <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.roundsSection}>
                        {TOURNAMENT_CONFIG.rounds.map((round, i) => {
                            const isComplete = tournamentState.isActive && i < tournamentState.currentRound;
                            const isCurrent = tournamentState.isActive && i === tournamentState.currentRound;

                            return (
                                <View key={i} style={[
                                    styles.roundCard,
                                    isComplete && styles.roundComplete,
                                    isCurrent && styles.roundCurrent,
                                ]}>
                                    <View style={[styles.roundBadge, isComplete && { backgroundColor: COLORS.success }]}>
                                        {isComplete ? (
                                            <Ionicons name="checkmark" size={16} color={COLORS.white} />
                                        ) : (
                                            <Text style={styles.roundNumber}>{round.round}</Text>
                                        )}
                                    </View>
                                    <View style={styles.roundInfo}>
                                        <Text style={styles.roundLabel}>
                                            {t('roundLabelN').replace('{n}', String(round.round))} — {t(`difficulties.${round.difficulty}.title` as any)}
                                        </Text>
                                    </View>
                                    {isCurrent && (
                                        <Ionicons name="arrow-forward" size={18} color={COLORS.gold} />
                                    )}
                                </View>
                            );
                        })}
                    </Animated.View>

                    {/* Rewards */}
                    <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.rewardSection}>
                        <Text style={styles.rewardTitle}>{t('tournamentRewards')}</Text>
                        <View style={styles.rewardRow}>
                            <Text style={styles.rewardIcon}>🏆</Text>
                            <Text style={styles.rewardText}>
                                {t('tournamentRewardWin').replace('{stars}', String(TOURNAMENT_CONFIG.rewards.win.stars))}
                            </Text>
                        </View>
                        <View style={styles.rewardRow}>
                            <Text style={styles.rewardIcon}>😔</Text>
                            <Text style={styles.rewardText}>
                                {t('tournamentRewardLoss').replace('{stars}', String(TOURNAMENT_CONFIG.rewards.loss.stars))}
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Action */}
                    <View style={styles.actionSection}>
                        {tournamentState.isActive ? (
                            <>
                                <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.8}>
                                    <Text style={styles.buttonText}>
                                        {t('tournamentContinueRound').replace('{n}', String(tournamentState.currentRound + 1))}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.abandonButton}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        Alert.alert(
                                            t('tournamentAbandonTitle'),
                                            t('tournamentAbandonBody'),
                                            [
                                                { text: t('cancel') || 'Cancel', style: 'cancel' },
                                                {
                                                    text: t('tournamentAbandon'),
                                                    style: 'destructive',
                                                    onPress: () => tournamentService.cancel(),
                                                },
                                            ]
                                        );
                                    }}
                                >
                                    <Text style={styles.abandonText}>{t('tournamentAbandon')}</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
                                <Text style={styles.buttonText}>
                                    {t('tournamentEnter').replace('{fee}', String(TOURNAMENT_CONFIG.entryFee))}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    content: { flex: 1, paddingHorizontal: SPACING.lg },
    trophySection: {
        alignItems: 'center',
        paddingVertical: SPACING.lg,
    },
    trophyIcon: { fontSize: 64, marginBottom: SPACING.sm },
    trophyTitle: {
        ...createTextStyle('xl', 'bold'),
        color: COLORS.gold,
        marginBottom: 4,
    },
    trophyDesc: {
        ...createTextStyle('sm', 'regular'),
        color: COLORS.lightGray,
        textAlign: 'center',
    },
    roundsSection: {
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    roundCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        gap: SPACING.md,
        ...SHADOWS.light,
    },
    roundComplete: {
        backgroundColor: COLORS.success + '20',
        borderWidth: 1,
        borderColor: COLORS.success,
    },
    roundCurrent: {
        borderWidth: 2,
        borderColor: COLORS.gold,
    },
    roundBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.darkTertiary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roundNumber: {
        ...createTextStyle('sm', 'bold'),
        color: COLORS.white,
    },
    roundInfo: { flex: 1 },
    roundLabel: {
        ...createTextStyle('sm', 'bold'),
        color: COLORS.white,
    },
    rewardSection: {
        backgroundColor: COLORS.darkSecondary + 'CC',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    rewardTitle: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.gold,
        marginBottom: 4,
    },
    rewardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    rewardIcon: { fontSize: 20 },
    rewardText: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.lightGray,
    },
    actionSection: {
        marginTop: 'auto',
        paddingBottom: SPACING.xl,
    },
    startButton: {
        backgroundColor: COLORS.gold,
        paddingVertical: 16,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    continueButton: {
        backgroundColor: COLORS.xColor,
        paddingVertical: 16,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    buttonText: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
    },
    abandonButton: {
        marginTop: SPACING.sm,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
    },
    abandonText: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.error,
        textDecorationLine: 'underline',
    },
});

export default TournamentScreen;
