import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { battlepassService } from '../services/battlepassService';
import { COLORS, SPACING, BORDER_RADIUS, createTextStyle } from '../utils/theme';
import { useI18n } from '../i18n/useI18n';

interface XPBarProps {
    compact?: boolean; // small variant
    onPress?: () => void;
}

const XPBar: React.FC<XPBarProps> = ({ compact = false, onPress }) => {
    const { t } = useI18n();
    const navigation = useNavigation();
    const [progress, setProgress] = useState<{
        currentLevel: number;
        currentXp: number;
        xpForNext: number;
        xpInLevel: number;
        xpRange: number;
    }>({ currentLevel: 0, currentXp: 0, xpForNext: 0, xpInLevel: 0, xpRange: 1 });

    const fillWidth = useSharedValue(0);

    const loadProgress = async () => {
        const p = await battlepassService.getProgress();
        const season = battlepassService.getSeason();
        const currentTier = season.tiers.find(t => t.level === p.currentLevel);
        const nextTier = season.tiers.find(t => t.level === p.currentLevel + 1);

        const xpForNext = nextTier ? nextTier.xpRequired : p.currentXp;
        const xpStart = currentTier?.xpRequired || 0;
        const xpRange = Math.max(1, xpForNext - xpStart);
        const xpInLevel = p.currentXp - xpStart;
        const pct = nextTier ? Math.min(xpInLevel / xpRange, 1) : 1;

        setProgress({
            currentLevel: p.currentLevel,
            currentXp: p.currentXp,
            xpForNext,
            xpInLevel: Math.max(0, xpInLevel),
            xpRange,
        });
        fillWidth.value = withTiming(pct, { duration: 600 });
    };

    useEffect(() => {
        loadProgress();
        const unsub = battlepassService.subscribe(loadProgress);
        return unsub;
    }, []);

    const fillStyle = useAnimatedStyle(() => ({
        width: `${fillWidth.value * 100}%`,
    }));

    const handlePress = () => {
        if (onPress) onPress();
        else (navigation as any).navigate('BattlePass');
    };

    return (
        <TouchableOpacity
            style={[styles.container, compact && styles.containerCompact]}
            onPress={handlePress}
            activeOpacity={0.85}
        >
            {/* Level badge */}
            <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={[styles.levelBadge, compact && styles.levelBadgeCompact]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Text style={styles.levelLabel}>{t('levelBadgeShort')}</Text>
                <Text style={[styles.levelNumber, compact && styles.levelNumberCompact]}>{progress.currentLevel}</Text>
            </LinearGradient>

            {/* XP Bar */}
            <View style={styles.barContainer}>
                <View style={styles.barHeader}>
                    <Text style={styles.xpLabel}>
                        {progress.xpInLevel}/{progress.xpRange} XP
                    </Text>
                    <Ionicons name="chevron-forward" size={12} color={COLORS.lightGray} />
                </View>
                <View style={styles.barBg}>
                    <Animated.View style={[styles.barFill, fillStyle]}>
                        <LinearGradient
                            colors={['#FF6B35', '#FFD700']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </Animated.View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.darkSecondary + 'E6',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.xs,
        gap: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.gold + '40',
    },
    containerCompact: {
        padding: 4,
    },
    levelBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.gold,
    },
    levelBadgeCompact: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    levelLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: COLORS.darkBackground,
        letterSpacing: 0.5,
    },
    levelNumber: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.darkBackground,
        marginTop: -2,
    },
    levelNumberCompact: {
        fontSize: 15,
    },
    barContainer: {
        flex: 1,
    },
    barHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    xpLabel: {
        ...createTextStyle('xs', 'bold'),
        color: COLORS.lightGray,
    },
    barBg: {
        height: 8,
        backgroundColor: COLORS.darkTertiary,
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 4,
    },
});

export default XPBar;
