import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { RootStackParamList, GameMode, OpponentType } from '../types/game';
import { useGame } from '../contexts/GameContext';
import { useI18n } from '../i18n/useI18n';
import AppHeader from '../components/AppHeader';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  createTextStyle,
} from '../utils/theme';

type OpponentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Opponent'>;
type OpponentScreenRouteProp = RouteProp<RootStackParamList, 'Opponent'>;

interface OpponentOption {
  id: OpponentType;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  emoji: string;
}

const OpponentScreen: React.FC = () => {
  const navigation = useNavigation<OpponentScreenNavigationProp>();
  const route = useRoute<OpponentScreenRouteProp>();
  const { mode } = route.params;
  const { playSound, triggerHaptics, resetStats } = useGame();
  const { t } = useI18n();

  const opponentOptions: OpponentOption[] = [
    {
      id: 'ai',
      title: t('vsAI.title'),
      subtitle: t('vsAI.subtitle'),
      description: t('vsAI.description'),
      icon: 'hardware-chip-outline',
      color: COLORS.xColor,
      emoji: '🤖',
    },
    {
      id: 'human',
      title: t('twoPlayers.title'),
      subtitle: t('twoPlayers.subtitle'),
      description: t('twoPlayers.description'),
      icon: 'people-outline',
      color: COLORS.oColor,
      emoji: '👥',
    },
    {
      id: 'online',
      title: 'Online',
      subtitle: 'Jogue via internet',
      description: 'Convide um amigo e jogue de qualquer lugar',
      icon: 'globe-outline',
      color: COLORS.success,
      emoji: '🌍',
    },
  ];

  const handleGoBack = async () => {
    await triggerHaptics('light');
    await playSound('button');
    navigation.goBack();
  };

  const handleOpponentSelect = async (opponent: OpponentType) => {
    await triggerHaptics('medium');
    await playSound('button');

    // Reset score when changing opponent
    await resetStats();

    if (opponent === 'ai') {
      // Navigate to difficulty selection screen
      navigation.navigate('Difficulty', { mode });
    } else if (opponent === 'online') {
      // Navigate to online lobby
      navigation.navigate('OnlineLobby' as any, { mode });
    } else {
      // Navigate directly to game
      navigation.navigate('Game', { mode, opponent });
    }
  };

  const getModeTitle = (mode: GameMode): string => {
    return t(`${mode}.title` as any);
  };

  return (
    <LinearGradient colors={COLORS.primaryGradient as any} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBackground} />
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <AppHeader
          title={t('chooseOpponent')}
          showBackButton={true}
          showHomeButton={true}
          onBackPress={handleGoBack}
        />

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.titleSection}>
            <Text style={styles.title}>{getModeTitle(mode)}</Text>
            <Text style={styles.subtitle}>{t('whoToPlayAgainst')}</Text>
          </Animated.View>

          {/* Opponent Options */}
          <View style={styles.optionsContainer}>
            {opponentOptions.map((option, index) => (
              <Animated.View
                key={option.id}
                entering={FadeInUp.delay(300 + index * 100).duration(500)}
                style={styles.optionWrapper}
              >
                <TouchableOpacity
                  onPress={() => handleOpponentSelect(option.id)}
                  activeOpacity={0.8}
                  style={[styles.optionButton, { borderColor: option.color }]}
                >
                  <View style={styles.optionContent}>
                    <View style={[styles.optionIcon, { backgroundColor: option.color + '20' }]}>
                      <Text style={styles.emoji}>{option.emoji}</Text>
                      <Ionicons name={option.icon} size={24} color={option.color} />
                    </View>

                    <View style={styles.optionText}>
                      <Text style={[styles.optionTitle, { color: option.color }]}>
                        {option.title}
                      </Text>
                      <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    </View>

                    <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Info Card */}
          <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.infoCard}>
            <View style={styles.infoContent}>
              <Ionicons name="information-circle-outline" size={24} color={COLORS.gold} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>{t('tip')}</Text>
                <Text style={styles.infoDescription}>
                  {mode === 'infinity' ? t('infinityTip') : t('classicTip')}
                </Text>
              </View>
            </View>
          </Animated.View>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  title: {
    ...createTextStyle('xxxl', 'extrabold'),
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...createTextStyle('md', 'medium'),
    color: COLORS.lightGray,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  optionWrapper: {
    marginBottom: SPACING.sm,
  },
  optionButton: {
    backgroundColor: COLORS.darkSecondary + 'CC',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 70,
    height: 70,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    position: 'relative',
  },
  emoji: {
    fontSize: 20,
    position: 'absolute',
    top: -5,
    right: -5,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    ...createTextStyle('lg', 'bold'),
    marginBottom: 2,
  },
  optionSubtitle: {
    ...createTextStyle('sm', 'medium'),
    color: COLORS.lightGray,
    marginBottom: 4,
  },
  optionDescription: {
    ...createTextStyle('xs', 'regular'),
    color: COLORS.gray,
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: COLORS.darkSecondary + '80',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
    ...SHADOWS.light,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  infoTitle: {
    ...createTextStyle('md', 'semibold'),
    color: COLORS.gold,
    marginBottom: SPACING.xs,
  },
  infoDescription: {
    ...createTextStyle('sm', 'regular'),
    color: COLORS.lightGray,
    lineHeight: 18,
  },
});

export default OpponentScreen;
