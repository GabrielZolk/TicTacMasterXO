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
import { MadMutationType } from '../types/game';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createTextStyle } from '../utils/theme';
import { useI18n } from '../i18n/useI18n';

const { width } = Dimensions.get('window');

interface MadMutationBannerProps {
    /** Increments per mutation so each one replays the animation. */
    mutationId: number;
    type: MadMutationType;
    onDone: () => void;
}

const ICONS: Record<MadMutationType, string> = {
    rotate: '🔃',
    swap: '🔀',
    freeze: '🧊',
};

/**
 * Announces what just changed in Mad mode. Without this the board appears to
 * scramble itself for no reason, which reads as a bug rather than a rule.
 */
const MadMutationBanner: React.FC<MadMutationBannerProps> = ({ mutationId, type, onDone }) => {
    const { t } = useI18n();
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(-24);
    const iconRotation = useSharedValue(0);

    useEffect(() => {
        opacity.value = withSequence(
            withTiming(1, { duration: 220 }),
            withDelay(
                1500,
                withTiming(0, { duration: 300 }, finished => {
                    if (finished) runOnJS(onDone)();
                })
            )
        );
        translateY.value = withSequence(
            withTiming(0, { duration: 260, easing: Easing.out(Easing.back(1.6)) }),
            withDelay(1500, withTiming(-16, { duration: 300 }))
        );
        iconRotation.value = withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(type === 'rotate' ? 360 : type === 'swap' ? 180 : 0, {
                duration: 600,
                easing: Easing.out(Easing.cubic),
            })
        );
    }, [mutationId]);

    const bannerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${iconRotation.value}deg` }],
    }));

    const label =
        type === 'rotate' ? t('madRotate') : type === 'swap' ? t('madSwap') : t('madFreeze');

    return (
        <Animated.View style={[styles.banner, bannerStyle]} pointerEvents="none">
            <Animated.Text style={[styles.icon, iconStyle]}>{ICONS[type]}</Animated.Text>
            <View style={styles.textBox}>
                <Text style={styles.title}>{t('madMutationTitle')}</Text>
                <Text style={styles.subtitle}>{label}</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 12,
        alignSelf: 'center',
        zIndex: 200,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        maxWidth: width * 0.88,
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 2,
        borderColor: COLORS.warning,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        ...SHADOWS.heavy,
    },
    icon: {
        fontSize: 28,
    },
    textBox: {
        flexShrink: 1,
    },
    title: {
        ...createTextStyle('sm', 'bold'),
        color: COLORS.warning,
    },
    subtitle: {
        ...createTextStyle('xs', 'regular'),
        color: COLORS.white,
    },
});

export default MadMutationBanner;
