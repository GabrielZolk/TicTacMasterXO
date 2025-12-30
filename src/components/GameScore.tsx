import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

import { Player, GameStats } from '../types/game';
import { 
  COLORS, 
  SPACING, 
  BORDER_RADIUS,
  SHADOWS,
  getPlayerColor,
  createTextStyle,
} from '../utils/theme';

interface GameScoreProps {
  currentPlayer: Player;
  gameStats: GameStats;
  winner?: Player | null;
  isDraw?: boolean;
  gameMode: string;
}

const GameScore: React.FC<GameScoreProps> = ({
  currentPlayer,
  gameStats,
  winner,
  isDraw = false,
  gameMode,
}) => {
  const playerXScale = useSharedValue(1);
  const playerOScale = useSharedValue(1);
  const statusAnimation = useSharedValue(0);

  // Animate current player indicator
  React.useEffect(() => {
    if (!winner && !isDraw) {
      if (currentPlayer === 'X') {
        playerXScale.value = withSpring(1.1, { damping: 10 });
        playerOScale.value = withSpring(1, { damping: 10 });
      } else {
        playerOScale.value = withSpring(1.1, { damping: 10 });
        playerXScale.value = withSpring(1, { damping: 10 });
      }
    } else {
      playerXScale.value = withSpring(1, { damping: 10 });
      playerOScale.value = withSpring(1, { damping: 10 });
    }
  }, [currentPlayer, winner, isDraw]);

  // Animate game status changes
  React.useEffect(() => {
    if (winner || isDraw) {
      statusAnimation.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.8, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );
    } else {
      statusAnimation.value = withTiming(0, { duration: 200 });
    }
  }, [winner, isDraw]);

  const getStatusMessage = (): string => {
    if (winner) {
      return `Player ${winner} Wins!`;
    }
    if (isDraw) {
      return "It's a Draw!";
    }
    return `Player ${currentPlayer}'s Turn`;
  };

  const getStatusColor = (): string => {
    if (winner) {
      return getPlayerColor(winner);
    }
    if (isDraw) {
      return COLORS.gray;
    }
    return getPlayerColor(currentPlayer);
  };

  // Animated styles
  const playerXAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      currentPlayer === 'X' && !winner && !isDraw ? 1 : 0,
      [0, 1],
      [COLORS.darkSecondary + '80', COLORS.xColor + '20']
    );

    const borderColor = interpolateColor(
      currentPlayer === 'X' && !winner && !isDraw ? 1 : 0,
      [0, 1],
      [COLORS.darkGray, COLORS.xColor]
    );

    return {
      transform: [{ scale: playerXScale.value }],
      backgroundColor,
      borderColor,
    };
  });

  const playerOAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      currentPlayer === 'O' && !winner && !isDraw ? 1 : 0,
      [0, 1],
      [COLORS.darkSecondary + '80', COLORS.oColor + '20']
    );

    const borderColor = interpolateColor(
      currentPlayer === 'O' && !winner && !isDraw ? 1 : 0,
      [0, 1],
      [COLORS.darkGray, COLORS.oColor]
    );

    return {
      transform: [{ scale: playerOScale.value }],
      backgroundColor,
      borderColor,
    };
  });

  const statusAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: statusAnimation.value > 0 ? statusAnimation.value : 1 }],
  }));

  return (
    <View style={styles.container}>
      {/* Player X Score */}
      <Animated.View style={[styles.playerCard, playerXAnimatedStyle]}>
        <View style={[styles.playerIcon, { backgroundColor: COLORS.xColor + '30' }]}>
          <Text style={[styles.playerSymbol, { color: COLORS.xColor }]}>✗</Text>
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.playerLabel}>Player X</Text>
          <Text style={[styles.playerScore, { color: COLORS.xColor }]}>
            {gameStats.playerX.wins}
          </Text>
          <Text style={styles.playerSubtitle}>wins</Text>
        </View>
      </Animated.View>

      {/* Status Message */}
      <Animated.View style={[styles.statusContainer, statusAnimatedStyle]}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusMessage()}
        </Text>
        <Text style={styles.gameModeText}>{gameMode}</Text>
      </Animated.View>

      {/* Player O Score */}
      <Animated.View style={[styles.playerCard, playerOAnimatedStyle]}>
        <View style={[styles.playerIcon, { backgroundColor: COLORS.oColor + '30' }]}>
          <Text style={[styles.playerSymbol, { color: COLORS.oColor }]}>○</Text>
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.playerLabel}>Player O</Text>
          <Text style={[styles.playerScore, { color: COLORS.oColor }]}>
            {gameStats.playerO.wins}
          </Text>
          <Text style={styles.playerSubtitle}>wins</Text>
        </View>
      </Animated.View>
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
  playerCard: {
    flex: 1,
    backgroundColor: COLORS.darkSecondary + '80',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    padding: SPACING.md,
    alignItems: 'center',
    position: 'relative',
    ...SHADOWS.light,
  },
  playerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  playerSymbol: {
    fontSize: 20,
    fontWeight: '900',
  },
  playerInfo: {
    alignItems: 'center',
  },
  playerLabel: {
    ...createTextStyle('sm', 'medium'),
    color: COLORS.lightGray,
    marginBottom: 2,
  },
  playerScore: {
    ...createTextStyle('xl', 'bold'),
    marginBottom: 2,
  },
  playerSubtitle: {
    ...createTextStyle('xs', 'regular'),
    color: COLORS.gray,
  },
  statusContainer: {
    flex: 1.5,
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  statusText: {
    ...createTextStyle('lg', 'bold'),
    textAlign: 'center',
    marginBottom: SPACING.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gameModeText: {
    ...createTextStyle('xs', 'medium'),
    color: COLORS.gray,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default GameScore;
