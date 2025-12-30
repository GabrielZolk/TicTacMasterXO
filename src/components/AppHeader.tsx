import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/game';
import { useGame } from '../contexts/GameContext';
import { 
  COLORS, 
  SPACING, 
  SHADOWS,
  createTextStyle,
} from '../utils/theme';

type AppHeaderNavigationProp = StackNavigationProp<RootStackParamList>;

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBackButton = false,
  showHomeButton = false,
  onBackPress,
  rightComponent,
}) => {
  const navigation = useNavigation<AppHeaderNavigationProp>();
  const { playSound, triggerHaptics } = useGame();

  const handleBackPress = async () => {
    await triggerHaptics('light');
    await playSound('button');
    
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const handleHomePress = async () => {
    await triggerHaptics('light');
    await playSound('button');
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      {/* Left Button */}
      <View style={styles.leftContainer}>
        {showBackButton && (
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.button}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Right Button */}
      <View style={styles.rightContainer}>
        {rightComponent}
        {showHomeButton && (
          <TouchableOpacity
            onPress={handleHomePress}
            style={styles.button}
            activeOpacity={0.7}
          >
            <Ionicons name="home" size={24} color={COLORS.white} />
          </TouchableOpacity>
        )}
        {!rightComponent && !showHomeButton && <View style={styles.placeholder} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  leftContainer: {
    width: 44,
    alignItems: 'flex-start',
  },
  rightContainer: {
    width: 44,
    alignItems: 'flex-end',
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.darkSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  title: {
    ...createTextStyle('lg', 'bold'),
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
});

export default AppHeader;

