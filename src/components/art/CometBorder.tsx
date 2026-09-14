import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

/**
 * Animated profile border: a point of light orbits the avatar leaving a tail.
 *
 * Built from plain Views rather than a conic gradient (React Native has no
 * conic gradient): the tail is a row of dots that trail the head, each one
 * dimmer and slightly smaller. The whole ring is one rotating container, so
 * the animation is a single transform driven on the UI thread — no per-frame
 * JS work regardless of how many of these are on screen.
 */
interface CometBorderProps {
    /** Outer diameter. The avatar inside should be roughly size - 20. */
    size: number;
    /** Head colour; the tail fades from white through this. */
    color: string;
    /** One full orbit, in ms. Rarer borders spin faster. */
    durationMs?: number;
    children: React.ReactNode;
}

/** Head + tail. Index 0 is the head; the rest trail behind it. */
const TAIL = [
    { spread: 0, opacity: 1, scale: 1 },
    { spread: 7, opacity: 0.72, scale: 0.85 },
    { spread: 14, opacity: 0.5, scale: 0.72 },
    { spread: 22, opacity: 0.32, scale: 0.6 },
    { spread: 31, opacity: 0.18, scale: 0.5 },
    { spread: 41, opacity: 0.09, scale: 0.4 },
];

const CometBorder: React.FC<CometBorderProps> = ({
    size,
    color,
    durationMs = 2800,
    children,
}) => {
    const angle = useSharedValue(0);

    React.useEffect(() => {
        angle.value = 0;
        angle.value = withRepeat(
            withTiming(360, { duration: durationMs, easing: Easing.linear }),
            -1,
            false,
        );
    }, [durationMs]);

    const spinStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${angle.value}deg` }],
    }));

    const radius = size / 2;
    const dotBase = Math.max(5, Math.round(size * 0.075));

    return (
        <View style={[styles.wrap, { width: size, height: size }]}>
            {/* Faint track so the ring reads as a border even between passes */}
            <View
                style={[
                    styles.track,
                    { borderRadius: radius, borderColor: color, width: size, height: size },
                ]}
            />

            <Animated.View style={[StyleSheet.absoluteFill, spinStyle]}>
                {TAIL.map((segment, i) => {
                    const dot = dotBase * segment.scale;
                    return (
                        <View
                            key={i}
                            style={[
                                styles.spoke,
                                {
                                    width: size,
                                    height: size,
                                    transform: [{ rotate: `${-segment.spread}deg` }],
                                },
                            ]}
                            pointerEvents="none"
                        >
                            <View
                                style={{
                                    width: dot,
                                    height: dot,
                                    borderRadius: dot / 2,
                                    marginTop: -dot / 2,
                                    // The head is white-hot, the tail takes the border colour.
                                    backgroundColor: i === 0 ? '#FFFFFF' : color,
                                    opacity: segment.opacity,
                                    shadowColor: color,
                                    shadowOpacity: i === 0 ? 0.9 : 0.5,
                                    shadowRadius: i === 0 ? 6 : 3,
                                    shadowOffset: { width: 0, height: 0 },
                                    elevation: i === 0 ? 6 : 2,
                                }}
                            />
                        </View>
                    );
                })}
            </Animated.View>

            <View style={styles.center}>{children}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    track: {
        position: 'absolute',
        borderWidth: 2,
        opacity: 0.18,
    },
    // Each spoke is a full-size box whose child sits at the top edge, so
    // rotating the box moves the dot around the circumference.
    spoke: {
        position: 'absolute',
        alignItems: 'center',
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default CometBorder;
