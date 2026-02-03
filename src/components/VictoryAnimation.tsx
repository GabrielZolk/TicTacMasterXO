import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
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

  // Determine animation type from equipped effect
  const animationType = equippedEffect?.animationType || 'confetti';
  console.log('🎆 [VictoryAnimation] Equipped effect:', equippedEffect);
  console.log('🎆 [VictoryAnimation] Animation type:', animationType);

  // If fireworks effect is equipped, show fireworks component
  if (animationType === 'fireworks') {
    return <FireworksAnimation onComplete={onComplete} />;
  }

  // Default: confetti/sparkles animation with particles
  return <ConfettiAnimation winner={winner} onComplete={onComplete} duration={duration} colors={equippedEffect?.colors} />;
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
  animationProgress: Animated.SharedValue<number>;
}> = ({ particle, animationProgress }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const progress = animationProgress.value;
    
    return {
      position: 'absolute',
      left: particle.x,
      top: interpolate(
        progress,
        [0, 1],
        [particle.y, particle.y - height * 1.5]
      ),
      width: particle.size,
      height: particle.size,
      backgroundColor: particle.color,
      borderRadius: particle.size / 2,
      opacity: interpolate(progress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]),
      transform: [
        {
          scale: interpolate(progress, [0, 0.5, 1], [0, 1, 0.5])
        },
        {
          rotate: `${interpolate(progress, [0, 1], [0, 720])}deg`
        }
      ],
    };
  });

  return <Animated.View style={animatedStyle} />;
};

// Confetti overlay component
const ConfettiOverlay: React.FC<{
  animationProgress: Animated.SharedValue<number>;
  winner: Player;
  colors?: string[];
}> = ({ animationProgress, winner, colors }) => {
  const confettiPieces = [];
  const confettiCount = 15;

  // Use custom colors if provided, otherwise use defaults
  const defaultColors = [getPlayerColor(winner), COLORS.gold, COLORS.yellow];
  const effectColors = colors && colors.length > 0 ? colors : defaultColors;

  for (let i = 0; i < confettiCount; i++) {
    confettiPieces.push({
      id: i,
      x: Math.random() * width,
      startY: -50,
      endY: height + 100,
      rotation: Math.random() * 360,
      color: effectColors[i % effectColors.length],
      delay: Math.random() * 500,
    });
  }

  return (
    <>
      {confettiPieces.map((piece, index) => {
        const confettiStyle = useAnimatedStyle(() => {
          const progress = animationProgress.value;
          const delayedProgress = Math.max(0, progress - (piece.delay / 2000));
          
          return {
            position: 'absolute',
            left: piece.x,
            top: interpolate(delayedProgress, [0, 1], [piece.startY, piece.endY]),
            width: 8,
            height: 8,
            backgroundColor: piece.color,
            opacity: interpolate(delayedProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
            transform: [
              {
                rotate: `${interpolate(delayedProgress, [0, 1], [0, piece.rotation + 720])}deg`
              },
              {
                scale: interpolate(delayedProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0.3])
              }
            ],
          };
        });

        return <Animated.View key={piece.id} style={confettiStyle} />;
      })}
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
      {sparkles.map((sparkle) => {
        const sparkleStyle = useAnimatedStyle(() => {
          const progress = explosionProgress.value;
          const radians = (sparkle.angle * Math.PI) / 180;
          const currentDistance = interpolate(progress, [0, 1], [0, sparkle.distance]);

          return {
            position: 'absolute',
            left: Math.cos(radians) * currentDistance - 4,
            top: Math.sin(radians) * currentDistance - 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: sparkle.color,
            opacity: interpolate(progress, [0, 0.3, 1], [0, 1, 0]),
            transform: [
              {
                scale: interpolate(progress, [0, 0.5, 1], [0, 1, 0])
              }
            ],
          };
        });

        return <Animated.View key={sparkle.id} style={sparkleStyle} />;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
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
