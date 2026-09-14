import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Polygon } from 'react-native-svg';

/**
 * The mystic seal of the Samuel theme: three concentric rings turning at
 * different speeds and directions around a two-triangle star.
 *
 * Drawn from scratch in the classic magic-circle idiom (concentric rings,
 * segmented arcs, tick runes) rather than copied from any particular artwork.
 *
 * Rotation lives on three separate Animated Views instead of inside the SVG,
 * because react-native-svg does not animate transforms on the UI thread —
 * this way each ring is a plain transform and nothing re-renders per frame.
 */
interface MysticSealProps {
    size: number;
    /** Dimmed for the ambient watermark, full strength for the win effect. */
    opacity?: number;
}

const OUTER = '#FFB35C';
const MID = '#FFD9A8';
const INNER = '#FFF0D8';
const CORE = '#FFE9C7';

const useSpin = (durationMs: number, reverse = false) => {
    const angle = useSharedValue(0);
    React.useEffect(() => {
        angle.value = 0;
        angle.value = withRepeat(
            withTiming(reverse ? -360 : 360, { duration: durationMs, easing: Easing.linear }),
            -1,
            false,
        );
    }, [durationMs, reverse]);
    return useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));
};

/** Tick marks around the outer ring, precomputed to keep render allocation-free. */
const TICKS: Array<[number, number, number, number]> = [
    [100, 8, 100, 18], [100, 182, 100, 192],
    [8, 100, 18, 100], [182, 100, 192, 100],
    [35, 35, 42, 42], [158, 158, 165, 165],
    [165, 35, 158, 42], [42, 158, 35, 165],
];

const MysticSeal: React.FC<MysticSealProps> = ({ size, opacity = 1 }) => {
    const slow = useSpin(26000);
    const medium = useSpin(18000, true);
    const fast = useSpin(9000);

    const ring = { position: 'absolute' as const, width: size, height: size };

    return (
        <View style={[styles.wrap, { width: size, height: size, opacity }]} pointerEvents="none">
            <Animated.View style={[ring, slow]}>
                <Svg width={size} height={size} viewBox="0 0 200 200">
                    <Circle cx={100} cy={100} r={86} fill="none" stroke={OUTER} strokeWidth={1.4} opacity={0.85} />
                    <Circle cx={100} cy={100} r={78} fill="none" stroke={OUTER} strokeWidth={3}
                            strokeDasharray="14 7" opacity={0.9} />
                    <G opacity={0.7}>
                        {TICKS.map(([x1, y1, x2, y2], i) => (
                            <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={OUTER} strokeWidth={1.2} />
                        ))}
                    </G>
                </Svg>
            </Animated.View>

            <Animated.View style={[ring, medium]}>
                <Svg width={size} height={size} viewBox="0 0 200 200">
                    <Circle cx={100} cy={100} r={62} fill="none" stroke={MID} strokeWidth={1.6}
                            strokeDasharray="3 9" />
                    <Polygon points="100,44 148,128 52,128" fill="none" stroke={MID}
                             strokeWidth={2.2} opacity={0.95} />
                    <Polygon points="100,156 52,72 148,72" fill="none" stroke={MID}
                             strokeWidth={1.4} opacity={0.55} />
                </Svg>
            </Animated.View>

            <Animated.View style={[ring, fast]}>
                <Svg width={size} height={size} viewBox="0 0 200 200">
                    <Circle cx={100} cy={100} r={34} fill="none" stroke={INNER} strokeWidth={1.6}
                            strokeDasharray="8 5" />
                </Svg>
            </Animated.View>

            <View style={ring}>
                <Svg width={size} height={size} viewBox="0 0 200 200">
                    <Circle cx={100} cy={100} r={17} fill="none" stroke={CORE} strokeWidth={2.4} />
                    <Circle cx={100} cy={100} r={5} fill={CORE} />
                </Svg>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default MysticSeal;
