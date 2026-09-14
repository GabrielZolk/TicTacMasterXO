import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { COLORS, SPACING, BORDER_RADIUS, createTextStyle, SHADOWS } from '../utils/theme';

const { width } = Dimensions.get('window');

interface BombExplosionProps {
    /** Increments on every explosion — drives a fresh animation each time. */
    explosionKey: number;
    message: string;
    onDone: () => void;
}

const SHARD_COUNT = 8;

const Shard: React.FC<{ angle: number }> = ({ angle }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [
            { translateX: Math.cos(angle) * 90 * progress.value },
            { translateY: Math.sin(angle) * 90 * progress.value },
            { scale: 1 - progress.value * 0.6 },
        ],
        opacity: 1 - progress.value,
    }));

    return <Animated.Text style={[styles.shard, style]}>🔥</Animated.Text>;
};

/**
 * Full-screen flash + banner shown when a player steps on the hidden mine in
 * Bomb mode. Self-dismisses after the animation and calls onDone.
 */
const BombExplosion: React.FC<BombExplosionProps> = ({ explosionKey, message, onDone }) => {
    const flash = useSharedValue(0);
    const bombScale = useSharedValue(0);
    const bannerY = useSharedValue(30);
    const bannerOpacity = useSharedValue(0);

    useEffect(() => {
        flash.value = withSequence(
            withTiming(0.55, { duration: 90 }),
            withTiming(0, { duration: 420 })
        );

        bombScale.value = withSequence(
            withTiming(1.4, { duration: 160, easing: Easing.out(Easing.back(2)) }),
            withTiming(1, { duration: 140 }),
            withDelay(900, withTiming(0, { duration: 220 }))
        );

        bannerOpacity.value = withSequence(
            withTiming(1, { duration: 220 }),
            withDelay(1000, withTiming(0, { duration: 260 }, (finished) => {
                if (finished) {
                    runOnJS(onDone)();
                }
            }))
        );
        bannerY.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.quad) });
    }, [explosionKey]);

    const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
    const bombStyle = useAnimatedStyle(() => ({ transform: [{ scale: bombScale.value }] }));
    const bannerStyle = useAnimatedStyle(() => ({
        opacity: bannerOpacity.value,
        transform: [{ translateY: bannerY.value }],
    }));

    const shards = Array.from({ length: SHARD_COUNT }, (_, i) => (i / SHARD_COUNT) * Math.PI * 2);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Screen flash */}
            <Animated.View style={[StyleSheet.absoluteFill, styles.flash, flashStyle]} />

            {/* Bomb burst */}
            <View style={styles.center}>
                <Animated.View style={bombStyle}>
                    <Text style={styles.bomb}>💥</Text>
                </Animated.View>
                {shards.map((angle, i) => (
                    <Shard key={`${explosionKey}-${i}`} angle={angle} />
                ))}
            </View>

            {/* Message banner */}
            <Animated.View style={[styles.banner, bannerStyle]}>
                <Text style={styles.bannerText}>{message}</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    flash: {
        backgroundColor: COLORS.error,
    },
    center: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bomb: {
        fontSize: 92,
    },
    shard: {
        position: 'absolute',
        fontSize: 26,
    },
    banner: {
        position: 'absolute',
        top: '18%',
        alignSelf: 'center',
        maxWidth: width * 0.86,
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 2,
        borderColor: COLORS.error,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        ...SHADOWS.heavy,
    },
    bannerText: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
        textAlign: 'center',
    },
});

export default BombExplosion;
