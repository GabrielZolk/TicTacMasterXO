import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, BORDER_RADIUS, createTextStyle, SHADOWS } from '../utils/theme';

interface TrollMessageProps {
  message: string;
  onDismiss: () => void;
}

const TrollMessage: React.FC<TrollMessageProps> = ({ message, onDismiss }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-50);
  const scale = useSharedValue(0.8);

  React.useEffect(() => {
    // Animate in
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withSpring(0, { damping: 12 });
    scale.value = withSpring(1, { damping: 10 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  const handleDismiss = () => {
    // Animate out
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(-30, { duration: 200 });
    scale.value = withTiming(0.9, { duration: 200 });
    
    setTimeout(onDismiss, 200);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View style={[styles.messageCard, animatedStyle]}>
        <View style={styles.aiIndicator}>
          <Ionicons name="hardware-chip" size={20} color={COLORS.oColor} />
          <Text style={styles.aiLabel}>Troll AI</Text>
        </View>
        
        <Text style={styles.messageText}>{message}</Text>
        
        <TouchableOpacity 
          onPress={handleDismiss} 
          style={styles.dismissButton}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={16} color={COLORS.gray} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  messageCard: {
    backgroundColor: COLORS.darkSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.oColor + '60',
    ...SHADOWS.heavy,
    position: 'relative',
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  aiLabel: {
    ...createTextStyle('xs', 'bold'),
    color: COLORS.oColor,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageText: {
    ...createTextStyle('sm', 'medium'),
    color: COLORS.white,
    lineHeight: 20,
    paddingRight: SPACING.lg, // Make space for dismiss button
  },
  dismissButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkTertiary,
  },
});

export default TrollMessage;
