import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeOut, ZoomIn } from 'react-native-reanimated';
import { useI18n } from '../i18n/useI18n';

import {
    BORDER_RADIUS,
    COLORS,
    SHADOWS,
    SPACING,
    createTextStyle,
} from '../utils/theme';

interface PremiumCelebrationProps {
    visible: boolean;
    planLabel: string;
    onContinue: () => void;
}

const OVERLAY_COLORS = ['rgba(4, 4, 10, 0.90)', 'rgba(10, 10, 10, 0.97)'] as const;
const CARD_COLORS = ['#2A1B00', '#151123', '#09090F'] as const;
const ORB_COLORS = ['#FFF1A8', '#FFD700', '#FF9800'] as const;
const CTA_COLORS = ['#FFE082', '#FFD700', '#FFB300'] as const;

const SPARKLES = [
    { id: 1, icon: 'diamond', size: 20, color: '#FFD700', top: '12%', left: '12%' },
    { id: 2, icon: 'star', size: 16, color: '#FFF59D', top: '20%', right: '15%' },
    { id: 3, icon: 'flash', size: 18, color: '#FFCC80', top: '31%', left: '18%' },
    { id: 4, icon: 'sparkles', size: 16, color: '#A5D6A7', top: '23%', right: '22%' },
    { id: 5, icon: 'checkmark-circle', size: 18, color: '#81C784', bottom: '24%', left: '14%' },
    { id: 6, icon: 'diamond', size: 16, color: '#FFD54F', bottom: '18%', right: '16%' },
] as ReadonlyArray<{
    id: number;
    icon: keyof typeof Ionicons.glyphMap;
    size: number;
    color: string;
    top?: DimensionValue;
    bottom?: DimensionValue;
    left?: DimensionValue;
    right?: DimensionValue;
}>;

const REWARD_CHIP_KEYS = ['benefitNoAds', 'benefitSmooth', 'premiumChipStatus'] as const;

const PremiumCelebration: React.FC<PremiumCelebrationProps> = ({
    visible,
    planLabel,
    onContinue,
}) => {
    // Hook first: an early return above it would make the hook call conditional.
    const { t } = useI18n();

    if (!visible) {
        return null;
    }

    return (
        <Animated.View
            entering={FadeIn.duration(250)}
            exiting={FadeOut.duration(220)}
            style={styles.overlay}
        >
            <LinearGradient colors={OVERLAY_COLORS} style={styles.backdrop} />

            {SPARKLES.map((sparkle, index) => (
                <Animated.View
                    key={sparkle.id}
                    entering={FadeInDown.delay(90 * index).duration(500)}
                    style={[
                        styles.sparkle,
                        sparkle.top ? { top: sparkle.top } : null,
                        sparkle.bottom ? { bottom: sparkle.bottom } : null,
                        sparkle.left ? { left: sparkle.left } : null,
                        sparkle.right ? { right: sparkle.right } : null,
                    ]}
                >
                    <Ionicons name={sparkle.icon as any} size={sparkle.size} color={sparkle.color} />
                </Animated.View>
            ))}

            <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.cardWrapper}>
                <LinearGradient colors={CARD_COLORS} style={styles.card}>
                    <View style={styles.badge}>
                        <Ionicons name="diamond" size={16} color={COLORS.darkBackground} />
                        <Text style={styles.badgeText}>{t('premiumActive')}</Text>
                    </View>

                    <LinearGradient colors={ORB_COLORS} style={styles.orb}>
                        <Ionicons name="trophy" size={42} color={COLORS.darkBackground} />
                    </LinearGradient>

                    <Text style={styles.title}>{t('subscriptionActivated')}</Text>
                    <Text style={styles.subtitle}>
                        {t('premiumUnlockedBody', { plan: planLabel })}
                    </Text>

                    <View style={styles.chipsRow}>
                        {REWARD_CHIP_KEYS.map((chipKey) => (
                            <View key={chipKey} style={styles.chip}>
                                <Text style={styles.chipText}>{t(chipKey)}</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity activeOpacity={0.9} onPress={onContinue} style={styles.ctaWrapper}>
                        <LinearGradient colors={CTA_COLORS} style={styles.ctaButton}>
                            <Ionicons name="sparkles" size={18} color={COLORS.darkBackground} />
                            <Text style={styles.ctaText}>{t('continuePremium')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </LinearGradient>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 2000,
        elevation: 2000,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sparkle: {
        position: 'absolute',
    },
    cardWrapper: {
        width: '100%',
        maxWidth: 380,
    },
    card: {
        borderRadius: BORDER_RADIUS.xxl,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.35)',
        ...SHADOWS.heavy,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        backgroundColor: COLORS.gold,
        borderRadius: BORDER_RADIUS.round,
        paddingHorizontal: SPACING.md,
        paddingVertical: 6,
        marginBottom: SPACING.lg,
    },
    badgeText: {
        ...createTextStyle('xs', 'bold'),
        color: COLORS.darkBackground,
        letterSpacing: 0.8,
    },
    orb: {
        width: 108,
        height: 108,
        borderRadius: 54,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
        shadowColor: COLORS.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 18,
        elevation: 10,
    },
    title: {
        ...createTextStyle('xxl', 'extrabold'),
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    subtitle: {
        ...createTextStyle('md', 'regular'),
        color: COLORS.lightGray,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: SPACING.lg,
    },
    chipsRow: {
        width: '100%',
        gap: SPACING.sm,
        marginBottom: SPACING.xl,
    },
    chip: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: BORDER_RADIUS.round,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.20)',
    },
    chipText: {
        ...createTextStyle('sm', 'semibold'),
        color: COLORS.white,
        textAlign: 'center',
    },
    ctaWrapper: {
        width: '100%',
    },
    ctaButton: {
        width: '100%',
        borderRadius: BORDER_RADIUS.round,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    ctaText: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.darkBackground,
    },
});

export default PremiumCelebration;
