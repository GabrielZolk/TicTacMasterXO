import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
  
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    FadeInUp,
} from 'react-native-reanimated';

import { useTheme } from '../hooks/useTheme';
import { useGame } from '../contexts/GameContext';
import { matchmakingService, MatchmakingStatus } from '../services/matchmakingService';
import { rankedService } from '../services/rankedService';
import { firebaseService } from '../services/firebaseService';
import { getLeagueForPoints, LeagueTier } from '../types/ranked';
import { RootStackParamList, GameMode } from '../types/game';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createTextStyle } from '../utils/theme';
import AppHeader from '../components/AppHeader';
import LeagueMedal from '../components/art/LeagueMedal';
import { useI18n } from '../i18n/useI18n';

const MatchmakingScreen: React.FC = () => {
    const { colors } = useTheme();
    const { t, tc } = useI18n();
    const { playSound, triggerHaptics } = useGame();
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RootStackParamList, 'OnlineLobby'>>();
    const mode = (route.params as any)?.mode || 'classic';

    const [status, setStatus] = useState<MatchmakingStatus>('idle');
    const [searchTime, setSearchTime] = useState(0);
    const [league, setLeague] = useState<{ tier: LeagueTier; icon: string; name: string; color: string; points: number }>(
        { tier: 'bronze', icon: '🥉', name: 'Bronze', color: '#CD7F32', points: 0 });

    const pulseScale = useSharedValue(1);

    useEffect(() => {
        loadProfile();
        startSearch();

        return () => {
            matchmakingService.leaveQueue();
        };
    }, []);

    // Search timer
    useEffect(() => {
        if (status === 'searching') {
            const interval = setInterval(() => setSearchTime(t => t + 1), 1000);
            return () => clearInterval(interval);
        }
    }, [status]);

    // Pulse animation while searching
    useEffect(() => {
        if (status === 'searching') {
            pulseScale.value = withRepeat(
                withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        } else {
            pulseScale.value = withTiming(1, { duration: 200 });
        }
    }, [status]);

    const loadProfile = async () => {
        const profile = await rankedService.getProfile();
        const l = getLeagueForPoints(profile.points);
        setLeague({ tier: l.tier, icon: l.icon, name: l.name, color: l.color, points: profile.points });
    };

    const startSearch = async () => {
        setSearchTime(0);
        setStatus('searching');

        // Ensure Firebase is initialized before matchmaking
        try {
            await firebaseService.initialize();
        } catch (error) {
            console.log('Firebase init for matchmaking:', error);
            setStatus('error');
            return;
        }

        matchmakingService.onStatus(async (newStatus, data) => {
            setStatus(newStatus);

            if (newStatus === 'found' && data?.roomCode) {
                await playSound('win');
                await triggerHaptics('heavy');

                // Connect both players to the SAME room. Previously the host
                // created a room with its own generated code (ignoring the
                // matchmaking code) and the guest never joined anything at all,
                // so every ranked match landed on a dead board.
                try {
                    if (data.isHost) {
                        await firebaseService.createRoom(mode as GameMode, t('defaultPlayerName'), data.roomCode);
                    } else {
                        // Give the host a moment to create the room first
                        await new Promise(resolve => setTimeout(resolve, 800));
                        await firebaseService.joinRoom(data.roomCode, t('defaultPlayerName'));
                    }
                } catch (error) {
                    console.error('Ranked room connection failed:', error);
                    setStatus('error');
                    return;
                }

                // Navigate to game
                setTimeout(() => {
                    (navigation as any).navigate('Game', {
                        mode,
                        opponent: 'online',
                        roomCode: data.roomCode,
                        playerName: t('defaultPlayerName'),
                        isHost: data.isHost,
                        opponentName: data.opponentName || 'Oponente',
                    });
                }, 500);
            }
        });

        await matchmakingService.cleanStaleEntries();
        await matchmakingService.joinQueue(t('defaultPlayerName'), mode as GameMode);
    };

    const handleCancel = async () => {
        await triggerHaptics('light');
        await matchmakingService.leaveQueue();
        navigation.goBack();
    };

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    const formatTime = (s: number) => {
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return min > 0 ? `${min}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
    };

    return (
        <LinearGradient colors={[colors.background, '#1A0A2E']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <AppHeader title={t('ranked')} showBack />

                <View style={styles.content}>
                    {/* League info */}
                    <Animated.View entering={FadeInUp.duration(400)} style={styles.leagueCard}>
                        <View style={styles.leagueIcon}><LeagueMedal tier={league.tier} size={56} /></View>
                        <Text style={[styles.leagueName, { color: league.color }]}>{tc(`league.${league.tier}`, league.name)}</Text>
                        <Text style={styles.leaguePoints}>{league.points} pts</Text>
                    </Animated.View>

                    {/* Search animation */}
                    <View style={styles.searchSection}>
                        {status === 'searching' && (
                            <>
                                <Animated.View style={[styles.searchCircle, pulseStyle]}>
                                    <Ionicons name="search" size={48} color={COLORS.gold} />
                                </Animated.View>
                                <Text style={styles.searchText}>{t('searchingOpponent')}</Text>
                                <Text style={styles.searchTime}>{formatTime(searchTime)}</Text>
                                {searchTime > 15 && (
                                    <Text style={styles.expandedText}>{t('expandingSearch')}</Text>
                                )}
                            </>
                        )}

                        {status === 'found' && (
                            <>
                                <View style={styles.foundCircle}>
                                    <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
                                </View>
                                <Text style={styles.foundText}>{t('opponentFound')}</Text>
                                <ActivityIndicator size="small" color={COLORS.lightGray} style={{ marginTop: 8 }} />
                            </>
                        )}

                        {status === 'error' && (
                            <>
                                <Ionicons name="alert-circle" size={64} color={COLORS.error} />
                                <Text style={styles.errorText}>{t('connectError')}</Text>
                                <TouchableOpacity style={styles.retryButton} onPress={startSearch}>
                                    <Text style={styles.retryText}>{t('tryAgain')}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    {/* Cancel */}
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.8}>
                        <Text style={styles.cancelText}>{t('cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    content: { flex: 1, paddingHorizontal: SPACING.lg, alignItems: 'center' },
    leagueCard: {
        alignItems: 'center',
        backgroundColor: COLORS.darkSecondary + 'CC',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        width: '100%',
        marginTop: SPACING.md,
        ...SHADOWS.medium,
    },
    leagueIcon: { marginBottom: 4 },
    leagueName: { ...createTextStyle('lg', 'bold'), marginTop: 4 },
    leaguePoints: { ...createTextStyle('sm', 'medium'), color: COLORS.lightGray },
    searchSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.gold + '15',
        borderWidth: 2,
        borderColor: COLORS.gold + '40',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
    },
    searchText: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.white,
    },
    searchTime: {
        ...createTextStyle('md', 'medium'),
        color: COLORS.lightGray,
        marginTop: 4,
    },
    expandedText: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.warning,
        marginTop: SPACING.sm,
    },
    foundCircle: {
        marginBottom: SPACING.lg,
    },
    foundText: {
        ...createTextStyle('xl', 'bold'),
        color: COLORS.success,
    },
    errorText: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.error,
        marginTop: SPACING.md,
    },
    retryButton: {
        backgroundColor: COLORS.xColor,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: BORDER_RADIUS.lg,
        marginTop: SPACING.md,
    },
    retryText: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
    },
    cancelButton: {
        borderWidth: 2,
        borderColor: COLORS.error + '60',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.xl,
    },
    cancelText: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.error,
    },
});

export default MatchmakingScreen;
