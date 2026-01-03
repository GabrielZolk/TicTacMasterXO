import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

import { Cell, WinningLine, GameMove, GravityFallAnimation } from '../types/game';
import GameCell from './GameCell';
import GravityFallingPiece from './GravityFallingPiece';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  GAME_DIMENSIONS,
  SHADOWS,
} from '../utils/theme';

const { width } = Dimensions.get('window');

interface GameBoardProps {
  board: Cell[][];
  onCellPress: (row: number, col: number) => void;
  winningLine?: WinningLine | null;
  moves: GameMove[];
  isInfinityMode?: boolean;
  disabled?: boolean;
  // Gravity mode props
  pendingFall?: GravityFallAnimation;
  onGravityFallComplete?: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  board,
  onCellPress,
  winningLine,
  moves,
  isInfinityMode = false,
  disabled = false,
  pendingFall,
  onGravityFallComplete,
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

  // Calculate position for gravity falling piece
  const cellGap = SPACING.xs;
  const getCellPosition = (row: number, col: number) => {
    const cellWithGap = GAME_DIMENSIONS.cellSize + cellGap;
    return {
      top: SPACING.lg + (row * cellWithGap),
      left: SPACING.lg + (col * cellWithGap),
    };
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.board, boardAnimatedStyle]}>
        {board.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => {
              // Check if this cell's piece should be hidden for gravity animation
              const isAnimatingCell = pendingFall &&
                pendingFall.isAnimating &&
                rowIndex === pendingFall.startRow &&
                colIndex === pendingFall.col;

              return (
                <GameCell
                  key={`${rowIndex}-${colIndex}`}
                  value={cell}
                  row={rowIndex}
                  col={colIndex}
                  onPress={() => onCellPress(rowIndex, colIndex)}
                  isWinning={isCellInWinningLine(rowIndex, colIndex)}
                  disabled={disabled}
                  winningLine={winningLine}
                  isHiddenForAnimation={isAnimatingCell}
                />
              );
            })}
          </View>
        ))}

        {/* Gravity Falling Piece Animation */}
        {pendingFall && pendingFall.isAnimating && onGravityFallComplete && (
          <View
            style={[
              styles.fallingPieceContainer,
              getCellPosition(pendingFall.startRow, pendingFall.col),
            ]}
          >
            <GravityFallingPiece
              player={pendingFall.player}
              startRow={pendingFall.startRow}
              endRow={pendingFall.endRow}
              col={pendingFall.col}
              onAnimationComplete={onGravityFallComplete}
              cellSize={GAME_DIMENSIONS.cellSize}
              cellGap={cellGap}
            />
          </View>
        )}
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
    gap: SPACING.xs,
    ...SHADOWS.heavy,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.xs,
    justifyContent: 'center',
  },
  fallingPieceContainer: {
    position: 'absolute',
    zIndex: 100,
  },
});

export default GameBoard;
