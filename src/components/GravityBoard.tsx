import React from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { Cell, WinningLine, GameMove } from '../types/game';
import GameCell from './GameCell';
import { 
  COLORS, 
  SPACING, 
  BORDER_RADIUS,
  GAME_DIMENSIONS,
  SHADOWS,
} from '../utils/theme';

const { width } = Dimensions.get('window');

interface GravityBoardProps {
  board: Cell[][];
  onColumnPress: (col: number) => void;
  winningLine?: WinningLine | null;
  moves: GameMove[];
  disabled?: boolean;
}

const GravityBoard: React.FC<GravityBoardProps> = ({
  board,
  onColumnPress,
  winningLine,
  moves,
  disabled = false,
}) => {
  const boardScale = useSharedValue(1);
  const borderGlow = useSharedValue(0);

  // Animate board entrance
  React.useEffect(() => {
    boardScale.value = withTiming(1, { duration: 300 });
  }, []);

  // Animate border glow for winning line
  React.useEffect(() => {
    if (winningLine) {
      borderGlow.value = withTiming(1, { duration: 500 });
    } else {
      borderGlow.value = withTiming(0, { duration: 300 });
    }
  }, [winningLine]);

  const boardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boardScale.value }],
    borderColor: winningLine ? COLORS.gold : COLORS.yellow,
    borderWidth: winningLine ? 3 : 2,
    shadowColor: winningLine ? COLORS.gold : COLORS.yellow,
    shadowOpacity: 0.3 + (borderGlow.value * 0.4),
    shadowRadius: 8 + (borderGlow.value * 8),
    elevation: 8 + (borderGlow.value * 8),
  }));

  const isCellInWinningLine = (row: number, col: number): boolean => {
    if (!winningLine) return false;
    return winningLine.cells.some(cell => cell.row === row && cell.col === col);
  };

  // Create column hit areas for gravity mode
  const renderColumnTouchArea = (colIndex: number) => (
    <TouchableOpacity
      key={`column-${colIndex}`}
      style={[
        styles.columnTouchArea,
        disabled && styles.disabled
      ]}
      onPress={() => !disabled && onColumnPress(colIndex)}
      activeOpacity={0.7}
    >
      <View style={styles.columnIndicator}>
        <Animated.View style={[
          styles.columnHighlight,
          { backgroundColor: COLORS.gold + '30' }
        ]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.board, boardAnimatedStyle]}>
        {/* Column touch areas */}
        <View style={styles.columnTouchContainer}>
          {Array.from({ length: 3 }, (_, colIndex) => renderColumnTouchArea(colIndex))}
        </View>

        {/* Game cells */}
        <View style={styles.cellsContainer}>
          {board.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => (
                <GameCell
                  key={`${rowIndex}-${colIndex}`}
                  value={cell}
                  row={rowIndex}
                  col={colIndex}
                  onPress={() => {}} // Disabled for gravity mode
                  isWinning={isCellInWinningLine(rowIndex, colIndex)}
                  disabled={true} // Always disabled since we use column touches
                  winningLine={winningLine}
                />
              ))}
            </View>
          ))}
        </View>

        {/* Column indicators */}
        <View style={styles.columnIndicators}>
          {Array.from({ length: 3 }, (_, colIndex) => (
            <View key={`indicator-${colIndex}`} style={styles.columnArrow}>
              <Animated.Text style={styles.arrowText}>⬇</Animated.Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  board: {
    backgroundColor: COLORS.darkSecondary + '40',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.heavy,
    position: 'relative',
  },
  columnTouchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    flexDirection: 'row',
    zIndex: 10,
  },
  columnTouchArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  columnIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  columnHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
  cellsContainer: {
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.xs,
    justifyContent: 'center',
  },
  columnIndicators: {
    position: 'absolute',
    top: -40,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  columnArrow: {
    alignItems: 'center',
    width: GAME_DIMENSIONS.cellSize,
  },
  arrowText: {
    fontSize: 24,
    color: COLORS.gold,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default GravityBoard;

