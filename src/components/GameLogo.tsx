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

  // `container` sets width only. It used to pin a height too (200x120 for
  // `large`), and "TicTac Master" at 48px needs ~330px, so on a 390px phone the
  // title wrapped to two lines, ate the whole box, and the X/O — which are
  // absolutely positioned — landed on top of the word "Master".
  //
  // Two things keep that from coming back: the title is sized to fit one line
  // on a narrow screen (and clamped with numberOfLines), and `icon` gives the
  // X/O their own vertical space instead of collapsing to zero height.
  const logoSizes = {
    small: {
      container: { width: 160 },
      icon: { width: 64, height: 48 },
      xSize: 40,
      oSize: 35,
      titleSize: FONTS.sizes.lg,
      subtitleSize: FONTS.sizes.sm,
    },
    medium: {
      container: { width: 220 },
      icon: { width: 80, height: 60 },
      xSize: 50,
      oSize: 45,
      titleSize: FONTS.sizes.xxl,
      subtitleSize: FONTS.sizes.md,
    },
    large: {
      container: { width: 300 },
      icon: { width: 96, height: 72 },
      xSize: 60,
      oSize: 55,
      titleSize: FONTS.sizes.xxxl,
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
      <Text
        style={[styles.title, { fontSize: currentSize.titleSize }]}
        numberOfLines={1}
      >
        TicTac Master
      </Text>

      {/* Logo Icons Container */}
      <View style={[styles.logoContainer, currentSize.icon]}>
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
