import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

import { Player, GameMode } from '../types/game';
import { useI18n } from '../i18n/useI18n';
import { 
  COLORS, 
  SPACING, 
  BORDER_RADIUS, 
  createTextStyle,
  getPlayerColor,
  SHADOWS,
} from '../utils/theme';

interface GameStatusDisplayProps {
  winner: Player | null;
  isDraw: boolean;
  currentPlayer: Player;
  mode: GameMode;
  isGameActive: boolean;
}

const GameStatusDisplay: React.FC<GameStatusDisplayProps> = ({
  winner,
  isDraw,
  currentPlayer,
  mode,
  isGameActive,
}) => {
  const { t } = useI18n();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Animate status changes
  React.useEffect(() => {
    if (winner || isDraw) {
      scale.value = withSequence(
        withTiming(1.1, { duration: 200 }),
        withSpring(1, { damping: 10 })
      );
    } else {
      scale.value = withSpring(1, { damping: 15 });
    }
  }, [winner, isDraw]);

  const getStatusText = (): string => {
    if (winner) {
      if (mode === 'vsAI') {
        if (winner === 'X') {
          return t('gameStatus.win'); // You Won! 🎉
        } else {
          return t('gameStatus.aiWin'); // AI Won! 🤖
        }
      } else {
        return t('playerWins', { player: winner }); // Player X Wins!
      }
    }
    
    if (isDraw) {
      return t('gameStatus.draw'); // It's a Draw! 🤝
    }
    
    if (mode === 'vsAI') {
      if (currentPlayer === 'X') {
        return t('playerTurn', { player: 'X' });
      } else {
        return t('aiThinking');
      }
    } else {
      return t('playerTurn', { player: currentPlayer });
    }
  };

  const getStatusColor = (): string => {
    if (winner) {
      if (mode === 'vsAI') {
        return winner === 'X' ? COLORS.success : COLORS.error;
      }
      return getPlayerColor(winner);
    }
    
    if (isDraw) {
      return COLORS.warning;
    }
    
    if (mode === 'vsAI' && currentPlayer === 'O') {
      return COLORS.oColor;
    }
    
    return getPlayerColor(currentPlayer);
  };

  const getBackgroundColor = (): string => {
    if (winner) {
      if (mode === 'vsAI') {
        return winner === 'X' ? COLORS.success + '20' : COLORS.error + '20';
      }
      return getPlayerColor(winner) + '20';
    }
    
    if (isDraw) {
      return COLORS.warning + '20';
    }
    
    return COLORS.darkSecondary + '80';
  };

  const getBorderColor = (): string => {
    if (winner) {
      if (mode === 'vsAI') {
        return winner === 'X' ? COLORS.success : COLORS.error;
      }
      return getPlayerColor(winner);
    }
    
    if (isDraw) {
      return COLORS.warning;
    }
    
    return getStatusColor() + '60';
  };

  const getStatusIcon = (): string => {
    if (winner) {
      if (mode === 'vsAI') {
        return winner === 'X' ? '🎉' : '🤖';
      }
      return winner === 'X' ? '✗' : '○';
    }
    
    if (isDraw) {
      return '🤝';
    }
    
    if (mode === 'vsAI' && currentPlayer === 'O') {
      return '🤔';
    }
    
    return currentPlayer === 'X' ? '✗' : '○';
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[
      styles.container,
      animatedStyle,
      {
        backgroundColor: getBackgroundColor(),
        borderColor: getBorderColor(),
      }
    ]}>
      <View style={styles.content}>
        <Text style={[styles.icon, { color: getStatusColor() }]}>
          {getStatusIcon()}
        </Text>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>
      
      {(winner || isDraw) && (
        <View style={[styles.gameEndIndicator, { backgroundColor: getStatusColor() }]} />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    padding: SPACING.lg,
    position: 'relative',
    ...SHADOWS.medium,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  icon: {
    fontSize: 24,
    fontWeight: '900',
  },
  statusText: {
    ...createTextStyle('lg', 'bold'),
    textAlign: 'center',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gameEndIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default GameStatusDisplay;
