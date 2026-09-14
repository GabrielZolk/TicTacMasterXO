import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
  
    ScrollView,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme } from '../hooks/useTheme';
import { useGame } from '../contexts/GameContext';
import { useI18n } from '../i18n/useI18n';
import { rankedService } from '../services/rankedService';
import { RankedProfile, LEAGUES, getLeagueForPoints, LeagueInfo } from '../types/ranked';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createTextStyle } from '../utils/theme';
import AppHeader from '../components/AppHeader';
import LeagueMedal from '../components/art/LeagueMedal';

const { width } = Dimensions.get('window');

const RankedScreen: React.FC = () => {
    const { colors } = useTheme();
    const { t, tc } = useI18n();

    const [profile, setProfile] = useState<RankedProfile | null>(null);

    useEffect(() => {
        rankedService.getProfile().then(setProfile);
        const unsub = rankedService.subscribe(() => {
            rankedService.getProfile().then(setProfile);
        });
        return unsub;
    }, []);

    if (!profile) return null;

    const currentLeague = getLeagueForPoints(profile.points);
    const nextLeague = LEAGUES.find(l => l.minPoints > profile.points);
    const prevLeagueMax = LEAGUES.filter(l => l.minPoints <= profile.points).pop();

    // Progress bar within current league
    const leagueMin = currentLeague.minPoints;
    const leagueMax = nextLeague ? nextLeague.minPoints : currentLeague.maxPoints;
    const progressInLeague = leagueMax > leagueMin
        ? (profile.points - leagueMin) / (leagueMax - leagueMin)
        : 1;

    const winRate = profile.gamesPlayed > 0
        ? Math.round((profile.wins / profile.gamesPlayed) * 100)
        : 0;

    const renderLeagueTier = (league: LeagueInfo, index: number) => {
        const isCurrent = league.tier === currentLeague.tier;
        const isReached = profile.points >= league.minPoints;

        return (
            <Animated.View
                key={league.tier}
                entering={FadeInUp.delay(index * 80).duration(300)}
                style={[
                    styles.leagueTierCard,
                    isCurrent && { borderColor: league.color, borderWidth: 2 },
                    !isReached && styles.leagueTierLocked,
                ]}
            >
                <View style={styles.leagueTierIcon}><LeagueMedal tier={league.tier} size={40} /></View>
                <View style={styles.leagueTierInfo}>
                    <Text style={[styles.leagueTierName, { color: isReached ? league.color : COLORS.gray }]}>
                        {tc(`league.${league.tier}`, league.name)}
                    </Text>
                    <Text style={styles.leagueTierPoints}>{league.minPoints}+ pts</Text>
                </View>
                {isCurrent && (
                    <View style={[styles.currentBadge, { backgroundColor: league.color }]}>
                        <Text style={styles.currentBadgeText}>{t('currentBadge')}</Text>
                    </View>
                )}
            </Animated.View>
        );
    };

    return (
        <LinearGradient colors={[colors.background, colors.background + 'E0']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <AppHeader title={t('ranked')} showBack />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                    {/* Current league card */}
                    <Animated.View entering={FadeInUp.duration(500)} style={styles.mainCard}>
                        <View style={styles.mainIcon}><LeagueMedal tier={currentLeague.tier} size={76} /></View>
                        <Text style={[styles.mainName, { color: currentLeague.color }]}>{tc(`league.${currentLeague.tier}`, currentLeague.name)}</Text>
                        <Text style={styles.mainPoints}>{profile.points} {t('points')}</Text>

                        {/* Progress bar to next league */}
                        {nextLeague && (
                            <View style={styles.progressSection}>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, {
                                        width: `${Math.min(progressInLeague * 100, 100)}%`,
                                        backgroundColor: currentLeague.color,
                                    }]} />
                                </View>
                                <Text style={styles.progressText}>
                                    {t('ptsToNext', {
                                        pts: String(nextLeague.minPoints - profile.points),
                                        league: tc(`league.${nextLeague.tier}`, nextLeague.name),
                                    })}
                                </Text>
                            </View>
                        )}
                    </Animated.View>

                    {/* Stats grid */}
                    <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{profile.wins}</Text>
                            <Text style={styles.statLabel}>{t('wins')}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{profile.losses}</Text>
                            <Text style={styles.statLabel}>{t('losses')}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{profile.draws}</Text>
                            <Text style={styles.statLabel}>{t('draws')}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{winRate}%</Text>
                            <Text style={styles.statLabel}>{t('winRate')}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{profile.winStreak}</Text>
                            <Text style={styles.statLabel}>{t('streakLabel')}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{profile.bestStreak}</Text>
                            <Text style={styles.statLabel}>{t('bestLabel')}</Text>
                        </View>
                    </Animated.View>

                    {/* All leagues */}
                    <Text style={styles.sectionTitle}>{t('league')}s</Text>
                    <View style={styles.leaguesList}>
                        {LEAGUES.map((league, i) => renderLeagueTier(league, i))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
    mainCard: {
        alignItems: 'center',
        backgroundColor: COLORS.darkSecondary + 'CC',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.xl,
        marginTop: SPACING.md,
        ...SHADOWS.medium,
    },
    mainIcon: { marginBottom: SPACING.sm },
    mainName: { ...createTextStyle('xl', 'bold'), marginBottom: 4 },
    mainPoints: { ...createTextStyle('lg', 'medium'), color: COLORS.lightGray },
    progressSection: { width: '100%', marginTop: SPACING.lg },
    progressBarBg: {
        height: 10,
        backgroundColor: COLORS.darkTertiary,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: { height: '100%', borderRadius: 5 },
    progressText: {
        ...createTextStyle('xs', 'medium'),
        color: COLORS.gray,
        textAlign: 'center',
        marginTop: 6,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginTop: SPACING.lg,
    },
    statCard: {
        width: (width - SPACING.lg * 2 - SPACING.sm * 2) / 3,
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        alignItems: 'center',
        ...SHADOWS.light,
    },
    statValue: { ...createTextStyle('lg', 'bold'), color: COLORS.white },
    statLabel: { ...createTextStyle('xs', 'regular'), color: COLORS.gray, marginTop: 2 },
    sectionTitle: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
        marginTop: SPACING.xl,
        marginBottom: SPACING.sm,
    },
    leaguesList: { gap: SPACING.sm },
    leagueTierCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        ...SHADOWS.light,
    },
    leagueTierLocked: { opacity: 0.4 },
    leagueTierIcon: { marginRight: SPACING.md },
    leagueTierInfo: { flex: 1 },
    leagueTierName: { ...createTextStyle('md', 'bold') },
    leagueTierPoints: { ...createTextStyle('xs', 'regular'), color: COLORS.gray },
    currentBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    currentBadgeText: { ...createTextStyle('xs', 'bold'), color: COLORS.white },
});

export default RankedScreen;
