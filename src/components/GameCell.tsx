import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  withRepeat,
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
import { useEquippedSymbols, useEquippedBoardSkin } from '../hooks/useEquippedItems';
import MysticCellEffect from './MysticCellEffect';
import CopaNickCellEffect from './CopaNickCellEffect';

interface GameCellProps {
  value: Cell;
  row: number;
  col: number;
  onPress: () => void;
  isWinning?: boolean;
  disabled?: boolean;
  winningLine?: WinningLine | null;
  isHiddenForAnimation?: boolean; // Hide piece during gravity fall animation
  isNextToRemove?: boolean; // Infinity mode: this piece disappears on the next placement
  isFrozen?: boolean; // Mad mode: cell blocked by a freeze mutation
  pieceSize?: 1 | 2 | 3 | null; // Gobble mode: relative size of the piece here
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
  isHiddenForAnimation = false,
  isNextToRemove = false,
  isFrozen = false,
  pieceSize = null,
}) => {
  const { theme, colors: themeColors } = useTheme();
  const equippedSymbols = useEquippedSymbols();
  const boardSkin = useEquippedBoardSkin();
  const scale = useSharedValue(1);
  // Separate scale for the glyph: starts at 0 when a piece is present on mount
  // would be wrong — start hidden ONLY for pieces that appear after mount.
  // Effects run after paint, so zeroing the shared `scale` there made the piece
  // flash at full size, vanish, then regrow ("appears then disappears" blink).
  const pieceScale = useSharedValue(value ? 1 : 0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const borderAnimation = useSharedValue(0);
  const glowAnimation = useSharedValue(0);
  const doomedPulse = useSharedValue(1);

  // Animate piece placement — grow up from 0, never zero after paint
  React.useEffect(() => {
    if (value) {
      pieceScale.value = withSequence(
        withTiming(1.05, { duration: 150 }),
        withTiming(1, { duration: 100 })
      );

      rotation.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(value === 'X' ? 3 : -3, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );
    } else {
      // Cell emptied (infinity removal / restart): reset so the next piece grows in
      pieceScale.value = 0;
    }
  }, [value]);

  // Infinity: pulse the piece that will be removed on the next placement
  React.useEffect(() => {
    if (isNextToRemove && value) {
      doomedPulse.value = withRepeat(
        withSequence(
          withTiming(0.35, { duration: 600 }),
          withTiming(0.8, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      doomedPulse.value = withTiming(1, { duration: 200 });
    }
  }, [isNextToRemove, value]);

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

  // Animated styles (use board skin colors when a custom skin is equipped)
  const useCustomSkin = boardSkin.id !== 'skin_default';
  // For "Tema" skin: cells should be near-transparent with a subtle white border —
  // EXACTLY like the store preview (ThemePreview), so the theme gradient behind
  // the board shows through cleanly. Using a dark overlay here was making the
  // gradient look "fosco" (matte) compared to the vibrant preview.
  const cellBgBase = useCustomSkin ? boardSkin.cellBackground : 'rgba(255,255,255,0.06)';
  const cellBgHighlight = useCustomSkin
    ? boardSkin.cellBackground.slice(0, 7) + '80'
    : 'rgba(255,255,255,0.20)';
  const cellBorderBase = useCustomSkin ? boardSkin.cellBorder : 'rgba(255,255,255,0.20)';

  const cellAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      borderAnimation.value,
      [0, 1],
      [cellBgBase, cellBgHighlight]
    );

    const borderColor = interpolateColor(
      borderAnimation.value,
      [0, 1],
      [cellBorderBase, COLORS.gold]
    );

    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
      borderColor,
      borderRadius: boardSkin.cellBorderRadius,
      shadowOpacity: 0.1 + (glowAnimation.value * 0.3),
      shadowRadius: 4 + (glowAnimation.value * 8),
      elevation: 2 + (glowAnimation.value * 6),
    };
  });

  const pieceAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: pieceScale.value },
    ],
    // doomedPulse fades the piece that infinity mode will remove next
    opacity: opacity.value * doomedPulse.value,
  }));


  // Copa Nick theme bundles its own pieces: ⚽ (bola) for O and 👟 (Chuteira
  // de Ouro) for X. It applies when the player hasn't equipped a custom symbol
  // pack — an explicitly equipped pack still wins.
  const usingDefaultSymbols = equippedSymbols.playerX === 'X' && equippedSymbols.playerO === 'O';
  const isCopaNick = theme === 'copa_nick';

  const getPieceSymbol = (player: Cell): string => {
    if (isCopaNick && usingDefaultSymbols) {
      if (player === 'X') return '👟';
      if (player === 'O') return '⚽';
    }
    if (player === 'X') return equippedSymbols.playerX;
    if (player === 'O') return equippedSymbols.playerO;
    return '';
  };

  // Style-aware colors for custom symbol packs.
  // When the "Tema" board skin is equipped (skin_default), force the pieces to
  // follow the theme — so picking "Tema" really means "tudo segue o tema",
  // even if the player still has the default symbol pack equipped.
  const symbolStyle = boardSkin.id === 'skin_default' ? 'theme' : equippedSymbols.style;

  const getStyledPieceColor = (player: Cell): string => {
    if (isWinning) return COLORS.gold;
    if (!player) return COLORS.white;

    switch (symbolStyle) {
      case 'theme':
        return player === 'X' ? themeColors.text : (themeColors.textSecondary || themeColors.text);
      case 'neon':
        return player === 'X' ? '#FF00FF' : '#00FFFF';
      case 'gold':
        return player === 'X' ? '#FFD700' : '#FFA500';
      case 'fire':
        return player === 'X' ? '#FF4500' : '#FF6B35';
      case 'ice':
        return player === 'X' ? '#00D9FF' : '#87CEEB';
      case 'matrix':
        return player === 'X' ? '#00FF41' : '#00DD00';
      default:
        return getPlayerColor(player);
    }
  };

  const getStyledShadow = (player: Cell): { color: string; radius: number } => {
    if (isWinning) return { color: COLORS.gold, radius: 10 };
    const color = getStyledPieceColor(player);

    switch (symbolStyle) {
      case 'theme':
        return { color, radius: 8 };
      case 'neon':
        return { color, radius: 15 };
      case 'gold':
        return { color: '#FFD700', radius: 12 };
      case 'fire':
        return { color: '#FF4500', radius: 14 };
      case 'ice':
        return { color: '#00D9FF', radius: 12 };
      case 'matrix':
        return { color: '#00FF41', radius: 10 };
      default:
        return { color, radius: 5 };
    }
  };

  return (
    <AnimatedTouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isFrozen || (!!value && !pieceSize)}
      activeOpacity={0.8}
      style={[styles.cell, cellAnimatedStyle]}
    >
      {/* Game piece - hidden during gravity fall animation */}
      {value && !isHiddenForAnimation && (
        <Animated.View style={pieceAnimatedStyle}>
          <Text
            style={[
              styles.piece,
              {
                color: getStyledPieceColor(value),
                textShadowColor: getStyledShadow(value).color,
                textShadowRadius: getStyledShadow(value).radius,
                fontWeight: symbolStyle === 'gold' ? '900' : 'bold',
                letterSpacing: symbolStyle === 'matrix' ? 2 : 0,
              },
              // Gobble mode: the glyph scales with the piece size so players can
              // see at a glance what can still be swallowed.
              pieceSize ? { fontSize: GAME_DIMENSIONS.pieceSize * (0.45 + pieceSize * 0.17) } : null,
            ]}
          >
            {getPieceSymbol(value)}
          </Text>
        </Animated.View>
      )}

      {/* Mad mode: frozen cell */}
      {isFrozen && (
        <View style={styles.frozenOverlay} pointerEvents="none">
          <Text style={styles.frozenIcon}>🧊</Text>
        </View>
      )}

      {/* Empty cell indicator */}
      {!value && !disabled && !isFrozen && (
        <View style={styles.emptyIndicator} />
      )}

      {/* Mystic effects for Samuel theme */}
      <MysticCellEffect
        theme={theme}
        player={value}
        isWinning={isWinning}
      />

      {/* Sticker foil effects for Copa Nick theme */}
      <CopaNickCellEffect
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
  frozenOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(120, 200, 255, 0.22)',
    borderRadius: BORDER_RADIUS.md,
  },
  frozenIcon: {
    fontSize: GAME_DIMENSIONS.pieceSize * 0.55,
  },
  emptyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.darkGray + '40',
  },
});

export default GameCell;
