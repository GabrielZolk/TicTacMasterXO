import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import SplashScreen from './src/screens/SplashScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from './src/components/ErrorBoundary';

import { I18nProvider } from './src/i18n/useI18n';
import { GameProvider } from './src/contexts/GameContext';
import AppNavigator from './src/navigation/AppNavigator';
import adMobService from './src/services/adMobService';
import iapService from './src/services/iapService';
import { battlepassService } from './src/services/battlepassService';
import { boostService } from './src/services/boostService';
import { rankedService } from './src/services/rankedService';
import { profileService } from './src/services/profileService';
import { chestService } from './src/services/chestService';
import { challengeService } from './src/services/challengeService';
import { referralService } from './src/services/referralService';
import { achievementService } from './src/services/achievementService';
import { adminConfigService } from './src/services/adminConfigService';
import { socialService } from './src/services/socialService';
import { firebaseService } from './src/services/firebaseService';
import { tournamentService } from './src/services/tournamentService';
import { dailyDuelService } from './src/services/dailyDuelService';

export default function App() {
  // Initialize services on app start
  useEffect(() => {
    adMobService.initialize().catch((error) => {
      console.log('AdMob initialization error:', error);
    });
    iapService.initialize().catch((error) => {
      console.log('IAP initialization error:', error);
    });

    // Purely local services can start immediately
    battlepassService.initialize().catch(() => {});
    boostService.initialize().catch(() => {});
    rankedService.initialize().catch(() => {});
    profileService.initialize().catch(() => {});
    chestService.initialize().catch(() => {});
    challengeService.initialize().catch(() => {});
    achievementService.initialize().catch(() => {});
    adminConfigService.initialize().catch(() => {});
    tournamentService.initialize().catch(() => {});
    dailyDuelService.initialize().catch(() => {});

    // referral and social both need auth.currentUser to exist. Started in
    // parallel with Firebase they always lost the race, so referral codes were
    // generated with a random id (making friend-add write to a path nobody
    // reads) and social bailed out early — meaning the leaderboard was never
    // populated and friend requests were never listened for.
    firebaseService
      .initialize()
      .catch((error) => {
        console.log('Firebase initialization error:', error);
      })
      .finally(() => {
        referralService.initialize().catch(() => {});
        socialService.initialize().catch(() => {});
      });

    // Periodically re-check subscription expiry (every hour)
    const subscriptionCheckInterval = setInterval(() => {
      adMobService.refreshSubscriptionState().catch(() => {});
    }, 60 * 60 * 1000);

    return () => clearInterval(subscriptionCheckInterval);
  }, []);

  const [showSplash, setShowSplash] = useState(true);

  // Failsafe: the splash unmounts itself from a reanimated completion callback
  // (runOnJS inside withTiming). When that callback is dropped — the animation
  // gets interrupted, the app is backgrounded mid-fade — the splash finishes
  // fading to opacity 0 and simply stays mounted. It fills the screen at
  // zIndex 100, so the app looks perfectly normal and swallows every tap.
  //
  // Its own sequence takes 2.6s, so 5s is far past any legitimate finish.
  useEffect(() => {
    const failsafe = setTimeout(() => setShowSplash(false), 5000);
    return () => clearTimeout(failsafe);
  }, []);

  return (
    // Outermost on purpose: a provider that throws while mounting has to land
    // somewhere, and in a release build the alternative is the process dying
    // with no message at all.
    <ErrorBoundary>
      <SafeAreaProvider>
        <I18nProvider>
          <GameProvider>
            <AppNavigator />
            <StatusBar style="light" />
            {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
          </GameProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

