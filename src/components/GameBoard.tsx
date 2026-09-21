import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { Cell, WinningLine, GameMove, GravityFallAnimation } from '../types/game';
import GameCell from './GameCell';
import GravityFallingPiece from './GravityFallingPiece';
import WinLine from './WinLine';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  GAME_DIMENSIONS,
  SHADOWS,
  getStorePreviewGradient,
} from '../utils/theme';
import { useTheme } from '../hooks/useTheme';
import { useEquippedBoardSkin } from '../hooks/useEquippedItems';

const { width } = Dimensions.get('window');

interface GameBoardProps {
  board: Cell[][];
  onCellPress: (row: number, col: number) => void;
  winningLine?: WinningLine | null;
  moves: GameMove[];
  isInfinityMode?: boolean;
  disabled?: boolean;
  // Infinity mode: the piece that will be removed on the next placement
  nextToRemove?: { row: number; col: number } | null;
  // Mad mode: cell temporarily blocked by a freeze mutation
  frozenCell?: { row: number; col: number } | null;
  // Gobble mode: size of the top piece in each cell (drives piece scale)
  cellSizes?: (1 | 2 | 3 | null)[][] | null;
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
  nextToRemove,
  frozenCell,
  cellSizes,
  pendingFall,
  onGravityFallComplete,
}) => {
  const { colors, theme } = useTheme();
  const boardSkin = useEquippedBoardSkin();
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

  // When skin is "Tema" (default), use the SAME bright gradient that the
  // store preview uses (COLORS.{theme}Gradient — not the dark "background"
  // variant returned by getThemeColors().gradient).
  const isThemeSkin = boardSkin.id === 'skin_default';
  const boardBgColor = isThemeSkin ? 'transparent' : boardSkin.boardBackground;
  const themeGradient = isThemeSkin ? getStorePreviewGradient(theme) : undefined;

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.board,
        {
          backgroundColor: boardBgColor,
          overflow: 'hidden',
        },
        boardSkin.glowColor ? {
          shadowColor: boardSkin.glowColor,
          shadowOpacity: 0.5,
          shadowRadius: 12,
          elevation: 10,
        } : null,
        boardAnimatedStyle,
      ]}>
        {/* Theme gradient background — matches the store preview EXACTLY
            (top→bottom direction, same gradient array). */}
        {isThemeSkin && themeGradient && themeGradient.length > 1 && (
          <LinearGradient
            colors={themeGradient as any}
            style={StyleSheet.absoluteFill}
          />
        )}
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
                  isNextToRemove={
                    isInfinityMode &&
                    !!nextToRemove &&
                    nextToRemove.row === rowIndex &&
                    nextToRemove.col === colIndex
                  }
                  isFrozen={
                    !!frozenCell &&
                    frozenCell.row === rowIndex &&
                    frozenCell.col === colIndex
                  }
                  pieceSize={cellSizes ? cellSizes[rowIndex][colIndex] : null}
                />
              );
            })}
          </View>
        ))}

        {/* Alinhador da vitoria. As medidas vao daqui porque cada tabuleiro
            tem a sua: este usa padding SPACING.lg e a celula do tema. */}
        {winningLine && (
          <WinLine
            winningLine={winningLine}
            cellSize={GAME_DIMENSIONS.cellSize}
            gap={cellGap}
            padding={SPACING.lg}
          />
        )}

        {/* Gravity Falling Piece Animation.
            key forces a REMOUNT when a different fall starts — the sprite only
            animates on mount, so a reused instance would never start fall B
            and its stale completion would teleport the wrong piece. */}
        {pendingFall && pendingFall.isAnimating && onGravityFallComplete && (
          <View
            key={`fall-${pendingFall.col}-${pendingFall.startRow}-${moves.length}`}
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
