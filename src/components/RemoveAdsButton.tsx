import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import { RootStackParamList } from '../types/game';
import { useGame } from '../contexts/GameContext';
import { useI18n } from '../i18n/useI18n';
import iapService from '../services/iapService';
import {
    COLORS,
    SPACING,
    BORDER_RADIUS,
    SHADOWS,
    createTextStyle,
} from '../utils/theme';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface RemoveAdsButtonProps {
    variant?: 'floating' | 'inline' | 'compact';
    style?: object;
}

const RemoveAdsButton: React.FC<RemoveAdsButtonProps> = ({
    variant = 'floating',
    style,
}) => {
    const navigation = useNavigation<NavigationProp>();
    const { playSound, triggerHaptics } = useGame();
    const { t } = useI18n();
    const glowAnimation = useSharedValue(0);

    // Check if already subscribed
    const isSubscribed = iapService.isSubscribed();

    // Skip rendering if already subscribed
    if (isSubscribed) {
        return null;
    }

    // Start glow animation
    React.useEffect(() => {
        glowAnimation.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1500 }),
                withTiming(0, { duration: 1500 })
            ),
            -1
        );
    }, []);

    const handlePress = async () => {
        await triggerHaptics('medium');
        await playSound('button');
        navigation.navigate('RemoveAds');
    };

    const animatedGlowStyle = useAnimatedStyle(() => ({
        shadowOpacity: 0.3 + (glowAnimation.value * 0.4),
        shadowRadius: 4 + (glowAnimation.value * 6),
    }));

    if (variant === 'compact') {
        return (
            <TouchableOpacity
                onPress={handlePress}
                style={[styles.compactButton, style]}
                activeOpacity={0.7}
            >
                <Ionicons name="diamond" size={16} color={COLORS.gold} />
            </TouchableOpacity>
        );
    }

    if (variant === 'inline') {
        return (
            <TouchableOpacity
                onPress={handlePress}
                style={[styles.inlineButton, style]}
                activeOpacity={0.7}
            >
                <Ionicons name="diamond" size={18} color={COLORS.gold} />
                <Text style={styles.inlineText}>{t('removeAds').replace('✨ ', '')}</Text>
            </TouchableOpacity>
        );
    }

    // Floating variant (default)
    return (
        <Animated.View style={[styles.floatingContainer, animatedGlowStyle, style]}>
            <TouchableOpacity
                onPress={handlePress}
                style={styles.floatingButton}
                activeOpacity={0.8}
            >
                <View style={styles.floatingContent}>
                    <Ionicons name="diamond" size={20} color={COLORS.gold} />
                    <Text style={styles.floatingText}>PRO</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    // Floating variant (bottom right corner)
    floatingContainer: {
        position: 'absolute',
        bottom: SPACING.lg,
        right: SPACING.lg,
        zIndex: 999,
        shadowColor: COLORS.gold,
        shadowOffset: { width: 0, height: 2 },
        elevation: 8,
    },
    floatingButton: {
        backgroundColor: COLORS.darkSecondary,
        borderWidth: 2,
        borderColor: COLORS.gold,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        ...SHADOWS.medium,
    },
    floatingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    floatingText: {
        ...createTextStyle('sm', 'bold'),
        color: COLORS.gold,
    },

    // Inline variant (for header or settings)
    inlineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gold + '15',
        borderWidth: 1,
        borderColor: COLORS.gold,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        gap: SPACING.xs,
    },
    inlineText: {
        ...createTextStyle('xs', 'semibold'),
        color: COLORS.gold,
    },

    // Compact variant (icon only)
    compactButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.gold + '20',
        borderWidth: 1,
        borderColor: COLORS.gold,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default RemoveAdsButton;
