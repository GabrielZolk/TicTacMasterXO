import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

import { RootStackParamList, GameMode } from '../types/game';
import { useGame } from '../contexts/GameContext';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n/useI18n';
import GameLogo from '../components/GameLogo';
import CustomButton from '../components/CustomButton';
import RemoveAdsButton from '../components/RemoveAdsButton';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  createTextStyle,
  DIMENSIONS,
} from '../utils/theme';
import AdBanner from '../components/AdBanner';
import { chestService } from '../services/chestService';
import { dailyDuelService } from '../services/dailyDuelService';
import { storeService } from '../services/storeService';
import FortuneWheel from '../components/FortuneWheel';
import ChestModal from '../components/ChestModal';
import XPBar from '../components/XPBar';
import adMobService from '../services/adMobService';
import { ChestRarity } from '../types/chest';
import { SHOW_TOURNAMENT } from '../config/features';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface GameModeOption {
  id: GameMode;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description: string;
}

const getGameModes = (t: any): GameModeOption[] => [
  {
    id: 'classic',
    title: t('classic.title'),
    subtitle: t('classic.subtitle'),
    icon: 'grid-outline',
    color: COLORS.gold,
    description: t('classic.description'),
  },
  {
    id: 'infinity',
    title: t('infinity.title'),
    subtitle: t('infinity.subtitle'),
    icon: 'infinite-outline',
    color: COLORS.info,
    description: t('infinity.description'),
  },
  {
    id: 'gravity',
    title: `${t('gravity.title')} 🪐`,
    subtitle: t('gravity.subtitle'),
    icon: 'arrow-down-outline',
    color: COLORS.xColor,
    description: t('gravity.description'),
  },
  {
    id: 'blind',
    title: `${t('blind.title')} 🙈`,
    subtitle: t('blind.subtitle'),
    icon: 'eye-off-outline',
    color: COLORS.darkGray,
    description: t('blind.description'),
  },
  {
    id: 'blitz',
    title: `${t('blitz.title')} ⚡`,
    subtitle: t('blitz.subtitle'),
    icon: 'timer-outline',
    color: COLORS.warning,
    description: t('blitz.description'),
  },
  {
    id: 'reverse',
    title: `${t('reverse.title')} 🔄`,
    subtitle: t('reverse.subtitle'),
    icon: 'swap-horizontal-outline',
    color: COLORS.oColor,
    description: t('reverse.description'),
  },
  {
    id: 'bomb',
    title: `${t('bomb.title')} 💣`,
    subtitle: t('bomb.subtitle'),
    icon: 'flame-outline',
    color: COLORS.error,
    description: t('bomb.description'),
  },
  {
    id: 'mirror',
    title: `${t('mirror.title')} 🪞`,
    subtitle: t('mirror.subtitle'),
    icon: 'copy-outline',
    color: COLORS.info,
    description: t('mirror.description'),
  },
  {
    id: 'mad',
    title: `${t('mad.title')} 🎲`,
    subtitle: t('mad.subtitle'),
    icon: 'shuffle-outline',
    color: COLORS.warning,
    description: t('mad.description'),
  },
  {
    id: 'gobble',
    title: `${t('gobble.title')} 🍽️`,
    subtitle: t('gobble.subtitle'),
    icon: 'ellipse-outline',
    color: COLORS.gold,
    description: t('gobble.description'),
  },
  {
    id: 'bigBoard',
    title: `${t('bigBoard.title')} 🏟️`,
    subtitle: t('bigBoard.subtitle'),
    icon: 'expand-outline',
    color: COLORS.success,
    description: t('bigBoard.description'),
  },
  {
    id: 'survival',
    title: `${t('survival.title')} ❤️`,
    subtitle: t('survival.subtitle'),
    icon: 'heart-outline',
    color: COLORS.error,
    description: t('survival.description'),
  },
];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { setGameMode, playSound, triggerHaptics, gameStats } = useGame();
  const { theme, colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const buttonScale = useSharedValue(1);
  const [pendingChests, setPendingChests] = useState(0);
  const [loginStreak, setLoginStreak] = useState(0);
  const [showFortuneWheel, setShowFortuneWheel] = useState(false);
  const [canSpinWheel, setCanSpinWheel] = useState(false);
  const [showChestModal, setShowChestModal] = useState(false);
  const [currentChestRarity, setCurrentChestRarity] = useState<ChestRarity | null>(null);
  const [duelSolved, setDuelSolved] = useState(false);
  const [duelStreak, setDuelStreak] = useState(0);

  const handleOpenChestFromHome = async () => {
    const pending = chestService.getPendingChests();
    if (pending.length === 0) return;
    await triggerHaptics('medium');
    await playSound('button');
    setCurrentChestRarity(pending[0]);
    setShowChestModal(true);
  };

  // Load pending chests + login streak + check daily reward on mount
  useEffect(() => {
    const loadChests = () => setPendingChests(chestService.getPendingChests().length);
    loadChests();
    const unsub = chestService.subscribe(loadChests);

    // Load streak
    storeService.initialize().then(async (data) => {
      setLoginStreak(data.consecutiveDays || 0);
      const canClaim = await storeService.canClaimDailyReward();
      setCanSpinWheel(canClaim);
    }).catch(() => {});

    // Daily Duel status for the banner
    const refreshDuel = () => {
      const s = dailyDuelService.getState();
      setDuelSolved(s.solved);
      setDuelStreak(s.streak);
    };
    dailyDuelService.initialize().then(refreshDuel).catch(() => {});
    const unsubDuel = dailyDuelService.subscribe(refreshDuel);

    return () => {
      unsub();
      unsubDuel();
    };
  }, []);

  // Refresh the duel banner whenever the player returns to Home
  useFocusEffect(
    useCallback(() => {
      const s = dailyDuelService.getState();
      setDuelSolved(s.solved);
      setDuelStreak(s.streak);
    }, [])
  );

  // Pulse animation when totalGames changes
  const badgeScale = useSharedValue(1);
  const prevTotalGames = useRef(gameStats.totalGames);

  useEffect(() => {
    if (gameStats.totalGames > prevTotalGames.current) {
      badgeScale.value = withSequence(
        withTiming(1.4, { duration: 150 }),
        withSpring(1, { damping: 8 })
      );
    }
    prevTotalGames.current = gameStats.totalGames;
  }, [gameStats.totalGames]);

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const gameModes = getGameModes(t);

  const handleGameModePress = async (mode: GameMode) => {
    await triggerHaptics('medium');
    await playSound('button');

    // Navigate to opponent selection screen
    navigation.navigate('Opponent', { mode });
  };

  const handleSettingsPress = async () => {
    await triggerHaptics('light');
    await playSound('button');
    navigation.navigate('Settings');
  };

  const handleStatsPress = async () => {
    await triggerHaptics('light');
    await playSound('button');
    navigation.navigate('Statistics');
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleButtonPressIn = () => {
    buttonScale.value = withTiming(0.95, { duration: 100 });
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  return (
    <LinearGradient colors={(colors.gradient?.length >= 2 ? colors.gradient : ['#0A0A0A', '#1A1A2E']) as unknown as readonly [string, string, ...string[]]} style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[styles.safeArea, { paddingTop: insets.top + 4, paddingLeft: insets.left, paddingRight: insets.right }]}>

        {/* Top bar: Settings / Remove Ads / Profile + Stats */}
        {/* Shortcut row below: Store / Battle Pass / Challenges */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleSettingsPress}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>

          <RemoveAdsButton variant="inline" />

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={async () => {
                await triggerHaptics('light');
                await playSound('button');
                (navigation as any).navigate('Profile');
              }}
              style={[styles.headerButton, styles.profileButton]}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={22} color={COLORS.info} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleStatsPress}
              style={styles.headerButton}
              activeOpacity={0.7}
            >
              <Ionicons name="stats-chart-outline" size={22} color={COLORS.white} />
              {gameStats.totalGames > 0 && (
                <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
                  <Text style={styles.badgeText}>{gameStats.totalGames}</Text>
                </Animated.View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Player XP / Level — persistent, taps to BattlePass */}
        <View style={styles.xpBarWrapper}>
          <XPBar />
        </View>

        {/* Shortcut row: Store / BattlePass / Challenges */}
        <View style={styles.shortcutRow}>
          <TouchableOpacity
            onPress={async () => {
              await triggerHaptics('light');
              await playSound('button');
              (navigation as any).navigate('Store');
            }}
            style={[styles.shortcutButton, { borderColor: COLORS.gold }]}
            activeOpacity={0.7}
          >
            <Ionicons name="storefront-outline" size={18} color={COLORS.gold} />
            <Text style={[styles.shortcutText, { color: COLORS.gold }]}>{t('store')}</Text>
            {pendingChests > 0 && (
              <View style={styles.chestBadge}>
                <Text style={styles.chestBadgeText}>{pendingChests}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              await triggerHaptics('light');
              await playSound('button');
              (navigation as any).navigate('BattlePass');
            }}
            style={[styles.shortcutButton, { borderColor: COLORS.xColor }]}
            activeOpacity={0.7}
          >
            <Ionicons name="ribbon-outline" size={18} color={COLORS.xColor} />
            <Text style={[styles.shortcutText, { color: COLORS.xColor }]}>{t('battlePass')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              await triggerHaptics('light');
              await playSound('button');
              (navigation as any).navigate('Challenges');
            }}
            style={[styles.shortcutButton, { borderColor: COLORS.success }]}
            activeOpacity={0.7}
          >
            <Ionicons name="flag-outline" size={18} color={COLORS.success} />
            <Text style={[styles.shortcutText, { color: COLORS.success }]}>{t('challenges')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <Animated.View entering={FadeInUp.delay(300).duration(800)} style={styles.logoSection}>
            <GameLogo size="large" animated={true} />
          </Animated.View>

          {/* Login Streak + Fortune Wheel button */}
          <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.streakContainer}>
            {loginStreak > 0 && (
              <>
                <Text style={styles.streakFire}>
                  {loginStreak >= 7 ? '🔥🔥🔥' : loginStreak >= 3 ? '🔥🔥' : '🔥'}
                </Text>
                <Text style={styles.streakText}>{loginStreak} {loginStreak === 1 ? t('dayInARow') : t('daysInARow')}</Text>
              </>
            )}
            {canSpinWheel && (
              <TouchableOpacity
                style={styles.wheelButton}
                onPress={async () => {
                  await triggerHaptics('medium');
                  await playSound('button');
                  setShowFortuneWheel(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.wheelButtonText}>{t('spinWheel')}</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Chests Banner — visible when there are pending chests */}
          {pendingChests > 0 && (
            <Animated.View entering={FadeInUp.delay(400).duration(500)}>
              <TouchableOpacity
                style={styles.chestBanner}
                onPress={handleOpenChestFromHome}
                activeOpacity={0.85}
              >
                <Text style={styles.chestBannerIcon}>📦</Text>
                <View style={styles.chestBannerInfo}>
                  <Text style={styles.chestBannerTitle}>
                    {t('chestBannerTitle').replace('{count}', String(pendingChests)).replace('{noun}', pendingChests === 1 ? t('chestSingular') : t('chestPlural'))}
                  </Text>
                  <Text style={styles.chestBannerDesc}>{t('chestBannerDesc')}</Text>
                </View>
                <View style={styles.chestBannerBadge}>
                  <Text style={styles.chestBannerBadgeText}>{t('openChest')}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Daily Duel Banner — the shared puzzle of the day */}
          <Animated.View entering={FadeInUp.delay(430).duration(600)}>
            <TouchableOpacity
              onPress={async () => {
                await triggerHaptics('medium');
                await playSound('button');
                (navigation as any).navigate('DailyDuel');
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={duelSolved ? ['#1B5E20', '#2E7D32'] : ['#4A148C', '#7B1FA2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.duelBanner}
              >
                <Text style={styles.duelIcon}>{duelSolved ? '✅' : '⚔️'}</Text>
                <View style={styles.duelInfo}>
                  <Text style={styles.duelTitle}>{t('dailyDuel')}</Text>
                  <Text style={styles.duelDesc}>
                    {duelSolved ? t('duelDoneToday') : t('duelCallToAction')}
                  </Text>
                </View>
                {duelStreak > 0 && (
                  <View style={styles.duelStreakPill}>
                    <Text style={styles.duelStreakText}>🔥 {duelStreak}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Tournament Banner — temporarily hidden (SHOW_TOURNAMENT) */}
          {SHOW_TOURNAMENT && (
          <Animated.View entering={FadeInUp.delay(450).duration(600)}>
            <TouchableOpacity
              style={styles.tournamentBanner}
              onPress={async () => {
                await triggerHaptics('medium');
                await playSound('button');
                (navigation as any).navigate('Tournament');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.tournamentIcon}>🏆</Text>
              <View style={styles.tournamentInfo}>
                <Text style={styles.tournamentTitle}>{t('tournament')}</Text>
                <Text style={styles.tournamentDesc}>{t('tournamentDesc')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gold} />
            </TouchableOpacity>
          </Animated.View>
          )}

          {/* Game Modes Section */}
          <Animated.View entering={FadeInDown.delay(500).duration(800)} style={styles.gameModesSection}>
            <Text style={styles.sectionTitle}>{t('chooseGameMode')}</Text>

            <View style={styles.gameModesGrid}>
              {gameModes.map((mode, index) => (
                <Animated.View
                  key={mode.id}
                  entering={FadeInUp.delay(700 + index * 50).duration(400)}
                  style={styles.gameModeGridItem}
                >
                  <TouchableOpacity
                    onPress={() => handleGameModePress(mode.id)}
                    onPressIn={handleButtonPressIn}
                    onPressOut={handleButtonPressOut}
                    activeOpacity={0.9}
                    style={[styles.gameModeCard, { borderColor: mode.color }]}
                  >
                    <Animated.View style={[styles.gameModeCardContent, animatedButtonStyle]}>
                      <View style={[styles.cardIconContainer, { backgroundColor: mode.color + '20' }]}>
                        <Ionicons name={mode.icon} size={24} color={mode.color} />
                      </View>

                      <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>{mode.title}</Text>
                        <Text style={styles.cardSubtitle}>{mode.subtitle}</Text>
                        <Text style={styles.cardDescription}>
                          {mode.description}
                        </Text>
                      </View>
                    </Animated.View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeInUp.delay(1200).duration(600)} style={styles.footer}>
          </Animated.View>
        </ScrollView>

        {/* Ad Banner at bottom */}
        <AdBanner size="BANNER" style={styles.adBanner} />

        {/* Fortune Wheel — daily reward */}
        <FortuneWheel
          visible={showFortuneWheel}
          onResult={async (value) => {
            // The wheel prize is only paid together with a VALID daily claim.
            // Previously it was granted unconditionally, so a refused claim
            // (already claimed today, clock tampering) still paid out the wheel.
            const claim = await storeService.claimDailyReward();
            if (claim.success) {
              await storeService.addCurrency('stars', value, `Roda da Fortuna: ${value} estrelas`);
              playSound('win');
              triggerHaptics('heavy');
            }
            // Reload streak
            const data = await storeService.initialize();
            setLoginStreak(data.consecutiveDays || 0);
          }}
          onClose={() => {
            setShowFortuneWheel(false);
            setCanSpinWheel(false);
          }}
        />

        {/* Chest Modal — opens from chest banner */}
        <ChestModal
          visible={showChestModal}
          chestRarity={currentChestRarity}
          onOpen={async () => {
            return await chestService.openChest();
          }}
          onOpenWithAd={async () => {
            const reward = await adMobService.showRewarded();
            if (reward) {
              return await chestService.openChest();
            }
            Alert.alert(t('adTitle'), t('adIncompleteBody'));
            return null;
          }}
          onClose={() => {
            setShowChestModal(false);
            setCurrentChestRarity(null);
            // Refresh count — if more chests pending, banner remains
            setPendingChests(chestService.getPendingChests().length);
          }}
        />
      </View>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.darkSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
    position: 'relative',
  },
  headerRight: {
    flexDirection: 'row',
    gap: SPACING.xs,
    alignItems: 'center',
  },
  xpBarWrapper: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xs,
  },
  shortcutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  shortcutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkSecondary + 'CC',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 4,
    ...SHADOWS.light,
    position: 'relative',
  },
  shortcutText: {
    ...createTextStyle('xs', 'bold'),
  },
  profileButton: {
    backgroundColor: COLORS.info + '20',
    borderWidth: 1,
    borderColor: COLORS.info,
  },
  chestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.warning + '60',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
    ...SHADOWS.light,
  },
  chestBannerIcon: {
    fontSize: 36,
  },
  chestBannerInfo: {
    flex: 1,
  },
  chestBannerTitle: {
    ...createTextStyle('md', 'bold'),
    color: COLORS.warning,
  },
  chestBannerDesc: {
    ...createTextStyle('xs', 'regular'),
    color: COLORS.lightGray,
  },
  chestBannerBadge: {
    backgroundColor: COLORS.warning,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  chestBannerBadgeText: {
    ...createTextStyle('sm', 'bold'),
    color: COLORS.darkBackground,
  },
  duelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.medium,
  },
  duelIcon: {
    fontSize: 30,
  },
  duelInfo: {
    flex: 1,
  },
  duelTitle: {
    ...createTextStyle('md', 'bold'),
    color: COLORS.white,
  },
  duelDesc: {
    ...createTextStyle('xs', 'regular'),
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  duelStreakPill: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  duelStreakText: {
    ...createTextStyle('xs', 'bold'),
    color: COLORS.white,
  },
  tournamentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold + '15',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.light,
  },
  tournamentIcon: {
    fontSize: 32,
  },
  tournamentInfo: {
    flex: 1,
  },
  tournamentTitle: {
    ...createTextStyle('md', 'bold'),
    color: COLORS.gold,
  },
  tournamentDesc: {
    ...createTextStyle('xs', 'regular'),
    color: COLORS.lightGray,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  streakFire: {
    fontSize: 16,
  },
  streakText: {
    ...createTextStyle('sm', 'bold'),
    color: COLORS.warning,
  },
  wheelButton: {
    backgroundColor: COLORS.gold + '20',
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  wheelButtonText: {
    ...createTextStyle('sm', 'bold'),
    color: COLORS.gold,
  },
  chestBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.warning,
    borderRadius: 10,
    minWidth: 24,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  chestBadgeText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.xColor,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...createTextStyle('xs', 'bold'),
    color: COLORS.white,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    minHeight: 200,
  },
  gameModesSection: {
    paddingBottom: SPACING.lg,
  },
  sectionTitle: {
    ...createTextStyle('xl', 'bold'),
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  gameModesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  gameModeGridItem: {
    width: '48%',
    marginBottom: SPACING.sm,
  },
  gameModeCard: {
    backgroundColor: COLORS.darkSecondary + 'CC',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    padding: SPACING.md,
    ...SHADOWS.medium,
    // A fixed height here clipped the five longest descriptions (Blitz, Bomba,
    // Espelho, Velha Maluca, Comilão) mid-letter on a 390px screen. `minHeight`
    // keeps the short cards looking the same as before; `flex: 1` makes both
    // cards in a row take the height of the taller one, so the grid stays even.
    flex: 1,
    minHeight: 185,
  },
  gameModeCardContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  cardTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 4,
  },
  cardTitle: {
    ...createTextStyle('md', 'bold'),
    color: COLORS.white,
    marginBottom: 2,
    textAlign: 'center',
  },
  cardSubtitle: {
    ...createTextStyle('xs', 'medium'),
    color: COLORS.lightGray,
    marginBottom: 6,
    textAlign: 'center',
  },
  cardDescription: {
    ...createTextStyle('xs', 'regular'),
    color: COLORS.gray,
    lineHeight: 16,
    textAlign: 'center',
    flexShrink: 1,
  },
  footer: {
    paddingBottom: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    ...createTextStyle('sm', 'medium'),
    color: COLORS.gray,
    textAlign: 'center',
  },
  adBanner: {
    paddingVertical: SPACING.sm,
    backgroundColor: 'transparent',
  },
});

export default HomeScreen;
