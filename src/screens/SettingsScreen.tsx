import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useGame } from '../contexts/GameContext';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n/useI18n';
import { Language } from '../i18n/translations';
import AppHeader from '../components/AppHeader';
import { storeService } from '../services/storeService';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  createTextStyle,
  THEME_INFO,
} from '../utils/theme';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

const languageOptions: LanguageOption[] = [
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { gameConfig, updateConfig, playSound, triggerHaptics } = useGame();
  const { theme, colors } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const [debugTapCount, setDebugTapCount] = useState(0);
  const [showDebugMenu, setShowDebugMenu] = useState(false);

  const handleGoBack = async () => {
    await triggerHaptics('light');
    await playSound('button');
    navigation.goBack();
  };

  const handleToggleSetting = async (setting: 'soundEnabled' | 'hapticsEnabled', value: boolean) => {
    await triggerHaptics('light');
    updateConfig({ [setting]: value });
  };

  const handleThemePress = async () => {
    await triggerHaptics('medium');
    await playSound('button');
    navigation.navigate('Theme' as never);
  };

  const handleLanguageSelect = async (selectedLanguage: Language) => {
    await triggerHaptics('medium');
    await playSound('button');
    await setLanguage(selectedLanguage);
  };

  const handleRemoveAdsPress = async () => {
    await triggerHaptics('medium');
    await playSound('button');
    navigation.navigate('RemoveAds' as never);
  };

  // Secret Debug Menu Trigger
  const handleVersionTap = async () => {
    const newCount = debugTapCount + 1;
    setDebugTapCount(newCount);

    if (newCount === 5) {
      setShowDebugMenu(true);
      await playSound('win');
      await triggerHaptics('heavy');
      Alert.alert('🐛 Modo Desenvolvedor Ativado!', 'Menu de debug liberado no final da tela.');
    } else if (newCount > 5) {
      // Reset if tapped more
      if (newCount > 8) setDebugTapCount(0);
    }
  };

  const handleAddCurrency = async (type: 'stars' | 'diamonds', amount: number) => {
    await storeService.addCurrency(type, amount, 'Debug Cheat');
    Alert.alert('🤑 Cheat Ativado', `Adicionado ${amount} ${type}`);
    await triggerHaptics('heavy');
  };

  const handleResetStore = async () => {
    Alert.alert(
      'Resetar Loja?',
      'Isso apagará todas as compras e moedas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'RESETAR TUDO',
          style: 'destructive',
          onPress: async () => {
            await storeService.reset();
            Alert.alert('Resetado', 'Loja resetada para o estado inicial.');
          }
        }
      ]
    );
  };

  const settingsData = [
    {
      id: 'sound',
      title: t('soundEffects'),
      subtitle: t('soundDescription'),
      icon: 'volume-high-outline',
      type: 'switch' as const,
      value: gameConfig.soundEnabled,
      onToggle: (value: boolean) => handleToggleSetting('soundEnabled', value),
    },
    {
      id: 'haptics',
      title: t('hapticFeedback'),
      subtitle: t('hapticDescription'),
      icon: 'phone-portrait-outline',
      type: 'switch' as const,
      value: gameConfig.hapticsEnabled,
      onToggle: (value: boolean) => handleToggleSetting('hapticsEnabled', value),
    },
    {
      id: 'theme',
      title: t('themes'),
      subtitle: `${t('currentTheme')}: ${THEME_INFO[gameConfig.theme]?.name || 'Escuro'}`,
      icon: 'color-palette-outline',
      type: 'button' as const,
      onPress: handleThemePress,
      // Fix: Use the actual theme name instead of hardcoded 'Light'
      valueLabel: THEME_INFO[gameConfig.theme]?.emoji || '🎨',
    },
    {
      id: 'removeAds',
      title: t('removeAds'),
      subtitle: t('removeAdsSubtitle'),
      icon: 'diamond-outline',
      type: 'button' as const,
      onPress: handleRemoveAdsPress,
      valueLabel: 'PRO',
    },
  ];

  return (
    <LinearGradient colors={colors.gradient as any} style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <AppHeader
          title={t('settings')}
          showBackButton={true}
          showHomeButton={true}
          onBackPress={handleGoBack}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Settings List */}
          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>{t('preferences')}</Text>

            <View style={styles.settingsList}>
              {settingsData.map((setting, index) => (
                <Animated.View
                  key={setting.id}
                  entering={FadeInUp.delay(300 + index * 100).duration(500)}
                  style={styles.settingItem}
                >
                  <View style={styles.settingContent}>
                    <View style={styles.settingIcon}>
                      <Ionicons name={setting.icon as any} size={24} color={COLORS.gold} />
                    </View>

                    <View style={styles.settingText}>
                      <Text style={styles.settingTitle}>{setting.title}</Text>
                      <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>
                    </View>

                    <View style={styles.settingControl}>
                      {setting.type === 'switch' ? (
                        <Switch
                          value={setting.value}
                          onValueChange={setting.onToggle}
                          trackColor={{
                            false: COLORS.darkGray,
                            true: COLORS.gold + '80'
                          }}
                          thumbColor={setting.value ? COLORS.gold : COLORS.lightGray}
                        />
                      ) : (
                        <TouchableOpacity
                          onPress={setting.onPress}
                          style={styles.themeButton}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.themeButtonText}>
                            {setting.valueLabel}
                          </Text>
                          <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Language Section */}
          <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>{t('language')}</Text>
            <Text style={styles.sectionSubtitle}>{t('languageDescription')}</Text>

            <View style={styles.settingsList}>
              {languageOptions.map((option, index) => (
                <Animated.View
                  key={option.code}
                  entering={FadeInUp.delay(700 + index * 100).duration(500)}
                >
                  <TouchableOpacity
                    onPress={() => handleLanguageSelect(option.code)}
                    style={[
                      styles.languageItem,
                      language === option.code && styles.selectedLanguageItem,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.languageFlag}>{option.flag}</Text>
                    <View style={styles.languageText}>
                      <Text style={[
                        styles.languageName,
                        language === option.code && styles.selectedLanguageText,
                      ]}>
                        {option.nativeName}
                      </Text>
                      <Text style={[
                        styles.languageEnglishName,
                        language === option.code && styles.selectedLanguageSubtext,
                      ]}>
                        {option.name}
                      </Text>
                    </View>
                    {language === option.code && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* About Section */}
          <Animated.View entering={FadeInUp.delay(1000).duration(600)} style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>{t('about')}</Text>

            <View style={styles.aboutCard}>
              <Text style={styles.aboutTitle}>{t('aboutTitle')}</Text>
              <TouchableOpacity onPress={handleVersionTap} activeOpacity={0.9}>
                <Text style={styles.aboutVersion}>{t('version')}</Text>
              </TouchableOpacity>
              <Text style={styles.aboutDescription}>
                {t('aboutDescription')}
              </Text>
            </View>
          </Animated.View>

          {/* Secret Debug Menu */}
          {showDebugMenu && (
            <Animated.View entering={FadeInUp.duration(500)} style={[styles.settingsSection, { marginTop: SPACING.xl }]}>
              <Text style={[styles.sectionTitle, { color: COLORS.error }]}>🛠️ Menu Secreto (Dev)</Text>
              <View style={styles.settingsList}>
                <TouchableOpacity
                  style={[styles.settingItem, { backgroundColor: '#1a1a2e' }]}
                  onPress={() => handleAddCurrency('stars', 1000)}
                >
                  <Text style={{ color: COLORS.white }}>⭐ Adicionar 1000 Estrelas</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.settingItem, { backgroundColor: '#330000' }]}
                  onPress={handleResetStore}
                >
                  <Text style={{ color: COLORS.error }}>⚠️ Resetar Loja</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
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
  settingsSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...createTextStyle('lg', 'bold'),
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  settingsList: {
    gap: SPACING.sm,
  },
  sectionSubtitle: {
    ...createTextStyle('sm', 'regular'),
    color: COLORS.lightGray,
    marginBottom: SPACING.lg,
  },
  settingItem: {
    backgroundColor: COLORS.darkSecondary + 'CC',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.light,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gold + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    ...createTextStyle('md', 'semibold'),
    color: COLORS.white,
    marginBottom: 2,
  },
  settingSubtitle: {
    ...createTextStyle('sm', 'regular'),
    color: COLORS.gray,
  },
  settingControl: {
    marginLeft: SPACING.md,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.darkTertiary,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.sm,
  },
  themeButtonText: {
    ...createTextStyle('sm', 'medium'),
    color: COLORS.lightGray,
  },
  aboutSection: {
    marginBottom: SPACING.xl,
  },
  aboutCard: {
    backgroundColor: COLORS.darkSecondary + 'CC',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.light,
  },
  aboutTitle: {
    ...createTextStyle('lg', 'bold'),
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  aboutVersion: {
    ...createTextStyle('sm', 'medium'),
    color: COLORS.gold,
    marginBottom: SPACING.md,
  },
  aboutDescription: {
    ...createTextStyle('sm', 'regular'),
    color: COLORS.lightGray,
    lineHeight: 20,
  },
  // Language Selection Styles
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkSecondary + '80',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    ...SHADOWS.light,
  },
  selectedLanguageItem: {
    backgroundColor: COLORS.success + '20',
    borderColor: COLORS.success + '60',
  },
  languageFlag: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    ...createTextStyle('md', 'semibold'),
    color: COLORS.white,
    marginBottom: 2,
  },
  selectedLanguageText: {
    color: COLORS.success,
  },
  languageEnglishName: {
    ...createTextStyle('xs', 'regular'),
    color: COLORS.lightGray,
  },
  selectedLanguageSubtext: {
    color: COLORS.success + 'CC',
  },
});

export default SettingsScreen;
