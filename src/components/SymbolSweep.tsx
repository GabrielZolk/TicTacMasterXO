import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  interpolate,
  Easing,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { SymbolStyle } from '../hooks/useEquippedItems';
import { GAME_DIMENSIONS } from '../utils/theme';

/**
 * Varredura por cima da celula, para os dois pacotes cuja materia nao mora no
 * glifo e sim na luz que passa por ele: Matrix (a chuva verde descendo) e Ouro
 * (a folha de ouro pegando a luz de lado).
 *
 * E uma faixa de gradiente movida por `translate` dentro de um recorte —
 * exatamente o que o tema Copa Nick ja faz em todas as celulas hoje. Transform
 * puro: nao aloca nada, nao mede nada, nao encosta no layout.
 *
 * Fica FORA do envelope da peca de proposito: a varredura pertence a celula,
 * nao ao simbolo, entao ela nao gira nem escala junto quando a peca entra.
 */

const CYCLE_MS: Partial<Record<SymbolStyle, number>> = {
  matrix: 1900,
  gold: 2600,
};

export const hasSymbolSweep = (style: SymbolStyle): boolean => CYCLE_MS[style] !== undefined;

interface SymbolSweepProps {
  symbolStyle: SymbolStyle;
  borderRadius: number;
}

const SymbolSweep: React.FC<SymbolSweepProps> = ({ symbolStyle, borderRadius }) => {
  const t = useSharedValue(0);
  const duration = CYCLE_MS[symbolStyle];
  const size = GAME_DIMENSIONS.cellSize;

  useEffect(() => {
    if (!duration) {
      cancelAnimation(t);
      t.value = 0;
      return;
    }
    t.value = 0;
    t.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(t);
  }, [duration, t]);

  const barStyle = useAnimatedStyle(() => {
    const p = t.value;

    // Matrix: desce sem parar, como a chuva de caracteres.
    if (symbolStyle === 'matrix') {
      return {
        opacity: interpolate(p, [0, 0.12, 0.88, 1], [0, 1, 1, 0], Extrapolation.CLAMP),
        transform: [
          { rotate: '0deg' },
          { translateY: interpolate(p, [0, 1], [-size * 0.7, size * 1.1]) },
        ],
      };
    }

    // Ouro: um lampejo rapido e depois descanso. Brilho continuo vira ruido;
    // o que faz parecer metal e o intervalo entre um reflexo e o proximo.
    return {
      opacity: interpolate(p, [0, 0.05, 0.3, 0.38, 1], [0, 0.9, 0.9, 0, 0], Extrapolation.CLAMP),
      transform: [
        { rotate: '18deg' },
        { translateX: interpolate(p, [0, 0.38, 1], [-size * 1.1, size * 1.1, size * 1.1]) },
      ],
    };
  }, [symbolStyle, size]);

  if (!duration) return null;

  const isMatrix = symbolStyle === 'matrix';

  return (
    <View style={[styles.clip, { borderRadius }]} pointerEvents="none">
      <Animated.View
        style={[
          isMatrix ? styles.barHorizontal : styles.barDiagonal,
          isMatrix
            ? { height: size * 0.45, width: size }
            : { width: size * 0.34, height: size * 2 },
          barStyle,
        ]}
      >
        <LinearGradient
          colors={
            isMatrix
              ? ['rgba(0,255,65,0)', 'rgba(0,255,65,0.45)', 'rgba(0,255,65,0)']
              : ['rgba(255,255,255,0)', 'rgba(255,246,201,0.55)', 'rgba(255,255,255,0)']
          }
          start={isMatrix ? { x: 0.5, y: 0 } : { x: 0, y: 0.5 }}
          end={isMatrix ? { x: 0.5, y: 1 } : { x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  clip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  barHorizontal: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  barDiagonal: {
    position: 'absolute',
    left: 0,
    top: '-50%',
  },
});

export default SymbolSweep;
