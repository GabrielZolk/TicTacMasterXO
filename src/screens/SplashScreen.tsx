import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    withSpring,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { COLORS, createTextStyle } from '../utils/theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
    onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
    const logoScale = useSharedValue(0);
    const logoRotate = useSharedValue(0);
    const titleOpacity = useSharedValue(0);
    const titleY = useSharedValue(20);
    const xScale = useSharedValue(0);
    const oScale = useSharedValue(0);
    const fadeOut = useSharedValue(1);

    useEffect(() => {
        // Logo entrance: scale + rotate
        logoScale.value = withSpring(1, { damping: 8, stiffness: 100 });
        logoRotate.value = withTiming(360, { duration: 800, easing: Easing.out(Easing.cubic) });

        // X piece flies in
        xScale.value = withDelay(400, withSpring(1, { damping: 6 }));

        // O piece flies in
        oScale.value = withDelay(600, withSpring(1, { damping: 6 }));

        // Title fades in
        titleOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
        titleY.value = withDelay(800, withSpring(0, { damping: 10 }));

        // Fade out after 2s
        fadeOut.value = withDelay(2200, withTiming(0, { duration: 400 }, (finished) => {
            if (finished) runOnJS(onFinish)();
        }));
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: logoScale.value },
            { rotate: `${logoRotate.value}deg` },
        ],
    }));

    const xStyle = useAnimatedStyle(() => ({
        transform: [{ scale: xScale.value }],
        opacity: xScale.value,
    }));

    const oStyle = useAnimatedStyle(() => ({
        transform: [{ scale: oScale.value }],
        opacity: oScale.value,
    }));

    const titleStyle = useAnimatedStyle(() => ({
        opacity: titleOpacity.value,
        transform: [{ translateY: titleY.value }],
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: fadeOut.value,
    }));

    // Purely decorative: nothing here is tappable, and the view covers the whole
    // screen at zIndex 100. Letting it take touches means any frame where it
    // lingers is a frame where the app is unresponsive.
    return (
        <Animated.View pointerEvents="none" style={[styles.container, containerStyle]}>
            <LinearGradient colors={['#0A0A0A', '#1A1A2E', '#0A0A0A']} style={styles.gradient}>
                {/* Floating X */}
                <Animated.View style={[styles.floatingPiece, styles.floatingX, xStyle]}>
                    <Text style={[styles.pieceText, { color: COLORS.xColor }]}>X</Text>
                </Animated.View>

                {/* Floating O */}
                <Animated.View style={[styles.floatingPiece, styles.floatingO, oStyle]}>
                    <Text style={[styles.pieceText, { color: COLORS.oColor }]}>O</Text>
                </Animated.View>

                {/* Logo grid */}
                <Animated.View style={[styles.logoGrid, logoStyle]}>
                    <View style={styles.gridRow}>
                        <View style={styles.gridCell}><Text style={styles.gridX}>X</Text></View>
                        <View style={styles.gridCell}><Text style={styles.gridO}>O</Text></View>
                        <View style={styles.gridCell}><Text style={styles.gridX}>X</Text></View>
                    </View>
                    <View style={styles.gridRow}>
                        <View style={styles.gridCell}><Text style={styles.gridO}>O</Text></View>
                        <View style={styles.gridCell}><Text style={styles.gridX}>X</Text></View>
                        <View style={styles.gridCell} />
                    </View>
                    <View style={styles.gridRow}>
                        <View style={styles.gridCell} />
                        <View style={styles.gridCell}><Text style={styles.gridO}>O</Text></View>
                        <View style={styles.gridCell} />
                    </View>
                </Animated.View>

                {/* Title */}
                <Animated.View style={titleStyle}>
                    <Text style={styles.title}>TicTac Master</Text>
                    <Text style={styles.subtitle}>XO</Text>
                </Animated.View>
            </LinearGradient>
        </Animated.View>
    );
};

const CELL = 52;

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 100,
    },
    gradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingPiece: {
        position: 'absolute',
    },
    floatingX: {
        top: height * 0.15,
        left: width * 0.15,
    },
    floatingO: {
        top: height * 0.2,
        right: width * 0.15,
    },
    pieceText: {
        fontSize: 48,
        fontWeight: 'bold',
        opacity: 0.3,
    },
    logoGrid: {
        marginBottom: 24,
    },
    gridRow: {
        flexDirection: 'row',
    },
    gridCell: {
        width: CELL,
        height: CELL,
        borderWidth: 1,
        borderColor: COLORS.darkTertiary,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 2,
        borderRadius: 6,
        backgroundColor: COLORS.darkSecondary + '60',
    },
    gridX: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.xColor,
    },
    gridO: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.oColor,
    },
    title: {
        ...createTextStyle('xl', 'bold'),
        color: COLORS.white,
        textAlign: 'center',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.gold,
        textAlign: 'center',
        letterSpacing: 8,
    },
});

export default SplashScreen;
