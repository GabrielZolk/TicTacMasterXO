import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/theme';

const { width, height } = Dimensions.get('window');

interface CopaNickBackgroundProps {
    theme: string;
}

// Halftone dot grid (printed-sticker texture) sized once at module level.
// Rows/cols cover the screen with a sparse, cheap-to-render pattern.
const DOT_SPACING = 42;
const DOT_COLS = Math.ceil(width / DOT_SPACING) + 1;
const DOT_ROWS = Math.ceil(height / DOT_SPACING) + 1;
const DOTS: { x: number; y: number }[] = [];
for (let r = 0; r < DOT_ROWS; r++) {
    for (let c = 0; c < DOT_COLS; c++) {
        // offset every other row like real print halftone
        DOTS.push({ x: c * DOT_SPACING + (r % 2 === 0 ? 0 : DOT_SPACING / 2), y: r * DOT_SPACING });
    }
}

/**
 * Album-sticker background for the "Copa Nick" theme:
 * printed halftone dots + a holographic diagonal shine that sweeps across
 * the screen every few seconds, like a rare foil World Cup sticker.
 */
const CopaNickBackground: React.FC<CopaNickBackgroundProps> = ({ theme }) => {
    const shineAnim = useRef(new Animated.Value(-1)).current;

    useEffect(() => {
        if (theme !== 'copa_nick') return;

        // Foil shine: sweep, rest, sweep again — endless
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shineAnim, {
                    toValue: 1,
                    duration: 2200,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.delay(3800),
                Animated.timing(shineAnim, {
                    toValue: -1,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [theme]);

    if (theme !== 'copa_nick') return null;

    const translateX = shineAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: [-width * 1.2, width * 1.2],
    });

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Halftone print dots */}
            {DOTS.map((d, i) => (
                <View
                    key={i}
                    style={[
                        styles.dot,
                        {
                            left: d.x,
                            top: d.y,
                            // alternate green/gold dots, very faint
                            backgroundColor: i % 5 === 0 ? COLORS.copaNickGold : COLORS.copaNickTertiary,
                        },
                    ]}
                />
            ))}

            {/* Holographic foil shine sweeping diagonally */}
            <Animated.View
                style={[
                    styles.shineContainer,
                    { transform: [{ translateX }, { rotate: '18deg' }] },
                ]}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(255,233,138,0.16)', 'rgba(255,255,255,0.22)', 'rgba(201,162,39,0.14)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.shine}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    dot: {
        position: 'absolute',
        width: 3,
        height: 3,
        borderRadius: 1.5,
        opacity: 0.12,
    },
    shineContainer: {
        position: 'absolute',
        top: -height * 0.2,
        left: 0,
        width: width * 0.6,
        height: height * 1.4,
    },
    shine: {
        flex: 1,
    },
});

export default CopaNickBackground;
