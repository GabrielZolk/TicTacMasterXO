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

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
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
            };
          },
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
            gestureDirection: 'horizontal',
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
          options={{
            gestureDirection: 'horizontal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
