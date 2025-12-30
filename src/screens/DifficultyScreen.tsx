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

import { RootStackParamList, Difficulty, GameMode } from '../types/game';
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

type DifficultyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Difficulty'>;
type DifficultyScreenRouteProp = RouteProp<RootStackParamList, 'Difficulty'>;

interface DifficultyOption {
  id: Difficulty;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  emoji: string;
}

const getDifficultyOptions = (t: any): DifficultyOption[] => [
  {
    id: 'noob',
    title: t('difficulties.noob.title'),
    subtitle: t('difficulties.noob.subtitle'),
    description: t('difficulties.noob.description'),
    icon: 'flower-outline',
    color: COLORS.success,
    emoji: '🌱',
  },
  {
    id: 'mediano',
    title: t('difficulties.mediano.title'),
    subtitle: t('difficulties.mediano.subtitle'),
    description: t('difficulties.mediano.description'),
    icon: 'shield-outline',
    color: COLORS.info,
    emoji: '⚖️',
  },
  {
    id: 'expert',
    title: t('difficulties.expert.title'),
    subtitle: t('difficulties.expert.subtitle'),
    description: t('difficulties.expert.description'),
    icon: 'trophy-outline',
    color: COLORS.warning,
    emoji: '🏆',
  },
  {
    id: 'challenger',
    title: t('difficulties.challenger.title'),
    subtitle: t('difficulties.challenger.subtitle'),
    description: t('difficulties.challenger.description'),
    icon: 'flame-outline',
    color: COLORS.error,
    emoji: '🔥',
  },
  {
    id: 'troll',
    title: t('difficulties.troll.title'),
    subtitle: t('difficulties.troll.subtitle'),
    description: t('difficulties.troll.description'),
    icon: 'chatbubble-ellipses-outline',
    color: COLORS.xColor,
    emoji: '😈',
  },
];

const DifficultyScreen: React.FC = () => {
  const navigation = useNavigation<DifficultyScreenNavigationProp>();
  const route = useRoute<DifficultyScreenRouteProp>();
  const { playSound, triggerHaptics, setDifficulty } = useGame();
  const { t } = useI18n();

  const difficultyOptions = getDifficultyOptions(t);

  const handleGoBack = async () => {
    await triggerHaptics('light');
    await playSound('button');
    navigation.goBack();
  };

  const handleDifficultySelect = async (difficulty: Difficulty) => {
    await triggerHaptics('medium');
    await playSound('button');
    
    setDifficulty(difficulty);
    navigation.navigate('Game', { mode: route.params.mode, opponent: 'ai', difficulty });
  };

  return (
    <LinearGradient colors={COLORS.primaryGradient} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBackground} />
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <AppHeader 
          title={t('chooseDifficulty')}
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
            <Text style={styles.title}>🤖 {t('vsAI.title')}</Text>
            <Text style={styles.subtitle}>{t('whatChallenge')}</Text>
          </Animated.View>

          {/* Difficulty Options */}
          <View style={styles.optionsContainer}>
            {difficultyOptions.map((option, index) => (
              <Animated.View
                key={option.id}
                entering={FadeInUp.delay(300 + index * 100).duration(500)}
                style={styles.optionWrapper}
              >
                <TouchableOpacity
                  onPress={() => handleDifficultySelect(option.id)}
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
          <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.infoCard}>
            <View style={styles.infoContent}>
              <Ionicons name="information-circle-outline" size={24} color={COLORS.gold} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>{t('tip')}</Text>
                <Text style={styles.infoDescription}>
                  {t('difficultyTip')}
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
  highlight: {
    color: COLORS.xColor,
    fontWeight: '600',
  },
});

export default DifficultyScreen;
