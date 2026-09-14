import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const GREEN = '#00FF41';
const CELL = 26;          // grid pitch, in px
const SWEEP_HEIGHT = 90;  // height of the scanning band

/**
 * Animated backdrop for the Matrix theme: a grid that breathes plus a scan line
 * sweeping down the screen.
 *
 * Chosen over falling glyph columns because it stays readable behind the board —
 * the rain competed with the X and O for attention, this reads as atmosphere.
 *
 * Cost is deliberately tiny: the grid is a fixed set of hairline Views whose
 * container only animates `opacity`, and the sweep is one translating View.
 * Both run on the UI thread, so the board's own animations are untouched.
 */
interface MatrixBackgroundProps {
    theme: string;
}

const COLUMNS = Math.ceil(width / CELL) + 1;
const ROWS = Math.ceil(height / CELL) + 1;

const MatrixBackground: React.FC<MatrixBackgroundProps> = ({ theme }) => {
    const gridOpacity = useSharedValue(0.35);
    const sweepY = useSharedValue(-SWEEP_HEIGHT);

    const isMatrix = theme === 'matrix';

    React.useEffect(() => {
        if (!isMatrix) return;

        gridOpacity.value = withRepeat(
            withTiming(0.95, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
            -1,
            true,
        );

        sweepY.value = -SWEEP_HEIGHT;
        sweepY.value = withRepeat(
            withDelay(
                200,
                withTiming(height, { duration: 2600, easing: Easing.linear }),
            ),
            -1,
            false,
        );
    }, [isMatrix]);

    const gridStyle = useAnimatedStyle(() => ({ opacity: gridOpacity.value }));
    const sweepStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: sweepY.value }],
    }));

    // Hooks above always run; only the output is conditional.
    if (!isMatrix) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Animated.View style={[StyleSheet.absoluteFill, gridStyle]}>
                {Array.from({ length: COLUMNS }).map((_, i) => (
                    <View key={`v${i}`} style={[styles.vLine, { left: i * CELL }]} />
                ))}
                {Array.from({ length: ROWS }).map((_, i) => (
                    <View key={`h${i}`} style={[styles.hLine, { top: i * CELL }]} />
                ))}
            </Animated.View>

            <Animated.View style={[styles.sweep, sweepStyle]}>
                <View style={[styles.sweepBand, { opacity: 0.06 }]} />
                <View style={[styles.sweepBand, { opacity: 0.14 }]} />
                <View style={[styles.sweepBand, { opacity: 0.22 }]} />
                <View style={[styles.sweepBand, { opacity: 0.14 }]} />
                <View style={[styles.sweepBand, { opacity: 0.06 }]} />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    vLine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: StyleSheet.hairlineWidth,
        backgroundColor: GREEN,
        opacity: 0.35,
    },
    hLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: StyleSheet.hairlineWidth,
        backgroundColor: GREEN,
        opacity: 0.35,
    },
    sweep: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: SWEEP_HEIGHT,
    },
    // Stacked bands fake a soft gradient without pulling in a gradient node.
    sweepBand: {
        flex: 1,
        backgroundColor: GREEN,
    },
});

export default MatrixBackground;
