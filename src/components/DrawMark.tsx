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

import { useEquippedDrawMark } from '../hooks/useEquippedItems';

/**
 * O "V" da velha, desenhado por cima do tabuleiro.
 *
 * São dois traços em sequência — desce da esquerda até o fundo, sobe do fundo
 * até a direita — pela mesma razão do alinhador: uma reta se desenha com uma
 * View de `transformOrigin: 'left center'` e `scaleX` de 0 a 1, por transform
 * puro de GPU. Um <Path> de SVG animado custaria um bitmap do tamanho do
 * tabuleiro realocado a cada quadro no Android.
 *
 * As medidas do tabuleiro chegam de fora porque cada modo tem a sua, e o 4x4
 * ainda por cima calcula a célula em cima da largura disponível.
 */

interface DrawMarkProps {
  /** Quantas casas tem o lado do tabuleiro (3 no normal, 4 no BigBoard). */
  boardCells: number;
  cellSize: number;
  gap: number;
  padding: number;
}

const STROKE_MS = 260;
const SECOND_DELAY = 190;
const SETTLE_MS = 820;

const DrawMark: React.FC<DrawMarkProps> = ({ boardCells, cellSize, gap, padding }) => {
  const def = useEquippedDrawMark();

  // O tabuleiro não informa o próprio tamanho: ele é dimensionado pelos filhos.
  // Reconstruir a caixa a partir da métrica é exato e não custa uma medição.
  const side = padding * 2 + boardCells * cellSize + (boardCells - 1) * gap;
  const inset = padding + cellSize * 0.22;

  const ax = inset;
  const ay = inset;
  const bx = side / 2;
  const by = side - inset;
  const cx = side - inset;
  const cy = inset;

  const leg = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return {
      left: x1,
      top: y1 - def.thickness / 2,
      width: Math.hypot(dx, dy),
      angle: (Math.atan2(dy, dx) * 180) / Math.PI,
      dx,
      dy,
    };
  };

  const legA = leg(ax, ay, bx, by);
  const legB = leg(bx, by, cx, cy);

  const strokeA = useSharedValue(0);
  const strokeB = useSharedValue(0);
  const settle = useSharedValue(0);

  useEffect(() => {
    strokeA.value = 0;
    strokeB.value = 0;
    settle.value = 0;
    strokeA.value = withTiming(1, { duration: STROKE_MS, easing: Easing.out(Easing.cubic) });
    strokeB.value = withDelay(
      SECOND_DELAY,
      withTiming(1, { duration: STROKE_MS, easing: Easing.out(Easing.cubic) }),
    );
    settle.value = withDelay(
      SECOND_DELAY + STROKE_MS - 60,
      withTiming(1, { duration: SETTLE_MS, easing: Easing.out(Easing.quad) }),
    );
  }, [def.id, strokeA, strokeB, settle]);

  const barA = useAnimatedStyle(() => ({
    opacity: interpolate(strokeA.value, [0, 0.1, 1], [0, 1, 1], Extrapolation.CLAMP),
    transform: [
      { rotate: `${legA.angle}deg` },
      { scaleX: strokeA.value },
      { scaleY: interpolate(settle.value, [0, 0.18, 1], [1, 1.3, 1], Extrapolation.CLAMP) },
    ],
  }), [legA.angle]);

  const barB = useAnimatedStyle(() => ({
    opacity: interpolate(strokeB.value, [0, 0.1, 1], [0, 1, 1], Extrapolation.CLAMP),
    transform: [
      { rotate: `${legB.angle}deg` },
      { scaleX: strokeB.value },
      { scaleY: interpolate(settle.value, [0, 0.18, 1], [1, 1.3, 1], Extrapolation.CLAMP) },
    ],
  }), [legB.angle]);

  // Maré: uma lâmina larga e translúcida que se abre a partir do vértice.
  const washStyle = useAnimatedStyle(() => {
    if (def.motif !== 'wash') return { opacity: 0, transform: [{ scale: 0 }] };
    return {
      opacity: interpolate(settle.value, [0, 0.25, 1], [0, 0.28, 0], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(settle.value, [0, 1], [0.3, 1.5], Extrapolation.CLAMP) }],
    };
  }, [def.motif]);

  // Três detalhes ao longo do V. Hooks escritos abertos de propósito: dentro de
  // `.map()` isso é quebra da regra dos hooks que só não estoura enquanto a
  // contagem nunca muda.
  const rises = def.motif === 'rise';
  const shards = def.motif === 'shard';
  const drips = def.motif === 'drip';

  const slot0 = useAnimatedStyle(() => {
    const s = interpolate(settle.value, [0, 1], [0, 1], Extrapolation.CLAMP);
    if (rises) {
      return {
        opacity: interpolate(s, [0, 0.15, 0.7, 1], [0, 0.9, 0.5, 0], Extrapolation.CLAMP),
        transform: [
          { translateY: interpolate(s, [0, 1], [0, -26], Extrapolation.CLAMP) },
          { scale: interpolate(s, [0, 1], [0.6, 1.4], Extrapolation.CLAMP) },
          { rotate: '0deg' },
        ],
      };
    }
    if (drips) {
      return {
        opacity: interpolate(s, [0, 0.12, 0.65, 1], [0, 1, 0.9, 0], Extrapolation.CLAMP),
        transform: [
          { translateY: interpolate(s, [0, 1], [0, 20], Extrapolation.CLAMP) },
          { scale: interpolate(s, [0, 0.2, 1], [0.4, 1, 1.3], Extrapolation.CLAMP) },
          { rotate: '0deg' },
        ],
      };
    }
    if (shards) {
      return {
        opacity: interpolate(s, [0, 0.12, 1], [0, 1, 0.7], Extrapolation.CLAMP),
        transform: [
          { translateY: 0 },
          { scale: interpolate(s, [0, 0.4, 1], [0, 1.1, 1], Extrapolation.CLAMP) },
          { rotate: '34deg' },
        ],
      };
    }
    return { opacity: 0, transform: [{ translateY: 0 }, { scale: 0 }, { rotate: '0deg' }] };
  }, [rises, shards, drips]);

  const slot1 = useAnimatedStyle(() => {
    const s = interpolate(settle.value, [0.13, 1], [0, 1], Extrapolation.CLAMP);
    if (rises) {
      return {
        opacity: interpolate(s, [0, 0.15, 0.7, 1], [0, 0.9, 0.5, 0], Extrapolation.CLAMP),
        transform: [
          { translateY: interpolate(s, [0, 1], [0, -26], Extrapolation.CLAMP) },
          { scale: interpolate(s, [0, 1], [0.6, 1.4], Extrapolation.CLAMP) },
          { rotate: '0deg' },
        ],
      };
    }
    if (drips) {
      return {
        opacity: interpolate(s, [0, 0.12, 0.65, 1], [0, 1, 0.9, 0], Extrapolation.CLAMP),
        transform: [
          { translateY: interpolate(s, [0, 1], [0, 20], Extrapolation.CLAMP) },
          { scale: interpolate(s, [0, 0.2, 1], [0.4, 1, 1.3], Extrapolation.CLAMP) },
          { rotate: '0deg' },
        ],
      };
    }
    if (shards) {
      return {
        opacity: interpolate(s, [0, 0.12, 1], [0, 1, 0.7], Extrapolation.CLAMP),
        transform: [
          { translateY: 0 },
          { scale: interpolate(s, [0, 0.4, 1], [0, 1.1, 1], Extrapolation.CLAMP) },
          { rotate: '-28deg' },
        ],
      };
    }
    return { opacity: 0, transform: [{ translateY: 0 }, { scale: 0 }, { rotate: '0deg' }] };
  }, [rises, shards, drips]);

  const slot2 = useAnimatedStyle(() => {
    const s = interpolate(settle.value, [0.26, 1], [0, 1], Extrapolation.CLAMP);
    if (rises) {
      return {
        opacity: interpolate(s, [0, 0.15, 0.7, 1], [0, 0.9, 0.5, 0], Extrapolation.CLAMP),
        transform: [
          { translateY: interpolate(s, [0, 1], [0, -26], Extrapolation.CLAMP) },
          { scale: interpolate(s, [0, 1], [0.6, 1.4], Extrapolation.CLAMP) },
          { rotate: '0deg' },
        ],
      };
    }
    if (drips) {
      return {
        opacity: interpolate(s, [0, 0.12, 0.65, 1], [0, 1, 0.9, 0], Extrapolation.CLAMP),
        transform: [
          { translateY: interpolate(s, [0, 1], [0, 20], Extrapolation.CLAMP) },
          { scale: interpolate(s, [0, 0.2, 1], [0.4, 1, 1.3], Extrapolation.CLAMP) },
          { rotate: '0deg' },
        ],
      };
    }
    if (shards) {
      return {
        opacity: interpolate(s, [0, 0.12, 1], [0, 1, 0.7], Extrapolation.CLAMP),
        transform: [
          { translateY: 0 },
          { scale: interpolate(s, [0, 0.4, 1], [0, 1.1, 1], Extrapolation.CLAMP) },
          { rotate: '12deg' },
        ],
      };
    }
    return { opacity: 0, transform: [{ translateY: 0 }, { scale: 0 }, { rotate: '0deg' }] };
  }, [rises, shards, drips]);

  const hasSlots = rises || shards || drips;
  const dot = def.thickness * 0.9;

  // Espalhados pelo V: um em cada perna e um no vértice.
  const spots = [
    { left: ax + legA.dx * 0.55 - dot / 2, top: ay + legA.dy * 0.55 - dot / 2 },
    { left: bx - dot / 2, top: by - dot / 2 },
    { left: bx + legB.dx * 0.45 - dot / 2, top: by + legB.dy * 0.45 - dot / 2 },
  ];

  return (
    <View style={styles.host} pointerEvents="none">
      {def.motif === 'wash' && (
        <Animated.View
          style={[
            styles.wash,
            {
              left: bx - side * 0.4,
              top: by - side * 0.4,
              width: side * 0.8,
              height: side * 0.8,
              borderRadius: side * 0.4,
              backgroundColor: def.color,
            },
            washStyle,
          ]}
        />
      )}

      <Animated.View
        style={[
          styles.bar,
          {
            left: legA.left,
            top: legA.top,
            width: legA.width,
            height: def.thickness,
            borderRadius: def.thickness / 2,
            backgroundColor: def.accent,
          },
          barA,
        ]}
      />

      <Animated.View
        style={[
          styles.bar,
          {
            left: legB.left,
            top: legB.top,
            width: legB.width,
            height: def.thickness,
            borderRadius: def.thickness / 2,
            backgroundColor: def.accent,
          },
          barB,
        ]}
      />

      {hasSlots && (
        <>
          <Animated.View
            style={[styles.spot, spots[0], { width: dot, height: dot * (drips ? 1.6 : 1), backgroundColor: def.color }, slot0]}
          />
          <Animated.View
            style={[styles.spot, spots[1], { width: dot, height: dot * (drips ? 1.6 : 1), backgroundColor: def.accent }, slot1]}
          />
          <Animated.View
            style={[styles.spot, spots[2], { width: dot, height: dot * (drips ? 1.6 : 1), backgroundColor: def.color }, slot2]}
          />
        </>
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
  spot: {
    position: 'absolute',
    borderRadius: 999,
  },
  wash: {
    position: 'absolute',
  },
});

export default DrawMark;
