import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Easing,
  Extrapolation,
} from 'react-native-reanimated';

import { WinningLine } from '../types/game';
import { useEquippedWinLine } from '../hooks/useEquippedItems';

/**
 * O traço da vitória.
 *
 * Por que é uma View e não um <Path> de SVG: no Android o react-native-svg
 * rasteriza em software e joga fora o bitmap inteiro a cada mudança de
 * propriedade, então animar `strokeDashoffset` num SVG do tamanho do tabuleiro
 * significaria realocar ~1,9 MB por quadro. Uma linha reta não precisa de
 * nada disso: uma View com `transformOrigin: 'left center'`, rotacionada no
 * ângulo do alinhamento e com `scaleX` indo de 0 a 1, dá exatamente o mesmo
 * desenho por transform puro de GPU — sem alocação e sem layout.
 *
 * As coordenadas chegam prontas de quem monta o tabuleiro porque cada um tem a
 * sua métrica: o tabuleiro normal usa padding SPACING.lg e a célula do tema,
 * o BigBoard usa padding SPACING.md e uma célula calculada em cima da largura
 * disponível. Calcular aqui dentro seria adivinhar.
 */

interface WinLineProps {
  winningLine: WinningLine;
  /** Lado da célula, em dp. */
  cellSize: number;
  /** Espaço entre células, em dp. */
  gap: number;
  /** Respiro interno do tabuleiro, em dp. */
  padding: number;
}

const GROW_MS = 420;
const SETTLE_MS = 760;

const WinLine: React.FC<WinLineProps> = ({ winningLine, cellSize, gap, padding }) => {
  const def = useEquippedWinLine();

  const cells = winningLine.cells;
  const first = cells[0];
  const last = cells[cells.length - 1];

  const step = cellSize + gap;
  const centerX = (col: number) => padding + col * step + cellSize / 2;
  const centerY = (row: number) => padding + row * step + cellSize / 2;

  const x1 = centerX(first.col);
  const y1 = centerY(first.row);
  const dx = centerX(last.col) - x1;
  const dy = centerY(last.row) - y1;

  const span = Math.hypot(dx, dy) || 1;
  const ux = dx / span;
  const uy = dy / span;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  // O traço passa um pouco das duas casas das pontas — parar exatamente no
  // centro delas faz a linha parecer curta demais para o que ela marca.
  const overhang = cellSize * 0.2;
  const length = span + overhang * 2;
  const startX = x1 - ux * overhang;
  const startY = y1 - uy * overhang;

  const grow = useSharedValue(0);
  const settle = useSharedValue(0);

  // A identidade do alinhamento: um jogo novo com a MESMA diagonal tem que
  // redesenhar do zero, e sem isto o componente reaproveitaria o valor final.
  const lineKey = `${def.id}:${cells.map(c => `${c.row}${c.col}`).join('')}`;

  useEffect(() => {
    grow.value = 0;
    settle.value = 0;
    grow.value = withTiming(1, { duration: GROW_MS, easing: Easing.out(Easing.cubic) });
    settle.value = withDelay(
      GROW_MS - 60,
      withTiming(1, { duration: SETTLE_MS, easing: Easing.out(Easing.quad) }),
    );
  }, [lineKey, grow, settle]);

  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(grow.value, [0, 0.1, 1], [0, 1, 1], Extrapolation.CLAMP),
    transform: [
      { rotate: `${angle}deg` },
      { scaleX: grow.value },
      // Engrossa de leve quando o traço fecha, e volta. É o que dá o "peso"
      // de uma coisa que acabou de encostar no tabuleiro.
      { scaleY: interpolate(settle.value, [0, 0.18, 1], [1, 1.45, 1], Extrapolation.CLAMP) },
    ],
  }), [angle]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(settle.value, [0, 0.2, 1], [0, 0.45, 0.22], Extrapolation.CLAMP),
    transform: [
      { rotate: `${angle}deg` },
      { scaleX: grow.value },
      { scaleY: interpolate(settle.value, [0, 0.18, 1], [1, 1.5, 1.1], Extrapolation.CLAMP) },
    ],
  }), [angle]);

  // A cabeça do cometa: viaja do começo ao fim junto com o traço, que é o
  // próprio rastro dela se acendendo.
  const cometStyle = useAnimatedStyle(() => {
    if (def.motif !== 'comet') return { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }] };
    return {
      opacity: interpolate(grow.value, [0, 0.05, 0.88, 1], [0, 1, 1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: dx * grow.value },
        { translateY: dy * grow.value },
        { scale: interpolate(grow.value, [0, 0.5, 1], [0.6, 1.15, 0.8], Extrapolation.CLAMP) },
      ],
    };
  }, [def.motif, dx, dy]);

  // Três detalhes ao longo do traço. Escritos abertos, um hook cada: colocar
  // `useAnimatedStyle` dentro de um `.map()` é quebra da regra dos hooks que só
  // não estoura enquanto a contagem nunca muda.
  const dropsMotif = def.motif === 'ember' || def.motif === 'ink';
  const frostMotif = def.motif === 'frost';

  const slot0 = useAnimatedStyle(() => {
    const s = interpolate(settle.value, [0, 1], [0, 1], Extrapolation.CLAMP);
    if (dropsMotif) {
      return {
        opacity: interpolate(s, [0, 0.12, 0.6, 1], [0, 1, 0.85, 0], Extrapolation.CLAMP),
        transform: [
          { translateY: interpolate(s, [0, 1], [0, 18], Extrapolation.CLAMP) },
          { scaleY: interpolate(s, [0, 0.2, 1], [0.3, 1, 1.7], Extrapolation.CLAMP) },
          { rotate: '0deg' },
        ],
      };
    }
    if (frostMotif) {
      return {
        opacity: interpolate(s, [0, 0.15, 1], [0, 1, 0.75], Extrapolation.CLAMP),
        transform: [
          { translateY: 0 },
          { scaleY: interpolate(s, [0, 0.45, 1], [0, 1.1, 1], Extrapolation.CLAMP) },
          { rotate: `${angle + 90}deg` },
        ],
      };
    }
    return { opacity: 0, transform: [{ translateY: 0 }, { scaleY: 0 }, { rotate: '0deg' }] };
  }, [dropsMotif, frostMotif, angle]);

  const slot1 = useAnimatedStyle(() => {
    const s = interpolate(settle.value, [0.14, 1], [0, 1], Extrapolation.CLAMP);
    if (dropsMotif) {
      return {
        opacity: interpolate(s, [0, 0.12, 0.6, 1], [0, 1, 0.85, 0], Extrapolation.CLAMP),
        transform: [
          { translateY: interpolate(s, [0, 1], [0, 18], Extrapolation.CLAMP) },
          { scaleY: interpolate(s, [0, 0.2, 1], [0.3, 1, 1.7], Extrapolation.CLAMP) },
          { rotate: '0deg' },
        ],
      };
    }
    if (frostMotif) {
      return {
        opacity: interpolate(s, [0, 0.15, 1], [0, 1, 0.75], Extrapolation.CLAMP),
        transform: [
          { translateY: 0 },
          { scaleY: interpolate(s, [0, 0.45, 1], [0, 1.1, 1], Extrapolation.CLAMP) },
          { rotate: `${angle + 90}deg` },
        ],
      };
    }
    return { opacity: 0, transform: [{ translateY: 0 }, { scaleY: 0 }, { rotate: '0deg' }] };
  }, [dropsMotif, frostMotif, angle]);

  const slot2 = useAnimatedStyle(() => {
    const s = interpolate(settle.value, [0.28, 1], [0, 1], Extrapolation.CLAMP);
    if (dropsMotif) {
      return {
        opacity: interpolate(s, [0, 0.12, 0.6, 1], [0, 1, 0.85, 0], Extrapolation.CLAMP),
        transform: [
          { translateY: interpolate(s, [0, 1], [0, 18], Extrapolation.CLAMP) },
          { scaleY: interpolate(s, [0, 0.2, 1], [0.3, 1, 1.7], Extrapolation.CLAMP) },
          { rotate: '0deg' },
        ],
      };
    }
    if (frostMotif) {
      return {
        opacity: interpolate(s, [0, 0.15, 1], [0, 1, 0.75], Extrapolation.CLAMP),
        transform: [
          { translateY: 0 },
          { scaleY: interpolate(s, [0, 0.45, 1], [0, 1.1, 1], Extrapolation.CLAMP) },
          { rotate: `${angle + 90}deg` },
        ],
      };
    }
    return { opacity: 0, transform: [{ translateY: 0 }, { scaleY: 0 }, { rotate: '0deg' }] };
  }, [dropsMotif, frostMotif, angle]);

  const hasSlots = dropsMotif || frostMotif;
  const slotAt = (f: number) => ({ left: x1 + dx * f, top: y1 + dy * f });

  const dropSize = { width: def.thickness * 0.75, height: def.thickness * 1.5 };
  const frostSize = { width: def.thickness * 0.6, height: cellSize * 0.42 };
  const slotSize = frostMotif ? frostSize : dropSize;

  return (
    <View style={styles.host} pointerEvents="none">
      {/* Halo por trás: mesma geometria, mais grosso e translúcido. Faz o papel
          que `shadowRadius` faria, e que no Android é no-op. */}
      <Animated.View
        style={[
          styles.bar,
          {
            left: startX,
            top: startY - (def.thickness * 2.4) / 2,
            width: length,
            height: def.thickness * 2.4,
            borderRadius: def.thickness * 1.2,
            backgroundColor: def.color,
          },
          glowStyle,
        ]}
      />

      <Animated.View
        style={[
          styles.bar,
          {
            left: startX,
            top: startY - def.thickness / 2,
            width: length,
            height: def.thickness,
            borderRadius: def.thickness / 2,
            backgroundColor: def.accent,
          },
          barStyle,
        ]}
      />

      {hasSlots && (
        <>
          <Animated.View
            style={[styles.slot, slotAt(0.26), slotSize, { backgroundColor: def.color }, slot0]}
          />
          <Animated.View
            style={[styles.slot, slotAt(0.52), slotSize, { backgroundColor: def.accent }, slot1]}
          />
          <Animated.View
            style={[styles.slot, slotAt(0.78), slotSize, { backgroundColor: def.color }, slot2]}
          />
        </>
      )}

      {def.motif === 'comet' && (
        <Animated.View
          style={[
            styles.comet,
            {
              left: x1 - def.thickness,
              top: y1 - def.thickness,
              width: def.thickness * 2,
              height: def.thickness * 2,
              borderRadius: def.thickness,
              backgroundColor: def.accent,
            },
            cometStyle,
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 120,
  },
  bar: {
    position: 'absolute',
    transformOrigin: 'left center',
  },
  slot: {
    position: 'absolute',
    borderRadius: 999,
    transformOrigin: 'center top',
  },
  comet: {
    position: 'absolute',
  },
});

export default WinLine;
