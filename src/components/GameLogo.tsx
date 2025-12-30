import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, getPlayerColor } from '../utils/theme';

interface GameLogoProps {
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

const GameLogo: React.FC<GameLogoProps> = ({ size = 'large', animated = true }) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (animated) {
      // Subtle rotation animation
      rotation.value = withRepeat(
        withTiming(360, { duration: 10000 }),
        -1,
        false
      );

      // Gentle pulsing animation
      scale.value = withRepeat(
        withTiming(1.05, { duration: 2000 }),
        -1,
        true
      );
    }
  }, [animated, rotation, scale]);

  const logoSizes = {
    small: {
      container: { width: 120, height: 80 },
      xSize: 40,
      oSize: 35,
      titleSize: FONTS.sizes.lg,
      subtitleSize: FONTS.sizes.sm,
    },
    medium: {
      container: { width: 160, height: 100 },
      xSize: 50,
      oSize: 45,
      titleSize: FONTS.sizes.xxl,
      subtitleSize: FONTS.sizes.md,
    },
    large: {
      container: { width: 200, height: 120 },
      xSize: 60,
      oSize: 55,
      titleSize: FONTS.sizes.header,
      subtitleSize: FONTS.sizes.lg,
    },
  };

  const currentSize = logoSizes[size];

  const animatedXStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value * 0.3}deg` },
      { scale: scale.value },
    ],
  }));

  const animatedOStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${-rotation.value * 0.2}deg` },
      { scale: interpolate(scale.value, [1, 1.05], [1, 0.95]) },
    ],
  }));

  return (
    <View style={[styles.container, currentSize.container]}>
      {/* Title */}
      <Text style={[styles.title, { fontSize: currentSize.titleSize }]}>
        TicTac Master
      </Text>
      
      {/* Logo Icons Container */}
      <View style={styles.logoContainer}>
        {/* X Icon */}
        <Animated.View style={[styles.xContainer, animatedXStyle]}>
          <Text
            style={[
              styles.xIcon,
              {
                fontSize: currentSize.xSize,
                color: getPlayerColor('X'),
              },
            ]}
          >
            ✗
          </Text>
        </Animated.View>

        {/* O Icon */}
        <Animated.View style={[styles.oContainer, animatedOStyle]}>
          <Text
            style={[
              styles.oIcon,
              {
                fontSize: currentSize.oSize,
                color: getPlayerColor('O'),
              },
            ]}
          >
            ○
          </Text>
        </Animated.View>
      </View>

      {/* Subtitle */}
      <Text style={[styles.subtitle, { fontSize: currentSize.subtitleSize }]}>
        XO
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: FONTS.weights.extrabold,
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 1.5,
    textShadowColor: COLORS.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.sm,
    position: 'relative',
  },
  xContainer: {
    position: 'absolute',
    left: -10,
    zIndex: 2,
  },
  oContainer: {
    position: 'absolute',
    right: -10,
    zIndex: 1,
  },
  xIcon: {
    fontWeight: FONTS.weights.bold,
    textShadowColor: COLORS.xColor,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  oIcon: {
    fontWeight: FONTS.weights.bold,
    textShadowColor: COLORS.oColor,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontWeight: FONTS.weights.bold,
    color: COLORS.gold,
    textAlign: 'center',
    letterSpacing: 3,
    textShadowColor: COLORS.yellow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
});

export default GameLogo;
