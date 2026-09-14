import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Share,
    Alert,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';

import AppHeader from '../components/AppHeader';
import GameBoard from '../components/GameBoard';
import { useTheme } from '../hooks/useTheme';
import { useGame } from '../contexts/GameContext';
import { useI18n } from '../i18n/useI18n';
import { dailyDuelService, MAX_ATTEMPTS } from '../services/dailyDuelService';
import {
    DailyPuzzle,
    bestDefenceMove,
    boardIsFull,
    boardWinner,
    isCorrectMove,
} from '../utils/dailyDuel';
import { Board } from '../types/game';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createTextStyle } from '../utils/theme';

type Phase = 'playing' | 'solved' | 'failedAttempt' | 'outOfAttempts' | 'done';

const cloneBoard = (b: Board): Board => b.map(r => [...r]);

const DailyDuelScreen: React.FC = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { playSound, triggerHaptics } = useGame();
    const { t } = useI18n();

    const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
    const [board, setBoard] = useState<Board | null>(null);
    const [movesUsed, setMovesUsed] = useState(0);
    const [phase, setPhase] = useState<Phase>('playing');
    const [duelState, setDuelState] = useState(dailyDuelService.getState());
    const [rewardStars, setRewardStars] = useState(0);
    const [rewardChest, setRewardChest] = useState(false);
    const busyRef = useRef(false);

    const loadToday = useCallback(async () => {
        await dailyDuelService.initialize();
        const p = dailyDuelService.getTodayPuzzle();
        const s = dailyDuelService.getState();
        setPuzzle(p);
        setDuelState(s);
        setBoard(cloneBoard(p.board));
        setMovesUsed(0);
        setPhase(s.solved || s.failed ? 'done' : 'playing');
    }, []);

    useEffect(() => {
        loadToday();
        const unsub = dailyDuelService.subscribe(() => {
            setDuelState(dailyDuelService.getState());
        });
        return unsub;
    }, [loadToday]);

    /** Restart the current puzzle for a fresh attempt. */
    const retry = () => {
        if (!puzzle) return;
        setBoard(cloneBoard(puzzle.board));
        setMovesUsed(0);
        setPhase('playing');
    };

    const handleCellPress = async (row: number, col: number) => {
        if (!board || phase !== 'playing' || busyRef.current) return;
        if (board[row][col] !== null) return;

        busyRef.current = true;
        try {
            const correct = isCorrectMove(board, row, col);
            const next = cloneBoard(board);
            next[row][col] = 'X';
            const newMoves = movesUsed + 1;
            setBoard(next);
            setMovesUsed(newMoves);

            if (!correct) {
                // The move throws away the forced win — attempt spent.
                await playSound('error');
                await triggerHaptics('heavy');
                const s = await dailyDuelService.recordFailedAttempt();
                setDuelState(s);
                setPhase(s.failed ? 'outOfAttempts' : 'failedAttempt');
                return;
            }

            if (boardWinner(next) === 'X') {
                await playSound('win');
                await triggerHaptics('heavy');
                const result = await dailyDuelService.recordSolved(newMoves);
                setDuelState(result.state);
                setRewardStars(result.stars);
                setRewardChest(result.chest);
                setPhase('solved');
                return;
            }

            await playSound('click');
            await triggerHaptics('light');

            // Opponent defends optimally
            const defence = bestDefenceMove(next);
            if (defence) {
                await new Promise(resolve => setTimeout(resolve, 350));
                const afterDefence = cloneBoard(next);
                afterDefence[defence.row][defence.col] = 'O';
                setBoard(afterDefence);

                if (boardIsFull(afterDefence) && !boardWinner(afterDefence)) {
                    const s = await dailyDuelService.recordFailedAttempt();
                    setDuelState(s);
                    setPhase(s.failed ? 'outOfAttempts' : 'failedAttempt');
                }
            }
        } finally {
            busyRef.current = false;
        }
    };

    const handleShare = async () => {
        try {
            await triggerHaptics('medium');
            await Share.share({ message: dailyDuelService.getShareText() });
        } catch (error) {
            console.log('Share cancelled:', error);
        }
    };

    const attemptSquares = () => {
        const squares: string[] = [];
        for (let i = 1; i <= MAX_ATTEMPTS; i++) {
            if (duelState.solved && i === duelState.attemptsUsed) squares.push('🟩');
            else if (i <= duelState.attemptsUsed) squares.push('🟥');
            else squares.push('⬜');
        }
        return squares.join(' ');
    };

    const attemptsLeft = Math.max(0, MAX_ATTEMPTS - duelState.attemptsUsed);
    const alreadyFinished = phase === 'solved' || phase === 'outOfAttempts' || phase === 'done';

    return (
        <LinearGradient colors={[colors.background, '#0A0A1A']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <AppHeader title={t('dailyDuel')} showBack />

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Puzzle header */}
                    <Animated.View entering={FadeInUp.duration(400)} style={styles.headerCard}>
                        <Text style={styles.puzzleNumber}>
                            {t('duelNumber').replace('{number}', String(puzzle?.number ?? '—'))}
                        </Text>
                        <Text style={styles.goal}>
                            {t('duelGoal').replace('{moves}', String(puzzle?.parMoves ?? 2))}
                        </Text>

                        <View style={styles.statsRow}>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>🔥 {duelState.streak}</Text>
                                <Text style={styles.statLabel}>{t('duelStreak')}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{attemptSquares()}</Text>
                                <Text style={styles.statLabel}>
                                    {t('duelAttemptsLeft').replace('{count}', String(attemptsLeft))}
                                </Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Board */}
                    {board && (
                        <Animated.View entering={FadeInUp.delay(120).duration(400)} style={styles.boardWrap}>
                            <GameBoard
                                board={board}
                                onCellPress={handleCellPress}
                                moves={[]}
                                disabled={phase !== 'playing'}
                            />
                        </Animated.View>
                    )}

                    {/* Status / actions */}
                    <Animated.View entering={FadeIn.delay(200)} style={styles.statusArea}>
                        {phase === 'playing' && (
                            <Text style={styles.hintText}>{t('duelYourTurn')}</Text>
                        )}

                        {phase === 'failedAttempt' && (
                            <>
                                <Text style={[styles.resultTitle, { color: COLORS.error }]}>
                                    {t('duelWrongMove')}
                                </Text>
                                <Text style={styles.resultBody}>
                                    {t('duelAttemptsLeft').replace('{count}', String(attemptsLeft))}
                                </Text>
                                <TouchableOpacity style={styles.primaryButton} onPress={retry} activeOpacity={0.85}>
                                    <Ionicons name="refresh" size={18} color={COLORS.white} />
                                    <Text style={styles.primaryButtonText}>{t('duelTryAgain')}</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {phase === 'solved' && (
                            <>
                                <Text style={[styles.resultTitle, { color: COLORS.success }]}>
                                    {t('duelSolved')}
                                </Text>
                                <Text style={styles.resultBody}>
                                    {t('duelReward').replace('{stars}', String(rewardStars))}
                                    {rewardChest ? `\n${t('duelStreakChest')}` : ''}
                                </Text>
                                <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
                                    <Ionicons name="share-social" size={18} color={COLORS.darkBackground} />
                                    <Text style={styles.shareButtonText}>{t('duelShare')}</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {phase === 'outOfAttempts' && (
                            <>
                                <Text style={[styles.resultTitle, { color: COLORS.error }]}>
                                    {t('duelOutOfAttempts')}
                                </Text>
                                <Text style={styles.resultBody}>{t('duelComeBackTomorrow')}</Text>
                                <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
                                    <Ionicons name="share-social" size={18} color={COLORS.darkBackground} />
                                    <Text style={styles.shareButtonText}>{t('duelShare')}</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {phase === 'done' && (
                            <>
                                <Text style={[styles.resultTitle, { color: duelState.solved ? COLORS.success : COLORS.error }]}>
                                    {duelState.solved ? t('duelAlreadySolved') : t('duelOutOfAttempts')}
                                </Text>
                                <Text style={styles.resultBody}>{t('duelComeBackTomorrow')}</Text>
                                <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
                                    <Ionicons name="share-social" size={18} color={COLORS.darkBackground} />
                                    <Text style={styles.shareButtonText}>{t('duelShare')}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </Animated.View>

                    {/* All-time */}
                    <View style={styles.footerStats}>
                        <Text style={styles.footerText}>
                            {t('duelTotalSolved').replace('{count}', String(duelState.totalSolved))}
                            {'   ·   '}
                            {t('duelBestStreak').replace('{count}', String(duelState.bestStreak))}
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    content: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xl,
    },
    headerCard: {
        backgroundColor: COLORS.darkSecondary + 'CC',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.gold + '40',
        ...SHADOWS.light,
    },
    puzzleNumber: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.gold,
    },
    goal: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.lightGray,
        textAlign: 'center',
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        gap: SPACING.lg,
        marginTop: SPACING.md,
    },
    statBox: { alignItems: 'center' },
    statValue: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
        letterSpacing: 2,
    },
    statLabel: {
        ...createTextStyle('xs', 'regular'),
        color: COLORS.gray,
        marginTop: 2,
    },
    boardWrap: {
        marginTop: SPACING.lg,
        alignItems: 'center',
    },
    statusArea: {
        marginTop: SPACING.lg,
        alignItems: 'center',
        gap: SPACING.sm,
    },
    hintText: {
        ...createTextStyle('md', 'medium'),
        color: COLORS.lightGray,
    },
    resultTitle: {
        ...createTextStyle('lg', 'bold'),
        textAlign: 'center',
    },
    resultBody: {
        ...createTextStyle('sm', 'regular'),
        color: COLORS.lightGray,
        textAlign: 'center',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.xColor,
        paddingHorizontal: SPACING.xl,
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.lg,
        marginTop: SPACING.sm,
        ...SHADOWS.medium,
    },
    primaryButtonText: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.gold,
        paddingHorizontal: SPACING.xl,
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.lg,
        marginTop: SPACING.sm,
        ...SHADOWS.medium,
    },
    shareButtonText: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.darkBackground,
    },
    footerStats: {
        marginTop: SPACING.xl,
        alignItems: 'center',
    },
    footerText: {
        ...createTextStyle('xs', 'regular'),
        color: COLORS.gray,
    },
});

export default DailyDuelScreen;
