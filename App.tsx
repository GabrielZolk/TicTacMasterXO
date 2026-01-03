import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { I18nProvider } from './src/i18n/useI18n';
import { GameProvider } from './src/contexts/GameContext';
import AppNavigator from './src/navigation/AppNavigator';
import adMobService from './src/services/adMobService';

export default function App() {
  // Initialize AdMob on app start
  useEffect(() => {
    adMobService.initialize().catch((error) => {
      console.log('📢 AdMob initialization error:', error);
    });
  }, []);

  return (
    <I18nProvider>
      <GameProvider>
        <AppNavigator />
        <StatusBar style="light" />
      </GameProvider>
    </I18nProvider>
  );
}
