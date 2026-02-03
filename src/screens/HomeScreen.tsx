import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
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
  const buttonScale = useSharedValue(1);

  // Filtrar modos ocultos (bigBoard e survival)
  const gameModes = getGameModes(t).filter(mode =>
    mode.id !== 'bigBoard' && mode.id !== 'survival'
  );

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
      <SafeAreaView style={styles.safeArea}>

        {/* Header with Settings, Stats and Remove Ads */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={handleSettingsPress}
              style={styles.headerButton}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                await triggerHaptics('light');
                await playSound('button');
                (navigation as any).navigate('Store');
              }}
              style={[styles.headerButton, styles.storeButton]}
              activeOpacity={0.7}
            >
              <Ionicons name="storefront-outline" size={24} color={COLORS.gold} />
            </TouchableOpacity>
          </View>

          {/* Remove Ads Button - prominently displayed */}
          <RemoveAdsButton variant="inline" />

          <TouchableOpacity
            onPress={handleStatsPress}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name="stats-chart-outline" size={24} color={COLORS.white} />
            {gameStats.totalGames > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{gameStats.totalGames}</Text>
              </View>
            )}
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
  headerLeft: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  storeButton: {
    backgroundColor: COLORS.gold + '20',
    borderWidth: 1,
    borderColor: COLORS.gold,
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
    height: 185, // Altura aumentada para acomodar o texto completo
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
