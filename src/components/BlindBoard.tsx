import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withDelay,
  FadeOut,
  FadeIn,
} from 'react-native-reanimated';

import { Cell, WinningLine, GameMove, BlindGameState } from '../types/game';
import GameCell from './GameCell';
import { 
  COLORS, 
  SPACING, 
  BORDER_RADIUS,
  SHADOWS,
  createTextStyle,
} from '../utils/theme';

interface BlindBoardProps {
  gameState: BlindGameState;
  onCellPress: (row: number, col: number) => void;
  winningLine?: WinningLine | null;
  disabled?: boolean;
  gameEnded?: boolean;
}

const BlindBoard: React.FC<BlindBoardProps> = ({
  gameState,
  onCellPress,
  winningLine,
  disabled = false,
  gameEnded = false,
}) => {
  const boardScale = useSharedValue(1);
  const [displayBoard, setDisplayBoard] = useState<Cell[][]>(gameState.board);

  // Animate board entrance
  React.useEffect(() => {
    boardScale.value = withSequence(
      withTiming(1.02, { duration: 400 }),
      withTiming(1, { duration: 300 })
    );
  }, []);

  // Update display board based on hidden moves
  useEffect(() => {
    const newBoard: Cell[][] = gameState.board.map(row => [...row]);
    
    // If game ended, reveal the full board
    if (gameEnded) {
      console.log('🙈 Blind Mode: Game ended, revealing full board!');
      setDisplayBoard(newBoard);
      return;
    }
    
    // Hide old moves (keep only last move from each player)
    const playerXMoves = gameState.moves.filter(m => m.player === 'X');
    const playerOMoves = gameState.moves.filter(m => m.player === 'O');
    
    // Hide all but the last move from each player
    const movesToHide = [
      ...playerXMoves.slice(0, -1),
      ...playerOMoves.slice(0, -1)
    ];
    
    // Clear hidden positions on display board
    movesToHide.forEach(move => {
      if (newBoard[move.row] && newBoard[move.row][move.col] !== null) {
        newBoard[move.row][move.col] = null;
      }
    });
    
    setDisplayBoard(newBoard);
  }, [gameState.moves, gameState.hiddenMoves, gameEnded]);

  const boardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boardScale.value }],
    borderColor: winningLine ? COLORS.gold : COLORS.warning,
    borderWidth: winningLine ? 3 : 2,
    shadowColor: winningLine ? COLORS.gold : COLORS.warning,
    shadowOpacity: winningLine ? 0.6 : 0.3,
    shadowRadius: winningLine ? 12 : 8,
    elevation: winningLine ? 12 : 8,
  }));

  const isCellInWinningLine = (row: number, col: number): boolean => {
    if (!winningLine) return false;
    return winningLine.cells.some(cell => cell.row === row && cell.col === col);
  };


  return (
    <View style={styles.container}>

      <Animated.View style={[styles.board, boardAnimatedStyle]}>
        {displayBoard.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => {
              const isHidden = cell === null && gameState.board[rowIndex][colIndex] !== null;
              
              return (
                <View key={`${rowIndex}-${colIndex}`} style={styles.cellContainer}>
                  {isHidden && (
                    <Animated.View 
                      style={styles.hiddenIndicator}
                      entering={FadeIn.duration(300)}
                    >
                      <Text style={styles.hiddenText}>❓</Text>
                    </Animated.View>
                  )}
                  <GameCell
                    value={cell}
                    row={rowIndex}
                    col={colIndex}
                    onPress={() => onCellPress(rowIndex, colIndex)}
                    isWinning={isCellInWinningLine(rowIndex, colIndex)}
                    disabled={disabled}
                    winningLine={winningLine}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </Animated.View>

      {/* Mystery Effect */}
      <Animated.View style={styles.mysteryEffect} entering={FadeIn.delay(500)}>
        <Text style={styles.mysteryText}>🌫️ Use sua memória... 🌫️</Text>
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
    padding: SPACING.md,
    ...SHADOWS.heavy,
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.xs,
    justifyContent: 'center',
  },
  cellContainer: {
    position: 'relative',
  },
  hiddenIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.darkGray + '80',
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  hiddenText: {
    fontSize: 20,
    opacity: 0.8,
  },
  mysteryEffect: {
    marginTop: SPACING.sm,
    padding: SPACING.xs,
    backgroundColor: COLORS.darkTertiary + '60',
    borderRadius: BORDER_RADIUS.md,
  },
  mysteryText: {
    ...createTextStyle('sm', 'medium'),
    color: COLORS.lightGray,
    textAlign: 'center',
  },
});

export default BlindBoard;

