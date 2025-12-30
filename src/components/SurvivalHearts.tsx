import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

interface SurvivalHeartsProps {
  currentLives: number;
  maxLives: number;
  animated?: boolean;
}

const SurvivalHearts: React.FC<SurvivalHeartsProps> = ({ 
  currentLives, 
  maxLives, 
  animated = false 
}) => {
  const hearts = [];

  for (let i = 0; i < maxLives; i++) {
    const isFilled = i < currentLives;
    const isLastLost = i === currentLives && animated;

    hearts.push(
      <Animated.View 
        key={i} 
        style={[
          styles.heartContainer,
          isLastLost && styles.shakingHeart
        ]}
      >
        <Ionicons
          name={isFilled ? "heart" : "heart-outline"}
          size={24}
          color={isFilled ? COLORS.error : COLORS.darkGray}
          style={[
            styles.heart,
            !isFilled && styles.emptyHeart
          ]}
        />
        {/* Minecraft-style pixelated border effect */}
        <View style={[
          styles.heartBorder,
          isFilled ? styles.filledBorder : styles.emptyBorder
        ]} />
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.heartsRow}>
        {hearts}
      </View>
      {/* Minecraft-style background bar */}
      <View style={styles.backgroundBar} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  backgroundBar: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 6,
    backgroundColor: COLORS.darkGray + '40',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.darkGray + '60',
  },
  heartsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  heartContainer: {
    position: 'relative',
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heart: {
    zIndex: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  emptyHeart: {
    opacity: 0.6,
  },
  heartBorder: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    zIndex: 1,
  },
  filledBorder: {
    borderColor: COLORS.error + '80',
    backgroundColor: COLORS.error + '20',
  },
  emptyBorder: {
    borderColor: COLORS.darkGray + '60',
    backgroundColor: COLORS.darkGray + '10',
  },
  shakingHeart: {
    // Animation will be added via Animated API when life is lost
  },
});

export default SurvivalHearts;

