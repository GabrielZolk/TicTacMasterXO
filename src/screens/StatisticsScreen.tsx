import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,

  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';

import { useGame } from '../contexts/GameContext';
import { useI18n } from '../i18n/useI18n';
import { rankedService } from '../services/rankedService';
import { RankedProfile } from '../types/ranked';
import { useTheme } from '../hooks/useTheme';
import AppHeader from '../components/AppHeader';
import { 
  COLORS, 
  SPACING, 
  BORDER_RADIUS,
  SHADOWS,
  createTextStyle,
  getPlayerColor,
} from '../utils/theme';

const StatisticsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { playSound, triggerHaptics } = useGame();
  const { t } = useI18n();
  const { colors } = useTheme();

  /*
   * This screen used to read gameStats from GameContext, which only lives for
   * the current app run: after two wins and a restart it said "no games played"
   * while Ranked — same matches, persisted — still showed them. GameContext
   * calls rankedService.recordGame() after every match, for every mode and
   * opponent, so this is the same history without the reset.
   */
  const [ranked, setRanked] = useState<RankedProfile | null>(null);
  useEffect(() => {
    rankedService.getProfile().then(setRanked);
    return rankedService.subscribe(() => { rankedService.getProfile().then(setRanked); });
  }, []);

  const totalGames = ranked?.gamesPlayed ?? 0;
  const myWins = ranked?.wins ?? 0;
  const myLosses = ranked?.losses ?? 0;
  const myDraws = ranked?.draws ?? 0;

  const handleGoBack = async () => {
    await triggerHaptics('light');
    await playSound('button');
    navigation.goBack();
  };

  const calculateWinRate = (wins: number, totalGames: number) => {
    if (totalGames === 0) return 0;
    return Math.round((wins / totalGames) * 100);
  };

  const playerXWinRate = calculateWinRate(myWins, totalGames);
  // The opponent's record is the exact mirror of the player's — the persisted
  // profile stores one side, and a match has exactly two.
  const playerOWinRate = calculateWinRate(myLosses, totalGames);
  const drawRate = calculateWinRate(myDraws, totalGames);

  const statisticsData = [
    {
      title: t('totalGames'),
      value: totalGames.toString(),
      icon: 'game-controller-outline' as keyof typeof Ionicons.glyphMap,
      color: COLORS.gold,
    },
    {
      title: t('currentStreak'),
      value: (ranked?.winStreak ?? 0).toString(),
      icon: 'flame-outline' as keyof typeof Ionicons.glyphMap,
      color: COLORS.xColor,
    },
    {
      title: t('bestStreak'),
      value: (ranked?.bestStreak ?? 0).toString(),
      icon: 'trophy-outline' as keyof typeof Ionicons.glyphMap,
      color: COLORS.gold,
    },
  ];

  const playerStats = [
    {
      player: 'X' as const,
      wins: myWins,
      losses: myLosses,
      draws: myDraws,
      winRate: playerXWinRate,
    },
    {
      player: 'O' as const,
      wins: myLosses,
      losses: myWins,
      draws: myDraws,
      winRate: playerOWinRate,
    },
  ];

  return (
    <LinearGradient colors={[COLORS.darkBackground, COLORS.darkSecondary]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBackground} />
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <AppHeader 
          title={t('statistics')}
          showBackButton={true}
          showHomeButton={true}
          onBackPress={handleGoBack}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {totalGames === 0 ? (
            /* No Games Played Yet */
            <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="stats-chart-outline" size={64} color={COLORS.gray} />
              </View>
              <Text style={styles.emptyTitle}>{t('noGamesYet')}</Text>
              <Text style={styles.emptySubtitle}>
                {t('startPlaying')}
              </Text>
            </Animated.View>
          ) : (
            <>
              {/* Overall Statistics */}
              <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.overallSection}>
                <Text style={styles.sectionTitle}>{t('overallStats')}</Text>
                
                <View style={styles.statsGrid}>
                  {statisticsData.map((stat, index) => (
                    <Animated.View
                      key={stat.title}
                      entering={FadeInRight.delay(300 + index * 100).duration(500)}
                      style={styles.statCard}
                    >
                      <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                        <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                      </View>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statTitle}>{stat.title}</Text>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>

              {/* Player Statistics */}
              <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.playersSection}>
                <Text style={styles.sectionTitle}>{t('playerStats')}</Text>
                
                <View style={styles.playersContainer}>
                  {playerStats.map((player, index) => (
                    <Animated.View
                      key={player.player}
                      entering={FadeInUp.delay(700 + index * 150).duration(500)}
                      style={[styles.playerCard, { borderColor: getPlayerColor(player.player) }]}
                    >
                      <View style={styles.playerHeader}>
                        <View style={[styles.playerIcon, { backgroundColor: getPlayerColor(player.player) + '20' }]}>
                          <Text style={[styles.playerSymbol, { color: getPlayerColor(player.player) }]}>
                            {player.player}
                          </Text>
                        </View>
                        <Text style={styles.playerTitle}>{t('playerLabel')} {player.player}</Text>
                        <Text style={[styles.winRate, { color: getPlayerColor(player.player) }]}>
                          {player.winRate}{t('winRate')}
                        </Text>
                      </View>

                      <View style={styles.playerStats}>
                        <View style={styles.statItem}>
                          <Text style={styles.statNumber}>{player.wins}</Text>
                          <Text style={styles.statLabel}>{t('wins')}</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statNumber}>{player.losses}</Text>
                          <Text style={styles.statLabel}>{t('losses')}</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statNumber}>{player.draws}</Text>
                          <Text style={styles.statLabel}>{t('draws')}</Text>
                        </View>
                      </View>

                      {/* Win Rate Bar */}
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${player.winRate}%`,
                                backgroundColor: getPlayerColor(player.player),
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>

              {/* Game Distribution */}
              <Animated.View entering={FadeInUp.delay(1000).duration(600)} style={styles.distributionSection}>
                <Text style={styles.sectionTitle}>{t('gameDistribution')}</Text>
                
                <View style={styles.distributionCard}>
                  <View style={styles.distributionItem}>
                    <View style={styles.distributionRow}>
                      <View style={[styles.distributionDot, { backgroundColor: getPlayerColor('X') }]} />
                      <Text style={styles.distributionLabel}>{t('playerXWins')}</Text>
                      <Text style={styles.distributionValue}>{playerXWinRate}%</Text>
                    </View>
                  </View>

                  <View style={styles.distributionItem}>
                    <View style={styles.distributionRow}>
                      <View style={[styles.distributionDot, { backgroundColor: getPlayerColor('O') }]} />
                      <Text style={styles.distributionLabel}>{t('playerOWins')}</Text>
                      <Text style={styles.distributionValue}>{playerOWinRate}%</Text>
                    </View>
                  </View>

                  <View style={styles.distributionItem}>
                    <View style={styles.distributionRow}>
                      <View style={[styles.distributionDot, { backgroundColor: COLORS.gray }]} />
                      <Text style={styles.distributionLabel}>{t('draws')}</Text>
                      <Text style={styles.distributionValue}>{drawRate}%</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            </>
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyIcon: {
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    ...createTextStyle('xl', 'bold'),
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...createTextStyle('md', 'regular'),
    color: COLORS.gray,
    textAlign: 'center',
  },
  overallSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...createTextStyle('lg', 'bold'),
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.darkSecondary + 'CC',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.light,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    ...createTextStyle('xxl', 'bold'),
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  statTitle: {
    ...createTextStyle('sm', 'medium'),
    color: COLORS.gray,
    textAlign: 'center',
  },
  playersSection: {
    marginBottom: SPACING.xl,
  },
  playersContainer: {
    gap: SPACING.md,
  },
  playerCard: {
    backgroundColor: COLORS.darkSecondary + 'CC',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    padding: SPACING.lg,
    ...SHADOWS.light,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  playerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  playerSymbol: {
    ...createTextStyle('lg', 'bold'),
  },
  playerTitle: {
    ...createTextStyle('lg', 'semibold'),
    color: COLORS.white,
    flex: 1,
  },
  winRate: {
    ...createTextStyle('sm', 'bold'),
  },
  playerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...createTextStyle('xl', 'bold'),
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...createTextStyle('sm', 'medium'),
    color: COLORS.gray,
  },
  progressContainer: {
    marginTop: SPACING.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.darkGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  distributionSection: {
    marginBottom: SPACING.xl,
  },
  distributionCard: {
    backgroundColor: COLORS.darkSecondary + 'CC',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.light,
  },
  distributionItem: {
    marginBottom: SPACING.md,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distributionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.md,
  },
  distributionLabel: {
    ...createTextStyle('md', 'medium'),
    color: COLORS.lightGray,
    flex: 1,
  },
  distributionValue: {
    ...createTextStyle('md', 'bold'),
    color: COLORS.white,
  },
});

export default StatisticsScreen;
