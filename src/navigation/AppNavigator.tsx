import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types/game';

// Import screens (we'll create these next)
import HomeScreen from '../screens/HomeScreen';
import OpponentScreen from '../screens/OpponentScreen';
import GameScreen from '../screens/GameScreen';
import DifficultyScreen from '../screens/DifficultyScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import ThemeScreen from '../screens/ThemeScreen';
import OnlineLobbyScreen from '../screens/OnlineLobbyScreen';
import OnlineWaitingRoomScreen from '../screens/OnlineWaitingRoomScreen';
import RemoveAdsScreen from '../screens/RemoveAdsScreen';
import StoreScreen from '../screens/StoreScreen';
import BattlePassScreen from '../screens/BattlePassScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RankedScreen from '../screens/RankedScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import TournamentScreen from '../screens/TournamentScreen';
import ReferralScreen from '../screens/ReferralScreen';
import MatchmakingScreen from '../screens/MatchmakingScreen';
import PublicLobbyScreen from '../screens/PublicLobbyScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import DailyDuelScreen from '../screens/DailyDuelScreen';

const Stack = createStackNavigator<RootStackParamList>();

// Slide from right (default)
const slideFromRight = ({ current, layouts }: any) => ({
  cardStyle: {
    transform: [
      {
        translateX: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [layouts.screen.width, 0],
        }),
      },
    ],
  },
});

// Fade + scale (for modals/overlays like Store, BattlePass, Profile)
const fadeScale = ({ current }: any) => ({
  cardStyle: {
    opacity: current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
      {
        scale: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.92, 1],
        }),
      },
    ],
  },
});

// Slide from bottom (for Game screen)
const slideFromBottom = ({ current, layouts }: any) => ({
  cardStyle: {
    transform: [
      {
        translateY: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [layouts.screen.height * 0.3, 0],
        }),
      },
    ],
    opacity: current.progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.8, 1],
    }),
  },
});

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          cardStyleInterpolator: slideFromRight,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Opponent"
          component={OpponentScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={{
            gestureDirection: 'vertical',
            cardStyleInterpolator: slideFromBottom,
          }}
        />
        <Stack.Screen
          name="Difficulty"
          component={DifficultyScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        <Stack.Screen
          name="Statistics"
          component={StatisticsScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        <Stack.Screen
          name="Theme"
          component={ThemeScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        <Stack.Screen
          name="OnlineLobby"
          component={OnlineLobbyScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        <Stack.Screen
          name="OnlineWaitingRoom"
          component={OnlineWaitingRoomScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        <Stack.Screen
          name="RemoveAds"
          component={RemoveAdsScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        <Stack.Screen
          name="Store"
          component={StoreScreen}
          options={{ gestureEnabled: false, cardStyleInterpolator: fadeScale }}
        />
        <Stack.Screen
          name="BattlePass"
          component={BattlePassScreen}
          options={{ gestureEnabled: false, cardStyleInterpolator: fadeScale }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ gestureEnabled: false, cardStyleInterpolator: fadeScale }}
        />
        <Stack.Screen
          name="Ranked"
          component={RankedScreen}
          options={{ cardStyleInterpolator: fadeScale }}
        />
        <Stack.Screen
          name="Challenges"
          component={ChallengesScreen}
          options={{ gestureDirection: 'horizontal' }}
        />
        <Stack.Screen
          name="Tournament"
          component={TournamentScreen}
          options={{ gestureDirection: 'horizontal' }}
        />
        <Stack.Screen
          name="Referral"
          component={ReferralScreen}
          options={{ cardStyleInterpolator: fadeScale }}
        />
        <Stack.Screen
          name="Matchmaking"
          component={MatchmakingScreen}
          options={{ cardStyleInterpolator: fadeScale }}
        />
        <Stack.Screen
          name="PublicLobby"
          component={PublicLobbyScreen}
          options={{ gestureDirection: 'horizontal' }}
        />
        <Stack.Screen
          name="Achievements"
          component={AchievementsScreen}
          options={{ cardStyleInterpolator: fadeScale }}
        />
        <Stack.Screen
          name="DailyDuel"
          component={DailyDuelScreen}
          options={{ cardStyleInterpolator: fadeScale }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
