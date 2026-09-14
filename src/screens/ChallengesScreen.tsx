import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
  
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme } from '../hooks/useTheme';
import { useGame } from '../contexts/GameContext';
import { useI18n } from '../i18n/useI18n';
import { missionSlug, dailySlug } from '../i18n/rewardLabel';
import { challengeService } from '../services/challengeService';
import { DailyChallenge, ChallengeProgress, WeeklyMission, MissionProgress } from '../types/challenges';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createTextStyle } from '../utils/theme';
import AppHeader from '../components/AppHeader';

const ChallengesScreen: React.FC = () => {
    const { colors } = useTheme();
    const { playSound, triggerHaptics } = useGame();
    const { t, tc } = useI18n();

    const [daily, setDaily] = useState<{ challenge: DailyChallenge | null; progress: ChallengeProgress | null }>({ challenge: null, progress: null });
    const [missions, setMissions] = useState<{ missions: WeeklyMission[]; progress: MissionProgress[] }>({ missions: [], progress: [] });

    useEffect(() => {
        loadData();
        const unsub = challengeService.subscribe(loadData);
        return unsub;
    }, []);

    const loadData = () => {
        setDaily(challengeService.getDaily());
        setMissions(challengeService.getMissions());
    };

    const handleClaimDaily = async () => {
        await triggerHaptics('heavy');
        const reward = await challengeService.claimDailyReward();
        if (reward) {
            await playSound('win');
            Alert.alert(t('rewardTitle'), `+${reward.stars} ⭐  +${reward.xp} XP`);
        }
    };

    const handleClaimMission = async (index: number) => {
        await triggerHaptics('heavy');
        const reward = await challengeService.claimMissionReward(index);
        if (reward) {
            await playSound('win');
            Alert.alert(t('rewardTitle'), `+${reward.stars} ⭐  +${reward.xp} XP`);
        }
    };

    const renderProgressBar = (current: number, target: number, color: string) => {
        const pct = Math.min((current / target) * 100, 100);
        return (
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
        );
    };

    return (
        <LinearGradient colors={[colors.background, colors.background + 'E0']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <AppHeader title={t('challenges')} showBack />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                    {/* Daily Challenge. It was being generated, tracked and made
                        claimable every day — handleClaimDaily has been here all
                        along — but the section that renders it was never written,
                        so the reward existed and nobody could see or chase it. */}
                    {daily.challenge && daily.progress && (
                        <Animated.View entering={FadeInUp.delay(120).duration(400)}>
                            <Text style={styles.sectionTitle}>{t('dailyChallengeSection')}</Text>
                            <View style={[styles.challengeCard, { borderColor: COLORS.gold }]}>
                                <View style={styles.challengeHeader}>
                                    <Text style={styles.challengeIcon}>{daily.challenge.icon}</Text>
                                    <View style={styles.challengeInfo}>
                                        <Text style={styles.challengeTitle}>
                                            {tc(`daily.${dailySlug(daily.challenge.title)}.title`, daily.challenge.title)}
                                        </Text>
                                        <Text style={styles.challengeDesc}>
                                            {tc(`daily.${dailySlug(daily.challenge.title)}.desc`, daily.challenge.description)}
                                        </Text>
                                    </View>
                                    <View style={[styles.rewardBadge, { backgroundColor: COLORS.gold + '20' }]}>
                                        <Text style={[styles.rewardText, { color: COLORS.gold }]}>
                                            {daily.challenge.reward.stars} ⭐
                                        </Text>
                                    </View>
                                </View>

                                {renderProgressBar(daily.progress.currentValue, daily.progress.targetValue, COLORS.gold)}

                                <View style={styles.progressRow}>
                                    <Text style={styles.progressText}>
                                        {daily.progress.currentValue}/{daily.progress.targetValue}
                                    </Text>
                                    {daily.progress.completed && !daily.progress.claimed ? (
                                        <TouchableOpacity style={[styles.claimButton, { backgroundColor: COLORS.gold }]} onPress={handleClaimDaily}>
                                            <Text style={styles.claimButtonText}>{t('claimAction')}</Text>
                                        </TouchableOpacity>
                                    ) : daily.progress.claimed ? (
                                        <View style={styles.claimedBadge}>
                                            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                                            <Text style={styles.claimedText}>{t('claimedLabel')}</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.progressText}>+{daily.challenge.reward.xp} XP</Text>
                                    )}
                                </View>
                            </View>
                        </Animated.View>
                    )}

                    {/* Weekly Missions */}
                    <Animated.View entering={FadeInUp.delay(200).duration(400)}>
                        <Text style={styles.sectionTitle}>{t('weeklyMissionsSection')}</Text>
                        {missions.missions.map((mission, i) => {
                            const progress = missions.progress[i];
                            if (!progress) return null;

                            return (
                                <Animated.View key={mission.id} entering={FadeInUp.delay(300 + i * 80).duration(300)}>
                                    <View style={[styles.challengeCard, { borderColor: COLORS.info }]}>
                                        <View style={styles.challengeHeader}>
                                            <Text style={styles.challengeIcon}>{mission.icon}</Text>
                                            <View style={styles.challengeInfo}>
                                                <Text style={styles.challengeTitle}>{tc(`mission.${missionSlug(mission.title)}.title`, mission.title)}</Text>
                                                <Text style={styles.challengeDesc}>{tc(`mission.${missionSlug(mission.title)}.desc`, mission.description)}</Text>
                                            </View>
                                            <View style={[styles.rewardBadge, { backgroundColor: COLORS.info + '20' }]}>
                                                <Text style={[styles.rewardText, { color: COLORS.info }]}>{mission.reward.stars} ⭐</Text>
                                            </View>
                                        </View>

                                        {renderProgressBar(progress.currentValue, progress.targetValue, COLORS.info)}

                                        <View style={styles.progressRow}>
                                            <Text style={styles.progressText}>
                                                {progress.currentValue}/{progress.targetValue}
                                            </Text>
                                            {progress.completed && !progress.claimed ? (
                                                <TouchableOpacity style={[styles.claimButton, { backgroundColor: COLORS.info }]} onPress={() => handleClaimMission(i)}>
                                                    <Text style={styles.claimButtonText}>{t('claimAction')}</Text>
                                                </TouchableOpacity>
                                            ) : progress.claimed ? (
                                                <View style={styles.claimedBadge}>
                                                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                                                    <Text style={styles.claimedText}>{t('claimedLabel')}</Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    </View>
                                </Animated.View>
                            );
                        })}
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
    sectionTitle: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.white,
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
    },
    challengeCard: {
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 1,
        marginBottom: SPACING.sm,
        ...SHADOWS.light,
    },
    challengeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    challengeIcon: { fontSize: 32, marginRight: SPACING.md },
    challengeInfo: { flex: 1 },
    challengeTitle: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
    },
    challengeDesc: {
        ...createTextStyle('xs', 'regular'),
        color: COLORS.lightGray,
        marginTop: 2,
    },
    rewardBadge: {
        backgroundColor: COLORS.gold + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    rewardText: {
        ...createTextStyle('sm', 'bold'),
        color: COLORS.gold,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: COLORS.darkTertiary,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: SPACING.xs,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressText: {
        ...createTextStyle('xs', 'medium'),
        color: COLORS.gray,
    },
    claimButton: {
        backgroundColor: COLORS.gold,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
    },
    claimButtonText: {
        ...createTextStyle('sm', 'bold'),
        color: COLORS.darkBackground,
    },
    claimedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    claimedText: {
        ...createTextStyle('xs', 'medium'),
        color: COLORS.success,
    },
    loadingText: {
        ...createTextStyle('sm', 'regular'),
        color: COLORS.gray,
        textAlign: 'center',
        padding: SPACING.lg,
    },
});

export default ChallengesScreen;
