import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSequence,
  withDelay,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

import { 
  COLORS, 
  SPACING, 
  BORDER_RADIUS, 
  createTextStyle,
  SHADOWS,
} from '../utils/theme';

interface SurvivalLivesProps {
  lives: number;
  maxLives: number;
  consecutiveWins: number;
  onLifeLost?: () => void;
}

const SurvivalLives: React.FC<SurvivalLivesProps> = ({
  lives,
  maxLives,
  consecutiveWins,
  onLifeLost,
}) => {
  const shakeAnimation = useSharedValue(0);
  const scaleAnimation = useSharedValue(1);

  useEffect(() => {
    if (lives < maxLives) {
      // Shake effect when life is lost
      shakeAnimation.value = withSequence(
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      
      // Scale effect
      scaleAnimation.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
    }
  }, [lives]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeAnimation.value },
      { scale: scaleAnimation.value }
    ],
  }));

  const getLivesColor = () => {
    if (lives <= 1) return COLORS.error;
    if (lives === 2) return COLORS.warning;
    return COLORS.success;
  };

  const renderHearts = () => {
    const hearts = [];
    
    for (let i = 0; i < maxLives; i++) {
      const isActive = i < lives;
      
      hearts.push(
        <Animated.View
          key={i}
          style={[
            styles.heart,
            { backgroundColor: isActive ? getLivesColor() + '20' : COLORS.darkGray + '20' }
          ]}
          entering={FadeIn.delay(i * 100)}
        >
          <Text style={[
            styles.heartEmoji,
            { opacity: isActive ? 1 : 0.3 }
          ]}>
            {isActive ? '❤️' : '🤍'}
          </Text>
        </Animated.View>
      );
    }
    
    return hearts;
  };

  const getStatusMessage = () => {
    if (lives <= 1) return '⚠️ Última chance!';
    if (lives === 2) return '⚡ Cuidado!';
    if (consecutiveWins >= 5) return '🔥 Em chamas!';
    if (consecutiveWins >= 3) return '✨ Sequência!';
    return '💪 Sobreviva!';
  };

  const getStatusColor = () => {
    if (lives <= 1) return COLORS.error;
    if (lives === 2) return COLORS.warning;
    if (consecutiveWins >= 3) return COLORS.gold;
    return COLORS.white;
  };

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <View style={styles.header}>
        <Text style={styles.title}>❤️ Modo Sobrevivência</Text>
        <Text style={[styles.status, { color: getStatusColor() }]}>
          {getStatusMessage()}
        </Text>
      </View>

      <View style={styles.livesContainer}>
        <Text style={styles.livesLabel}>Vidas:</Text>
        <View style={styles.heartsRow}>
          {renderHearts()}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{consecutiveWins}</Text>
          <Text style={styles.statLabel}>Vitórias Seguidas</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: getLivesColor() }]}>
            {lives}/{maxLives}
          </Text>
          <Text style={styles.statLabel}>Vidas Restantes</Text>
        </View>
      </View>

      {lives <= 1 && (
        <Animated.View 
          style={styles.warningContainer}
          entering={FadeIn.duration(300)}
        >
          <Text style={styles.warningText}>
            💀 Game Over na próxima derrota! 💀
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.darkSecondary + 'CC',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.error + '40',
    ...SHADOWS.medium,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    ...createTextStyle('md', 'bold'),
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  status: {
    ...createTextStyle('sm', 'semibold'),
    textAlign: 'center',
  },
  livesContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  livesLabel: {
    ...createTextStyle('sm', 'medium'),
    color: COLORS.lightGray,
    marginBottom: SPACING.xs,
  },
  heartsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  heart: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.error + '40',
  },
  heartEmoji: {
    fontSize: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...createTextStyle('lg', 'bold'),
    color: COLORS.white,
  },
  statLabel: {
    ...createTextStyle('xs', 'regular'),
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.gray,
    marginHorizontal: SPACING.sm,
  },
  warningContainer: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.error + '20',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  warningText: {
    ...createTextStyle('xs', 'bold'),
    color: COLORS.error,
    textAlign: 'center',
  },
});

export default SurvivalLives;

