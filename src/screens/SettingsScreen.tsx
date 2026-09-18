import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,

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
import { REFERRAL_REWARD } from '../services/referralService';
import { Language } from '../i18n/translations';
import AppHeader from '../components/AppHeader';
import { storeService } from '../services/storeService';
// Read the version from the manifest instead of typing it into the translation
// strings — those said "1.0.0" for every language while the store had 2.6.0.
import appConfig from '../../app.json';
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
  const { t, tc, language, setLanguage } = useI18n();
  // A ref, not state: the counter is only ever read inside the tap handler, and
  // reading it from state meant taps landing in the same React batch all saw the
  // same stale value, so it never reached 5.
  const debugTapCount = useRef(0);
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

  // Secret Debug Menu Trigger — DEVELOPMENT BUILDS ONLY.
  // In production this granted 1000 free stars to anyone who tapped the version
  // label 5 times, which makes the paid star packs worthless.
  const handleVersionTap = async () => {
    if (!__DEV__) return;

    debugTapCount.current = debugTapCount.current >= 8 ? 1 : debugTapCount.current + 1;

    if (debugTapCount.current === 5) {
      setShowDebugMenu(true);
      await playSound('win');
      await triggerHaptics('heavy');
      Alert.alert('🐛 Modo Desenvolvedor Ativado!', 'Menu de debug liberado no final da tela.');
    }
  };

  const handleAddCurrency = async (type: 'stars', amount: number) => {
    await storeService.addCurrency(type, amount, 'Debug Cheat');
    Alert.alert('🤑 Cheat Ativado', `Adicionado ${amount} ${type}`);
    await triggerHaptics('heavy');
  };

  const handleResetStore = async () => {
    Alert.alert(
      t('resetStoreTitle'),
      t('resetStoreBody'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('resetAll'),
          style: 'destructive',
          onPress: async () => {
            await storeService.reset();
            Alert.alert(t('resetDoneTitle'), t('resetDoneBody'));
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
      // O nome do tema vinha cru de THEME_INFO, só em português: quem jogava em
      // inglês lia "Current theme: Escuro". A tela de Temas já traduz pela chave
      // item.theme_<id>.name — agora as duas leem da mesma fonte.
      subtitle: `${t('currentTheme')}: ${tc(`item.theme_${gameConfig.theme}.name`, THEME_INFO[gameConfig.theme]?.name || 'Escuro')}`,
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
    {
      id: 'referral',
      title: t('inviteFriendsTitle'),
      subtitle: t('referralSubtitle').replace('{stars}', String(REFERRAL_REWARD)),
      icon: 'gift-outline',
      type: 'button' as const,
      onPress: () => {
        triggerHaptics('light');
        playSound('button');
        navigation.navigate('Referral' as never);
      },
      valueLabel: '🎁',
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
                  {/*
                    * Only the chip on the right used to be touchable: a 79x38 target
                    * on a 294-wide row, below the 48dp minimum — while the language
                    * rows right below this section are tappable across their full
                    * 342x88. Rows that navigate now take the tap anywhere; switch
                    * rows stay a plain View so the row does not fight the Switch.
                    */}
                  {setting.type === 'switch' ? (
                    <View style={styles.settingContent}>
                      <View style={styles.settingIcon}>
                        <Ionicons name={setting.icon as any} size={24} color={COLORS.gold} />
                      </View>

                      <View style={styles.settingText}>
                        <Text style={styles.settingTitle}>{setting.title}</Text>
                        <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>
                      </View>

                      <View style={styles.settingControl}>
                        <Switch
                          value={setting.value}
                          onValueChange={setting.onToggle}
                          trackColor={{
                            false: COLORS.darkGray,
                            true: COLORS.gold + '80'
                          }}
                          thumbColor={setting.value ? COLORS.gold : COLORS.lightGray}
                        />
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={setting.onPress}
                      style={styles.settingContent}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                    >
                      <View style={styles.settingIcon}>
                        <Ionicons name={setting.icon as any} size={24} color={COLORS.gold} />
                      </View>

                      <View style={styles.settingText}>
                        <Text style={styles.settingTitle}>{setting.title}</Text>
                        <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>
                      </View>

                      <View style={styles.settingControl}>
                        <View style={styles.themeButton}>
                          <Text style={styles.themeButtonText}>
                            {setting.valueLabel}
                          </Text>
                          <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
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
                <Text style={styles.aboutVersion}>
                  {t('version').replace('{version}', appConfig.expo.version)}
                </Text>
              </TouchableOpacity>
              <Text style={styles.aboutDescription}>
                {t('aboutDescription')}
              </Text>
            </View>
          </Animated.View>

          {/* Secret Debug Menu — never rendered in production builds */}
          {__DEV__ && showDebugMenu && (
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
    // The rows are the touch target now, and their height came from whatever the
    // subtitle happened to wrap to — the Themes row landed at 42px, under the
    // 48dp Android minimum, while the row below it was 83px.
    minHeight: 48,
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
