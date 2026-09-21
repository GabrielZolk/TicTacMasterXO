import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TextStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  interpolate,
  interpolateColor,
  Easing,
  Extrapolation,
} from 'react-native-reanimated';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

import { SymbolStyle } from '../hooks/useEquippedItems';

/**
 * Os pacotes Fogo, Gelo, Neon, Matrix e Ouro sempre prometeram movimento e
 * nunca entregaram: desenhavam o mesmo X e O do pacote gratuito, so que
 * coloridos. Aqui eles passam a se comportar como a coisa que nomeiam —
 * a linguagem "materia viva".
 *
 * Regras de custo, porque isto roda em ate 9 celulas ao mesmo tempo num
 * aparelho de entrada:
 *
 *  - UM unico shared value por peca, girando em laco linear. Toda a
 *    irregularidade sai de `interpolate` dentro do worklet, nao de varios
 *    temporizadores empilhados.
 *  - So `transform`, `opacity` e `color`. Sao as tres coisas que a Reanimated
 *    aplica sem encostar no layout.
 *  - `textShadow*` fica ESTATICO. Ele ate e animavel no Android, mas entra na
 *    chave do cache de medicao do paragrafo: animar ele invalidaria a medida do
 *    glifo a cada quadro para mudar uma coisa que nem muda de tamanho.
 *  - Nada de SVG aqui. No Android o react-native-svg rasteriza em software e
 *    joga fora o bitmap inteiro a cada mudanca de propriedade.
 */

/** Quanto tempo cada materia leva para respirar uma vez. */
const CYCLE_MS: Partial<Record<SymbolStyle, number>> = {
  fire: 950,
  ice: 2400,
  neon: 3200,
  matrix: 1900,
  gold: 2600,
};

/** Tom quente para onde a chama sobe no pico do ciclo. */
const FIRE_ACCENT = '#FFC24A';

/** O corpo do metal: claro em cima, escuro embaixo. O reflexo passa por cima. */
const GOLD_BODY = ['#FFE082', '#FFC107', '#A9741C'] as const;

export const hasPieceMotion = (style: SymbolStyle): boolean => CYCLE_MS[style] !== undefined;

interface AnimatedPieceProps {
  symbol: string;
  /** Cor ja resolvida pela celula (inclui o dourado da vitoria). */
  color: string;
  symbolStyle: SymbolStyle;
  textStyle: StyleProp<TextStyle>;
  /** Corpo do glifo em dp. Tambem dimensiona a mascara do Ouro. */
  fontSize: number;
  /** A vitoria pinta tudo de dourado; a cor nao pode ficar oscilando por cima. */
  isWinning: boolean;
}

const AnimatedPiece: React.FC<AnimatedPieceProps> = ({
  symbol,
  color,
  symbolStyle,
  textStyle,
  fontSize,
  isWinning,
}) => {
  const t = useSharedValue(0);
  const duration = CYCLE_MS[symbolStyle];

  // Caixa que contem o glifo. A mascara precisa de tamanho explicito — ela nao
  // pode se medir pelo filho — entao ele vem do corpo da fonte.
  const box = fontSize * 1.3;

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

  const motionStyle = useAnimatedStyle(() => {
    const p = t.value;

    switch (symbolStyle) {
      // A chama nunca sobe reta: puxa para cima, cede, puxa de novo, e o tom
      // esquenta no pico. O scaleY e o que da a sensacao de lingua de fogo.
      case 'fire':
        return {
          transform: [
            { translateY: interpolate(p, [0, 0.22, 0.47, 0.71, 1], [0, -1.6, 0.6, -1, 0]) },
            { scaleY: interpolate(p, [0, 0.22, 0.47, 0.71, 1], [1, 1.06, 0.97, 1.03, 1]) },
          ],
          color: isWinning
            ? color
            : interpolateColor(
                p,
                [0, 0.22, 0.47, 0.71, 1],
                [color, FIRE_ACCENT, color, FIRE_ACCENT, color],
              ),
        };

      // Gelo respira devagar e quase nao sai do lugar.
      case 'ice':
        return {
          transform: [{ scale: interpolate(p, [0, 0.5, 1], [1, 1.045, 1]) }],
        };

      // Tubo de neon com mau contato: quedas curtas e desalinhadas no comeco do
      // ciclo, uma reincidencia perto do fim, e o resto do tempo aceso.
      case 'neon':
        return {
          opacity: interpolate(
            p,
            [0, 0.06, 0.09, 0.13, 0.17, 0.8, 0.86, 1],
            [1, 0.3, 1, 0.42, 1, 1, 0.55, 1],
            Extrapolation.CLAMP,
          ),
        };

      // O glifo escurece de leve quando a varredura passa por cima dele.
      case 'matrix':
        return {
          opacity: interpolate(p, [0, 0.5, 1], [1, 0.82, 1]),
        };

      default:
        return {};
    }
  }, [symbolStyle, color, isWinning]);

  // Brilho por tras do glifo. Existe porque `textShadowRadius` nao pode pulsar
  // de graca — uma View com opacidade e escala faz o mesmo efeito e nao toca no
  // layout nem na medicao do texto.
  const auraStyle = useAnimatedStyle(() => {
    const p = t.value;

    if (symbolStyle === 'fire') {
      return {
        opacity: interpolate(p, [0, 0.22, 0.47, 0.71, 1], [0.16, 0.34, 0.12, 0.3, 0.16]),
        transform: [{ scale: interpolate(p, [0, 0.22, 0.47, 0.71, 1], [1, 1.18, 0.94, 1.12, 1]) }],
      };
    }
    if (symbolStyle === 'neon') {
      // Em contrafase com o glifo: quando o tubo falha, o halo some junto.
      return {
        opacity: interpolate(
          p,
          [0, 0.06, 0.09, 0.13, 0.17, 0.8, 0.86, 1],
          [0.24, 0.05, 0.26, 0.07, 0.24, 0.24, 0.09, 0.24],
          Extrapolation.CLAMP,
        ),
        transform: [{ scale: 1 }],
      };
    }
    if (symbolStyle === 'gold') {
      // A mascara come o textShadow do Ouro; este halo devolve o calor.
      return { opacity: 0.18, transform: [{ scale: 1 }] };
    }
    return { opacity: 0, transform: [{ scale: 1 }] };
  }, [symbolStyle]);

  // Duas farpas de gelo, fora de fase uma com a outra. Escritas abertas de
  // proposito: `useAnimatedStyle` dentro de funcao auxiliar ou de `.map()` e
  // quebra da regra dos hooks — passa despercebido enquanto a contagem nao
  // muda e quebra no dia em que mudar.
  const frostA = useAnimatedStyle(() => {
    if (symbolStyle !== 'ice') return { opacity: 0, transform: [{ translateY: 0 }] };
    const p = t.value;
    return {
      opacity: interpolate(p, [0, 0.55, 1], [0.15, 0.85, 0.15]),
      transform: [{ translateY: interpolate(p, [0, 0.55, 1], [4, -1, 4]) }],
    };
  }, [symbolStyle]);

  const frostB = useAnimatedStyle(() => {
    if (symbolStyle !== 'ice') return { opacity: 0, transform: [{ translateY: 0 }] };
    const p = (t.value + 0.33) % 1;
    return {
      opacity: interpolate(p, [0, 0.55, 1], [0.15, 0.85, 0.15]),
      transform: [{ translateY: interpolate(p, [0, 0.55, 1], [4, -1, 4]) }],
    };
  }, [symbolStyle]);

  // Reflexo do Ouro: um lampejo rapido e depois descanso. Brilho continuo vira
  // ruido; o que faz parecer metal e o intervalo entre um reflexo e o proximo.
  const shineStyle = useAnimatedStyle(() => {
    if (symbolStyle !== 'gold') {
      return { opacity: 0, transform: [{ translateX: 0 }, { rotate: '0deg' }] };
    }
    const p = t.value;
    return {
      opacity: interpolate(p, [0, 0.05, 0.28, 0.36, 1], [0, 0.95, 0.95, 0, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(p, [0, 0.36, 1], [-box, box, box], Extrapolation.CLAMP) },
        { rotate: '16deg' },
      ],
    };
  }, [symbolStyle, box]);

  const auraColor = symbolStyle === 'fire' ? '#FF6A00' : symbolStyle === 'gold' ? '#FFB300' : '#FF00FF';
  const showAura = symbolStyle === 'fire' || symbolStyle === 'neon' || symbolStyle === 'gold';

  // Ouro recorta o brilho NA FORMA do glifo. So vale a pena fora da vitoria:
  // quando a peca esta vencendo ela ja e dourada por cima de tudo, e a mascara
  // engoliria justamente essa leitura.
  const masked = symbolStyle === 'gold' && !isWinning;

  return (
    <View style={styles.wrap}>
      {showAura && (
        <Animated.View
          pointerEvents="none"
          style={[styles.aura, { backgroundColor: auraColor }, auraStyle]}
        />
      )}

      {symbolStyle === 'ice' && (
        <>
          <Animated.Text pointerEvents="none" style={[styles.frost, styles.frostA, frostA]}>
            ✦
          </Animated.Text>
          <Animated.Text pointerEvents="none" style={[styles.frost, styles.frostB, frostB]}>
            ✦
          </Animated.Text>
        </>
      )}

      {masked ? (
        <MaskedView
          style={{ width: box, height: box }}
          maskElement={
            <View style={styles.maskHost}>
              <Text style={[textStyle, { fontSize, color: '#000', textShadowRadius: 0 }]}>
                {symbol}
              </Text>
            </View>
          }
        >
          <LinearGradient
            colors={GOLD_BODY}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View
            style={[styles.shine, { width: box * 0.4, height: box * 2, top: -box * 0.5 }, shineStyle]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,251,232,0.95)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </MaskedView>
      ) : (
        <Animated.Text style={[textStyle, { fontSize, color }, motionStyle]}>{symbol}</Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  aura: {
    position: 'absolute',
    left: -12,
    right: -12,
    top: -12,
    bottom: -12,
    borderRadius: 999,
  },
  frost: {
    position: 'absolute',
    fontSize: 10,
    color: '#00D9FF',
  },
  frostA: {
    top: -10,
    left: -12,
  },
  frostB: {
    bottom: -10,
    right: -12,
  },
  maskHost: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shine: {
    position: 'absolute',
    left: 0,
  },
});

export default AnimatedPiece;
