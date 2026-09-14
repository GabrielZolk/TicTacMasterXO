import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withSpring,
    withDelay,
    withRepeat,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createTextStyle } from '../utils/theme';
import { useI18n } from '../i18n/useI18n';

const { width, height } = Dimensions.get('window');

interface LevelUpAnimationProps {
    visible: boolean;
    newLevel: number;
    onClose: () => void;
}

const Spark: React.FC<{ delay: number; angle: number; distance: number }> = ({ delay, angle, distance }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withDelay(
            delay,
            withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) })
        );
    }, []);

    const style = useAnimatedStyle(() => {
        const dx = Math.cos(angle) * distance * progress.value;
        const dy = Math.sin(angle) * distance * progress.value;
        return {
            transform: [
                { translateX: dx },
                { translateY: dy },
                { scale: 1 - progress.value * 0.5 },
            ],
            opacity: 1 - progress.value,
        };
    });

    return (
        <Animated.Text style={[styles.spark, style]}>✨</Animated.Text>
    );
};

const LevelUpAnimation: React.FC<LevelUpAnimationProps> = ({ visible, newLevel, onClose }) => {
    const { t } = useI18n();
    const badgeScale = useSharedValue(0);
    const badgeRotation = useSharedValue(0);
    const titleOpacity = useSharedValue(0);
    const ringScale = useSharedValue(0);
    const ringOpacity = useSharedValue(0.6);
    const glowPulse = useSharedValue(1);

    useEffect(() => {
        if (visible) {
            // Reset
            badgeScale.value = 0;
            badgeRotation.value = 0;
            titleOpacity.value = 0;
            ringScale.value = 0;
            ringOpacity.value = 0.6;

            // Badge pop in
            badgeScale.value = withSequence(
                withSpring(1.3, { damping: 6, stiffness: 120 }),
                withSpring(1, { damping: 10 })
            );
            badgeRotation.value = withSequence(
                withTiming(-15, { duration: 200 }),
                withTiming(15, { duration: 200 }),
                withTiming(0, { duration: 200 })
            );

            // Title fade
            titleOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));

            // Ring expand
            ringScale.value = withTiming(2.5, { duration: 1200, easing: Easing.out(Easing.cubic) });
            ringOpacity.value = withTiming(0, { duration: 1200 });

            // Pulsing glow
            glowPulse.value = withRepeat(
                withSequence(
                    withTiming(1.15, { duration: 700 }),
                    withTiming(1, { duration: 700 })
                ),
                -1,
                false
            );
        }
    }, [visible, newLevel]);

    const badgeStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: badgeScale.value * glowPulse.value },
            { rotate: `${badgeRotation.value}deg` },
        ],
    }));

    const titleStyle = useAnimatedStyle(() => ({
        opacity: titleOpacity.value,
        transform: [{ translateY: (1 - titleOpacity.value) * 20 }],
    }));

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ringScale.value }],
        opacity: ringOpacity.value,
    }));

    if (!visible) return null;

    // 12 sparks in a circle
    const sparks = Array.from({ length: 12 }, (_, i) => ({
        angle: (i / 12) * Math.PI * 2,
        distance: 120 + (i % 3) * 30,
        delay: 200 + (i * 50),
    }));

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

                <View style={styles.center} pointerEvents="none">
                    {/* Expanding ring */}
                    <Animated.View style={[styles.ring, ringStyle]} />

                    {/* Sparks */}
                    {sparks.map((s, i) => (
                        <Spark key={i} delay={s.delay} angle={s.angle} distance={s.distance} />
                    ))}

                    {/* Badge */}
                    <Animated.View style={badgeStyle}>
                        <LinearGradient
                            colors={['#FFD700', '#FFA500', '#FF6B35']}
                            style={styles.badge}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.levelLabel}>{t('levelLabel')}</Text>
                            <Text style={styles.levelNumber}>{newLevel}</Text>
                        </LinearGradient>
                    </Animated.View>

                    {/* Title */}
                    <Animated.View style={[styles.titleBox, titleStyle]}>
                        <Text style={styles.titleText}>🎖️ {t('levelUp')}</Text>
                        <Text style={styles.subtitleText}>
                          {t('levelUpSubtitle').replace('{level}', String(newLevel))}
                        </Text>
                        <Text style={styles.hintText}>{t('levelUpHint')}</Text>
                    </Animated.View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    ring: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 3,
        borderColor: COLORS.gold,
    },
    spark: {
        position: 'absolute',
        fontSize: 28,
    },
    badge: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: COLORS.white,
        ...SHADOWS.heavy,
    },
    levelLabel: {
        ...createTextStyle('xs', 'bold'),
        color: COLORS.darkBackground,
        letterSpacing: 1,
    },
    levelNumber: {
        fontSize: 56,
        fontWeight: '900',
        color: COLORS.darkBackground,
        marginTop: -4,
    },
    titleBox: {
        marginTop: SPACING.xl,
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
    titleText: {
        ...createTextStyle('xl', 'bold'),
        color: COLORS.gold,
        fontSize: 32,
        textShadowColor: COLORS.gold,
        textShadowRadius: 12,
    },
    subtitleText: {
        ...createTextStyle('md', 'medium'),
        color: COLORS.white,
        marginTop: SPACING.xs,
    },
    hintText: {
        ...createTextStyle('sm', 'regular'),
        color: COLORS.lightGray,
        marginTop: SPACING.md,
        opacity: 0.7,
    },
});

export default LevelUpAnimation;
