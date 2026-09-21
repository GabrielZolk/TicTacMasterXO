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
 * Varredura por cima da celula, para o pacote cuja materia nao mora no glifo e
 * sim na luz que passa por ele: Matrix, a chuva verde descendo.
 *
 * E uma faixa de gradiente movida por `translate` dentro de um recorte —
 * exatamente o que o tema Copa Nick ja faz em todas as celulas hoje. Transform
 * puro: nao aloca nada, nao mede nada, nao encosta no layout.
 *
 * Fica FORA do envelope da peca de proposito: a varredura pertence a celula,
 * nao ao simbolo, entao ela nao gira nem escala junto quando a peca entra.
 *
 * O Ouro morava aqui e mudou para o AnimatedPiece, onde o reflexo e recortado
 * na forma do glifo. Dois brilhos na mesma celula viravam ruido.
 */

const CYCLE_MS: Partial<Record<SymbolStyle, number>> = {
  matrix: 1900,
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
    return {
      opacity: interpolate(p, [0, 0.12, 0.88, 1], [0, 1, 1, 0], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(p, [0, 1], [-size * 0.7, size * 1.1]) }],
    };
  }, [size]);

  if (!duration) return null;

  return (
    <View style={[styles.clip, { borderRadius }]} pointerEvents="none">
      <Animated.View style={[styles.bar, { width: size, height: size * 0.45 }, barStyle]}>
        <LinearGradient
          colors={['rgba(0,255,65,0)', 'rgba(0,255,65,0.45)', 'rgba(0,255,65,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
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
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

export default SymbolSweep;
