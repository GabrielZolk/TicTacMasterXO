import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';

import { Cell, WinningLine } from '../types/game';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  GAME_DIMENSIONS,
  SHADOWS,
  getPlayerColor,
  createTextStyle,
} from '../utils/theme';
import { useTheme } from '../hooks/useTheme';
import MysticCellEffect from './MysticCellEffect';

interface GameCellProps {
  value: Cell;
  row: number;
  col: number;
  onPress: () => void;
  isWinning?: boolean;
  disabled?: boolean;
  winningLine?: WinningLine | null;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const GameCell: React.FC<GameCellProps> = ({
  value,
  row,
  col,
  onPress,
  isWinning = false,
  disabled = false,
  winningLine,
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const borderAnimation = useSharedValue(0);
  const glowAnimation = useSharedValue(0);

  // Animate piece placement
  React.useEffect(() => {
    if (value) {
      scale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1.05, { duration: 150 }),
        withTiming(1, { duration: 100 })
      );

      rotation.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(value === 'X' ? 3 : -3, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );
    }
  }, [value]);

  // Animate winning state
  React.useEffect(() => {
    if (isWinning && winningLine) {
      const delay = winningLine.cells.findIndex(cell => cell.row === row && cell.col === col) * 100;

      glowAnimation.value = withDelay(
        delay,
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.8, { duration: 300 }),
          withTiming(1, { duration: 300 })
        )
      );

      scale.value = withDelay(
        delay,
        withSequence(
          withTiming(1.08, { duration: 200 }),
          withTiming(1, { duration: 150 })
        )
      );
    } else {
      glowAnimation.value = withTiming(0, { duration: 300 });
    }
  }, [isWinning, winningLine, row, col]);


  // Handle press animation
  const handlePressIn = () => {
    if (!disabled && !value) {
      scale.value = withTiming(0.95, { duration: 100 });
      borderAnimation.value = withTiming(1, { duration: 200 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !value) {
      scale.value = withTiming(1, { duration: 100 });
      borderAnimation.value = withTiming(0, { duration: 250 });
    }
  };

  // Animated styles
  const cellAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      borderAnimation.value,
      [0, 1],
      [COLORS.darkTertiary + '40', COLORS.darkTertiary + '80']
    );

    const borderColor = interpolateColor(
      borderAnimation.value,
      [0, 1],
      [COLORS.darkGray, COLORS.gold]
    );

    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
      borderColor,
      shadowOpacity: 0.1 + (glowAnimation.value * 0.3),
      shadowRadius: 4 + (glowAnimation.value * 8),
      elevation: 2 + (glowAnimation.value * 6),
    };
  });

  const pieceAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));


  const getPieceSymbol = (player: Cell): string => {
    if (player === 'X') return '✗';
    if (player === 'O') return '○';
    return '';
  };

  const getPieceColor = (player: Cell): string => {
    if (isWinning) {
      return COLORS.gold;
    }
    return player ? getPlayerColor(player) : COLORS.white;
  };

  return (
    <AnimatedTouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || !!value}
      activeOpacity={0.8}
      style={[styles.cell, cellAnimatedStyle]}
    >
      {/* Game piece */}
      {value && (
        <Animated.View style={pieceAnimatedStyle}>
          <Text
            style={[
              styles.piece,
              {
                color: getPieceColor(value),
                textShadowColor: isWinning ? COLORS.gold : getPieceColor(value),
                textShadowRadius: isWinning ? 10 : 5,
              },
            ]}
          >
            {getPieceSymbol(value)}
          </Text>
        </Animated.View>
      )}

      {/* Empty cell indicator */}
      {!value && !disabled && (
        <View style={styles.emptyIndicator} />
      )}

      {/* Mystic effects for Samuel theme */}
      <MysticCellEffect
        theme={theme}
        player={value}
        isWinning={isWinning}
      />
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cell: {
    width: GAME_DIMENSIONS.cellSize,
    height: GAME_DIMENSIONS.cellSize,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...SHADOWS.light,
  },
  piece: {
    fontSize: GAME_DIMENSIONS.pieceSize * 0.9,
    fontWeight: '800',
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
  },
  emptyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.darkGray + '40',
  },
});

export default GameCell;
