import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createTextStyle } from '../utils/theme';
import { useI18n } from '../i18n/useI18n';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 0.7;

interface WheelSlice {
    label: string;
    value: number;
    color: string;
    icon: string;
}

const SLICES: WheelSlice[] = [
    { label: '10', value: 10, color: '#4A4A4A', icon: '⭐' },
    { label: '25', value: 25, color: '#2196F3', icon: '⭐' },
    { label: '50', value: 50, color: '#9C27B0', icon: '⭐' },
    { label: '15', value: 15, color: '#607D8B', icon: '⭐' },
    { label: '100', value: 100, color: '#FFD700', icon: '💫' },
    { label: '30', value: 30, color: '#4CAF50', icon: '⭐' },
    { label: '20', value: 20, color: '#FF5722', icon: '⭐' },
    { label: '75', value: 75, color: '#E91E63', icon: '✨' },
];

/**
 * The wedges used to be square Views rotated and skewed on top of each other at
 * 30% opacity inside a round container. The corners stuck out past the rim and
 * the colours blended into each other — it did not read as a wheel at all.
 * They are real pie slices now, drawn with the SVG already in the project.
 *
 * Angles are measured clockwise from 12 o'clock, which is where the pointer is
 * and what the spin maths in handleSpin already assumes: slice i covers
 * [i * sliceAngle, (i + 1) * sliceAngle], so its middle sits at
 * i * sliceAngle + sliceAngle / 2.
 */
const R = WHEEL_SIZE / 2;
const SLICE_ANGLE = 360 / SLICES.length;

const pointOnCircle = (angleDeg: number, radius: number) => {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return { x: R + radius * Math.cos(a), y: R + radius * Math.sin(a) };
};

const slicePath = (index: number): string => {
    const start = pointOnCircle(index * SLICE_ANGLE, R);
    const end = pointOnCircle((index + 1) * SLICE_ANGLE, R);
    const largeArc = SLICE_ANGLE > 180 ? 1 : 0;
    return `M ${R} ${R} L ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
};

interface FortuneWheelProps {
    visible: boolean;
    onClose: () => void;
    onResult: (value: number) => void;
}

const FortuneWheel: React.FC<FortuneWheelProps> = ({ visible, onClose, onResult }) => {
    const { playSound, triggerHaptics } = useGame();
    const { t } = useI18n();
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState<WheelSlice | null>(null);
    const rotation = useSharedValue(0);
    const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup ticks on unmount
    useEffect(() => {
        return () => {
            if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
        };
    }, []);

    const handleSpin = () => {
        if (spinning) return;
        setSpinning(true);
        setResult(null);

        // Pick result first
        const resultIndex = Math.floor(Math.random() * SLICES.length);
        const resultSlice = SLICES[resultIndex];

        // Calculate rotation: multiple full spins + land on the result slice
        const sliceAngle = 360 / SLICES.length;
        const targetAngle = 360 * 5 + (360 - resultIndex * sliceAngle - sliceAngle / 2);

        // Tick sounds + haptics — start fast, slow down toward the end
        // Use 'draw' sound which has a real audio file (.wav). Ticks alternate haptic intensity.
        let elapsed = 0;
        let tickCount = 0;
        const totalDuration = 4000;
        let nextTick = 100; // initial fast ticks (slightly slower so audio overlaps less)
        const playTick = () => {
            // Alternate haptic intensities to feel like a real ratchet
            triggerHaptics(tickCount % 2 === 0 ? 'medium' : 'light');
            // Play 'draw' (has real audio file). Each tick at low frequency.
            // Limit how often we trigger sound to avoid audio clipping
            if (tickCount % 2 === 0) {
                playSound('draw');
            }
            tickCount++;
        };
        // Initial kick-off sound
        playSound('button');
        const scheduleTick = () => {
            if (elapsed >= totalDuration) return;
            tickIntervalRef.current = setTimeout(() => {
                elapsed += nextTick;
                playTick();
                // Slow down progressively
                const progress = elapsed / totalDuration;
                nextTick = 100 + Math.pow(progress, 2) * 500; // 100ms → 600ms
                scheduleTick();
            }, nextTick);
        };
        scheduleTick();

        rotation.value = withTiming(
            rotation.value + targetAngle,
            {
                duration: totalDuration,
                easing: Easing.bezier(0.2, 0.8, 0.3, 1),
            },
            (finished) => {
                if (finished) {
                    runOnJS(onSpinComplete)(resultSlice);
                }
            }
        );
    };

    const onSpinComplete = (slice: WheelSlice) => {
        // Stop tick scheduler
        if (tickIntervalRef.current) {
            clearTimeout(tickIntervalRef.current);
            tickIntervalRef.current = null;
        }
        // Final win sound + heavy haptic
        playSound('win');
        triggerHaptics('heavy');
        setSpinning(false);
        setResult(slice);
        onResult(slice.value);
    };

    const wheelStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>{t('fortuneWheel')}</Text>
                    <Text style={styles.subtitle}>{t('spinToWin')}</Text>

                    {/* Wheel */}
                    <View style={styles.wheelContainer}>
                        {/* Pointer */}
                        <View style={styles.pointer}>
                            <Ionicons name="caret-down" size={32} color={COLORS.white} />
                        </View>

                        <Animated.View style={[styles.wheel, wheelStyle]}>
                            <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
                                {SLICES.map((slice, i) => (
                                    <Path
                                        key={`seg-${i}`}
                                        d={slicePath(i)}
                                        fill={slice.color}
                                        stroke={COLORS.darkTertiary}
                                        strokeWidth={1}
                                    />
                                ))}
                                {SLICES.map((slice, i) => {
                                    const mid = i * SLICE_ANGLE + SLICE_ANGLE / 2;
                                    const p = pointOnCircle(mid, R * 0.66);
                                    // Radial text on the bottom half comes out upside down; flipping
                                    // it 180° keeps every label readable without leaving the wedge.
                                    const tilt = mid > 90 && mid < 270 ? mid + 180 : mid;
                                    return (
                                        <G key={`lbl-${i}`} rotation={tilt} origin={`${p.x}, ${p.y}`}>
                                            <SvgText
                                                x={p.x}
                                                y={p.y}
                                                fill={COLORS.white}
                                                fontSize={16}
                                                fontWeight="bold"
                                                textAnchor="middle"
                                                alignmentBaseline="middle"
                                            >
                                                {slice.label}
                                            </SvgText>
                                        </G>
                                    );
                                })}
                            </Svg>
                            <View style={styles.wheelCenter}>
                                <Text style={styles.wheelCenterText}>🎰</Text>
                            </View>
                        </Animated.View>
                    </View>

                    {/* Result */}
                    {result && (
                        <View style={styles.resultContainer}>
                            <Text style={styles.resultText}>
                              {t('youWonStars')
                                .replace('{icon}', result.icon)
                                .replace('{value}', String(result.value))}
                            </Text>
                        </View>
                    )}

                    {/* Buttons */}
                    {!result ? (
                        <TouchableOpacity
                            style={[styles.spinButton, spinning && styles.spinButtonDisabled]}
                            onPress={handleSpin}
                            disabled={spinning}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.spinButtonText}>{spinning ? t('spinning') : t('spinUpper')}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>{t('continue')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    modal: {
        width: width * 0.9,
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        alignItems: 'center',
        ...SHADOWS.heavy,
    },
    title: {
        ...createTextStyle('xl', 'bold'),
        color: COLORS.gold,
        marginBottom: 4,
    },
    subtitle: {
        ...createTextStyle('sm', 'regular'),
        color: COLORS.lightGray,
        marginBottom: SPACING.md,
    },
    wheelContainer: {
        width: WHEEL_SIZE,
        height: WHEEL_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
    },
    pointer: {
        position: 'absolute',
        top: -8,
        zIndex: 10,
    },
    wheel: {
        width: WHEEL_SIZE,
        height: WHEEL_SIZE,
        borderRadius: WHEEL_SIZE / 2,
        backgroundColor: COLORS.darkTertiary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: COLORS.gold,
        overflow: 'hidden',
    },
    wheelCenter: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.darkBackground,
        borderWidth: 3,
        borderColor: COLORS.gold,
        alignItems: 'center',
        justifyContent: 'center',
    },
    wheelCenterText: {
        fontSize: 24,
    },
    resultContainer: {
        backgroundColor: COLORS.gold + '20',
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    resultText: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.gold,
        textAlign: 'center',
    },
    spinButton: {
        backgroundColor: COLORS.gold,
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.lg,
        ...SHADOWS.medium,
    },
    spinButtonDisabled: {
        opacity: 0.5,
    },
    spinButtonText: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.darkBackground,
    },
    closeButton: {
        backgroundColor: COLORS.success,
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.lg,
    },
    closeButtonText: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
    },
});

export default FortuneWheel;
