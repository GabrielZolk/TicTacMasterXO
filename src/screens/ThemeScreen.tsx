import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useGame } from '../contexts/GameContext';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n/useI18n';
import { ThemeType } from '../types/game';
import AppHeader from '../components/AppHeader';
import { storeService } from '../services/storeService';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  createTextStyle,
  getThemeColors,
  THEME_INFO,
} from '../utils/theme';

const { width } = Dimensions.get('window');

interface ThemeOption {
  id: ThemeType;
  name: string;
  emoji: string;
  description: string;
  colors: ReturnType<typeof getThemeColors>;
}

const ThemeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { gameConfig, updateConfig, playSound, triggerHaptics } = useGame();
  const { theme, colors } = useTheme();
  const { t } = useI18n();
  const [ownedThemes, setOwnedThemes] = useState<string[]>(['dark', 'light']);

  // Load owned themes whenever screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadOwnedThemes();
    }, [])
  );

  const loadOwnedThemes = async () => {
    const inventory = await storeService.getInventory();
    // Extract theme IDs from owned items (remove 'theme_' prefix)
    const ownedIds = inventory.ownedItems
      .filter(id => id.startsWith('theme_'))
      .map(id => id.replace('theme_', ''));

    // Always ensure defaults are owned
    setOwnedThemes([...new Set(['dark', 'light', ...ownedIds])]);
  };

  const themeOptions: ThemeOption[] = Object.entries(THEME_INFO).map(([id, info]) => ({
    id: id as ThemeType,
    name: info.name,
    emoji: info.emoji,
    description: info.description,
    colors: getThemeColors(id as ThemeType),
  }));

  const handleGoBack = async () => {
    await triggerHaptics('light');
    await playSound('button');
    navigation.goBack();
  };

  const handleThemeSelect = async (selectedTheme: ThemeType) => {
    // Check ownership
    if (!ownedThemes.includes(selectedTheme)) {
      await triggerHaptics('heavy'); // Changed from 'error'
      Alert.alert(
        'Tema Bloqueado',
        'Você precisa desbloquear este tema na loja para usá-lo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Ir para Loja',
            onPress: () => {
              navigation.navigate('Store' as never);
            }
          }
        ]
      );
      return;
    }

    if (selectedTheme === gameConfig.theme) return;

    await triggerHaptics('medium');
    await playSound('button');
    updateConfig({ theme: selectedTheme });
  };

  return (
    <LinearGradient colors={colors.gradient as any} style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <AppHeader
          title={t('theme')}
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
            <Text style={[styles.title, { color: colors.text }]}>🎨 Escolha seu Tema</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Personalize a aparência do seu jogo
            </Text>
          </Animated.View>

          {/* Theme Grid */}
          <View style={styles.themesGrid}>
            {themeOptions.map((option, index) => {
              const isOwned = ownedThemes.includes(option.id);
              return (
                <Animated.View
                  key={option.id}
                  entering={FadeInUp.delay(300 + index * 100).duration(500)}
                  style={styles.themeWrapper}
                >
                  <TouchableOpacity
                    onPress={() => handleThemeSelect(option.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.themeCard,
                      { backgroundColor: colors.secondary },
                      gameConfig.theme === option.id && [
                        styles.selectedTheme,
                        { borderColor: colors.text }
                      ],
                      !isOwned && { opacity: 0.7 }
                    ]}
                  >
                    {/* Theme Preview */}
                    <LinearGradient
                      colors={option.colors.gradient as any}
                      style={styles.themePreview}
                    >
                      <View style={styles.previewContent}>
                        <Text style={styles.themeEmoji}>{option.emoji}</Text>

                        {!isOwned && (
                          <View style={styles.lockOverlay}>
                            <Ionicons name="lock-closed" size={24} color="#FFF" />
                          </View>
                        )}
                      </View>
                    </LinearGradient>

                    {/* Theme Info */}
                    <View style={styles.themeInfo}>
                      <Text style={[styles.themeName, { color: colors.text }]}>
                        {option.name}
                      </Text>
                      <Text style={[styles.themeDescription, { color: colors.textSecondary }]}>
                        {option.description}
                      </Text>
                    </View>

                    {/* Selection Indicator */}
                    {gameConfig.theme === option.id && (
                      <View style={[styles.selectedIndicator, { backgroundColor: colors.text }]}>
                        <Ionicons name="checkmark" size={16} color={colors.background} />
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              )
            })}
          </View>

          {/* Info Card */}
          <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.infoCard}>
            <View style={[styles.infoContent, { backgroundColor: colors.secondary }]}>
              <Ionicons name="storefront-outline" size={24} color={COLORS.gold} />
              <View style={styles.infoText}>
                <Text style={[styles.infoTitle, { color: COLORS.gold }]}>Quer mais temas?</Text>
                <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
                  Visite a loja para desbloquear novos visuais incríveis!
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Store' as never)}
                style={styles.storeButton}
              >
                <Text style={styles.storeButtonText}>Ir para Loja</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.background} />
              </TouchableOpacity>
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
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...createTextStyle('md', 'medium'),
    textAlign: 'center',
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  themeWrapper: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    marginBottom: SPACING.md,
  },
  themeCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.medium,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedTheme: {
    borderWidth: 3,
  },
  themePreview: {
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  themeEmoji: {
    fontSize: 32,
  },
  themeInfo: {
    alignItems: 'center',
  },
  themeName: {
    ...createTextStyle('md', 'bold'),
    marginBottom: 2,
    textAlign: 'center',
  },
  themeDescription: {
    ...createTextStyle('xs', 'regular'),
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedIndicator: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.light,
  },
  infoContent: {
    flexDirection: 'column', // Changed for button below
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.md,
  },
  infoText: {
    alignItems: 'center',
  },
  infoTitle: {
    ...createTextStyle('md', 'semibold'),
    marginBottom: SPACING.xs,
  },
  infoDescription: {
    ...createTextStyle('sm', 'regular'),
    lineHeight: 18,
    textAlign: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  storeButtonText: {
    ...createTextStyle('sm', 'bold'),
    color: COLORS.darkBackground, // Ensure readability
  }
});

export default ThemeScreen;
