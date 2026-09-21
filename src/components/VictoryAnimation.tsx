import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  withSpring,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { Player } from '../types/game';
import { COLORS, getPlayerColor } from '../utils/theme';
import { useEquippedEffect } from '../hooks/useEquippedItems';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
}

interface VictoryAnimationProps {
  winner: Player;
  onComplete?: () => void;
  duration?: number;
}

const VictoryAnimation: React.FC<VictoryAnimationProps> = ({
  winner,
  onComplete,
  duration = 3000,
}) => {
  const equippedEffect = useEquippedEffect();
  const animationType = equippedEffect?.animationType || 'sparkles';

  if (animationType === 'fireworks') {
    return <FireworksAnimation onComplete={onComplete} />;
  }
  if (animationType === 'stars') {
    return <StarsAnimation onComplete={onComplete} duration={duration} colors={equippedEffect?.colors} />;
  }
  // sparkles + confetti share the same particle base
  return <ConfettiAnimation winner={winner} onComplete={onComplete} duration={duration} colors={equippedEffect?.colors} />;
};

// Stars animation — falling star emojis with golden glow
const StarsAnimation: React.FC<{
  onComplete?: () => void;
  duration: number;
  colors?: string[];
}> = ({ onComplete, duration, colors }) => {
  const palette = colors && colors.length ? colors : ['#FFD700', '#FFA500', '#FFECB3'];
  const stars = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    delay: Math.random() * 1500,
    size: 18 + Math.random() * 18,
    color: palette[i % palette.length],
    rotateDeg: Math.random() * 360,
    char: i % 3 === 0 ? '⭐' : i % 3 === 1 ? '✨' : '🌟',
  }));

  useEffect(() => {
    if (onComplete) {
      const timeout = setTimeout(onComplete, duration);
      return () => clearTimeout(timeout);
    }
  }, [duration, onComplete]);

  return (
    <View style={styles.container} pointerEvents="none">
      {stars.map((s) => (
        <FallingStar key={s.id} {...s} />
      ))}
    </View>
  );
};

const FallingStar: React.FC<{
  x: number;
  delay: number;
  size: number;
  color: string;
  rotateDeg: number;
  char: string;
}> = ({ x, delay, size, color, rotateDeg, char }) => {
  const translateY = useSharedValue(-50);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    translateY.value = withDelay(delay, withTiming(height + 50, { duration: 2500, easing: Easing.in(Easing.quad) }));
    rotate.value = withDelay(delay, withRepeat(withTiming(360, { duration: 1200 }), -1, false));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: `${rotate.value + rotateDeg}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.star, { left: x }, animStyle]}>
      <Text style={{ fontSize: size, color, textShadowColor: color, textShadowRadius: 8 }}>
        {char}
      </Text>
    </Animated.View>
  );
};

// Separate component for confetti animation to avoid hook issues
const ConfettiAnimation: React.FC<{
  winner: Player;
  onComplete?: () => void;
  duration: number;
  colors?: string[];
}> = ({ winner, onComplete, duration, colors }) => {
  const particles: Particle[] = [];
  const particleCount = 20;

  // Generate particles
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      id: i,
      x: Math.random() * width,
      y: height + Math.random() * 100,
      size: 8 + Math.random() * 16,
      color: Math.random() > 0.5 ? getPlayerColor(winner) : COLORS.gold,
      delay: Math.random() * 1000,
    });
  }

  const animationProgress = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Start the animation sequence
    scale.value = withSequence(
      withTiming(1.2, { duration: 500 }),
      withTiming(1, { duration: 200 })
    );

    rotation.value = withSequence(
      withTiming(360, { duration: 1000 }),
      withTiming(0, { duration: 500 })
    );

    animationProgress.value = withTiming(1, { duration }, (finished) => {
      if (finished && onComplete) {
        runOnJS(onComplete)();
      }
    });
  }, [duration, onComplete, scale, rotation, animationProgress]);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Winner Symbol */}
      <Animated.View style={[styles.centerSymbol, useAnimatedStyle(() => ({
        transform: [
          { scale: scale.value },
          { rotate: `${rotation.value}deg` }
        ],
        opacity: interpolate(animationProgress.value, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
      }))]}>
        <Animated.Text style={[
          styles.symbolText,
          { color: getPlayerColor(winner) }
        ]}>
          {winner === 'X' ? '✗' : '○'}
        </Animated.Text>
      </Animated.View>

      {/* Particles */}
      {particles.map((particle) => (
        <ParticleComponent
          key={particle.id}
          particle={particle}
          animationProgress={animationProgress}
        />
      ))}

      {/* Confetti */}
      <ConfettiOverlay
        animationProgress={animationProgress}
        winner={winner}
        colors={colors}
      />
    </View>
  );
};

// Individual particle component
const ParticleComponent: React.FC<{
  particle: Particle;
  animationProgress: SharedValue<number>;
}> = ({ particle, animationProgress }) => {
  // `top` e prop de LAYOUT. A Reanimated aplica prop animada clonando e
  // commitando a shadow tree, entao animar `top` dispara um passo de layout da
  // tela inteira a cada quadro — vezes 35 elementos, em TODA vitoria.
  // `translateY` faz o mesmo caminho e nao custa layout nenhum.
  // O que nao muda (tamanho, cor, raio) tambem saiu do worklet: devolver valor
  // estatico 60 vezes por segundo so gera trabalho de diffing.
  const animatedStyle = useAnimatedStyle(() => {
    const progress = animationProgress.value;

    return {
      opacity: interpolate(progress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]),
      transform: [
        { translateY: interpolate(progress, [0, 1], [0, -height * 1.5]) },
        { scale: interpolate(progress, [0, 0.5, 1], [0, 1, 0.5]) },
        { rotate: `${interpolate(progress, [0, 1], [0, 720])}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.floater,
        {
          left: particle.x,
          top: particle.y,
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          borderRadius: particle.size / 2,
        },
        animatedStyle,
      ]}
    />
  );
};

interface ConfettiSpec {
  id: number;
  x: number;
  startY: number;
  travel: number;
  rotation: number;
  color: string;
  delay: number;
}

// Um papel picado. Componente de verdade, e nao um `useAnimatedStyle` dentro de
// `.map()`: aquilo e quebra da regra dos hooks que so nao estoura enquanto a
// contagem de itens nunca muda.
const ConfettiPiece: React.FC<{
  piece: ConfettiSpec;
  animationProgress: SharedValue<number>;
}> = ({ piece, animationProgress }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const progress = animationProgress.value;
    const delayed = Math.max(0, progress - piece.delay / 2000);

    return {
      opacity: interpolate(delayed, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
      transform: [
        { translateY: interpolate(delayed, [0, 1], [0, piece.travel]) },
        { rotate: `${interpolate(delayed, [0, 1], [0, piece.rotation + 720])}deg` },
        { scale: interpolate(delayed, [0, 0.3, 0.7, 1], [0, 1, 1, 0.3]) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        { left: piece.x, top: piece.startY, backgroundColor: piece.color },
        animatedStyle,
      ]}
    />
  );
};

// Confetti overlay component
const ConfettiOverlay: React.FC<{
  animationProgress: SharedValue<number>;
  winner: Player;
  colors?: string[];
}> = ({ animationProgress, winner, colors }) => {
  // Sorteado UMA vez. Como isto morava no corpo do componente, qualquer
  // re-render teletransportava os papeis para posicoes novas no meio da queda.
  const confettiPieces = React.useMemo<ConfettiSpec[]>(() => {
    const defaultColors = [getPlayerColor(winner), COLORS.gold, COLORS.yellow];
    const effectColors = colors && colors.length > 0 ? colors : defaultColors;

    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      startY: -50,
      travel: height + 150,
      rotation: Math.random() * 360,
      color: effectColors[i % effectColors.length],
      delay: Math.random() * 500,
    }));
  }, [winner, colors]);

  return (
    <>
      {confettiPieces.map(piece => (
        <ConfettiPiece key={piece.id} piece={piece} animationProgress={animationProgress} />
      ))}
    </>
  );
};

// Fireworks effect
export const FireworksAnimation: React.FC<{
  onComplete?: () => void;
}> = ({ onComplete }) => {
  const explosions = [];
  const explosionCount = 5;

  for (let i = 0; i < explosionCount; i++) {
    explosions.push({
      id: i,
      x: 100 + Math.random() * (width - 200),
      y: 100 + Math.random() * (height - 300),
      delay: i * 300,
    });
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {explosions.map((explosion, index) => (
        <ExplosionEffect
          key={explosion.id}
          x={explosion.x}
          y={explosion.y}
          delay={explosion.delay}
          isLast={index === explosions.length - 1}
          onComplete={index === explosions.length - 1 ? onComplete : undefined}
        />
      ))}
    </View>
  );
};

// Individual explosion effect
// Uma faisca da explosao. Extraida do `.map()` pelo mesmo motivo do confete —
// e `left`/`top` viraram translate: posicao por layout custava um passo de
// layout por quadro, vezes 8 faiscas por explosao, vezes 5 explosoes.
const Sparkle: React.FC<{
  sparkle: { angle: number; distance: number; color: string };
  explosionProgress: SharedValue<number>;
}> = ({ sparkle, explosionProgress }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const progress = explosionProgress.value;
    const radians = (sparkle.angle * Math.PI) / 180;
    const distance = interpolate(progress, [0, 1], [0, sparkle.distance]);

    return {
      opacity: interpolate(progress, [0, 0.3, 1], [0, 1, 0]),
      transform: [
        { translateX: Math.cos(radians) * distance },
        { translateY: Math.sin(radians) * distance },
        { scale: interpolate(progress, [0, 0.5, 1], [0, 1, 0]) },
      ],
    };
  });

  return <Animated.View style={[styles.sparkle, { backgroundColor: sparkle.color }, animatedStyle]} />;
};

const ExplosionEffect: React.FC<{
  x: number;
  y: number;
  delay: number;
  isLast: boolean;
  onComplete?: () => void;
}> = ({ x, y, delay, isLast, onComplete }) => {
  const sparkles = [];
  const sparkleCount = 8;

  for (let i = 0; i < sparkleCount; i++) {
    const angle = (i * 360) / sparkleCount;
    sparkles.push({
      id: i,
      angle,
      distance: 50 + Math.random() * 50,
      color: [COLORS.gold, COLORS.yellow, COLORS.xColor, COLORS.oColor][i % 4],
    });
  }

  const explosionProgress = useSharedValue(0);

  React.useEffect(() => {
    explosionProgress.value = withDelay(
      delay,
      withTiming(1, { duration: 1000 }, (finished) => {
        if (finished && isLast && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, [delay, explosionProgress, isLast, onComplete]);

  return (
    <View style={[styles.explosion, { left: x, top: y }]}>
      {sparkles.map(sparkle => (
        <Sparkle key={sparkle.id} sparkle={sparkle} explosionProgress={explosionProgress} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  floater: {
    position: 'absolute',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
  },
  sparkle: {
    position: 'absolute',
    left: -4,
    top: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  star: {
    position: 'absolute',
    top: 0,
  },
  centerSymbol: {
    position: 'absolute',
    top: height / 2 - 50,
    left: width / 2 - 50,
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    fontSize: 80,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  explosion: {
    position: 'absolute',
    width: 1,
    height: 1,
  },
});

export default VictoryAnimation;
