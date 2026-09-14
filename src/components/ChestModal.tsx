import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createTextStyle } from '../utils/theme';
import { ChestRarity, ChestReward, CHEST_CONFIGS } from '../types/chest';
import { useI18n } from '../i18n/useI18n';
import { rewardLabel } from '../i18n/rewardLabel';

const { width } = Dimensions.get('window');

interface ChestModalProps {
    visible: boolean;
    chestRarity: ChestRarity | null;
    onOpen: () => Promise<ChestReward[]>;
    onOpenWithAd: () => Promise<ChestReward[] | null>;
    onClose: () => void;
}

const ChestModal: React.FC<ChestModalProps> = ({
    visible,
    chestRarity,
    onOpen,
    onOpenWithAd,
    onClose,
}) => {
    // ALL HOOKS MUST BE CALLED UNCONDITIONALLY — keep at the top in same order
    const { t, tc } = useI18n();
    const [rewards, setRewards] = useState<ChestReward[] | null>(null);
    const [opening, setOpening] = useState(false);
    // The open sequence runs behind a 500ms timer; without these the callback
    // could set state on an unmounted modal (or fire twice) after navigating away.
    const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            if (openTimerRef.current) clearTimeout(openTimerRef.current);
        };
    }, []);
    const chestScale = useSharedValue(1);
    const chestAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: chestScale.value }],
    }));

    // Defensive: if rarity is invalid, close via effect (not during render)
    const config = chestRarity ? CHEST_CONFIGS[chestRarity] : null;
    useEffect(() => {
        if (visible && chestRarity && !config) {
            console.warn('ChestModal: invalid rarity', chestRarity);
            onClose();
        }
    }, [visible, chestRarity, config]);

    // Reset rewards when modal opens with a new chest
    useEffect(() => {
        if (visible && chestRarity) {
            setRewards(null);
            setOpening(false);
        }
    }, [visible, chestRarity]);

    const handleOpen = async (withAd: boolean) => {
        setOpening(true);
        // Shake animation
        chestScale.value = withSequence(
            withTiming(1.2, { duration: 100 }),
            withTiming(0.9, { duration: 100 }),
            withTiming(1.3, { duration: 100 }),
            withSpring(1, { damping: 4 }),
        );

        openTimerRef.current = setTimeout(async () => {
            try {
                const result = withAd ? await onOpenWithAd() : await onOpen();
                if (!mountedRef.current) return;
                setRewards(result || []);
            } catch (e) {
                console.warn('Chest open error:', e);
                if (mountedRef.current) setRewards([]);
            } finally {
                if (mountedRef.current) setOpening(false);
            }
        }, 500);
    };

    const handleClose = () => {
        setRewards(null);
        onClose();
    };

    // Now safe to early-return (after all hooks)
    if (!visible || !chestRarity || !config) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {!rewards ? (
                        // Chest reveal
                        <>
                            <Animated.View style={[styles.chestContainer, chestAnimStyle]}>
                                <Text style={styles.chestIcon}>{config.icon}</Text>
                            </Animated.View>
                            <Text style={[styles.chestName, { color: config.color }]}>{tc(`chest.${chestRarity}`, config.name)}</Text>
                            <Text style={styles.chestDesc}>{t('chestDescription')}</Text>

                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={[styles.openButton, { backgroundColor: config.color }]}
                                    onPress={() => handleOpen(false)}
                                    disabled={opening}
                                >
                                    <Text style={styles.openButtonText}>
                                        {opening ? '...' : t('openChest')}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity onPress={handleClose} style={styles.laterButton}>
                                <Text style={styles.laterText}>{t('saveLater')}</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        // Rewards reveal
                        <>
                            <Text style={styles.rewardsTitle}>{t('rewards')}!</Text>
                            <View style={styles.rewardsList}>
                                {rewards.map((reward, i) => (
                                    <Animated.View
                                        key={i}
                                        style={styles.rewardRow}
                                    >
                                        <Text style={styles.rewardIcon}>{reward.icon}</Text>
                                        <Text style={styles.rewardName}>{rewardLabel(reward, tc)}</Text>
                                    </Animated.View>
                                ))}
                            </View>
                            <TouchableOpacity
                                style={[styles.openButton, { backgroundColor: COLORS.success }]}
                                onPress={handleClose}
                            >
                                <Text style={styles.openButtonText}>{t('continue')}</Text>
                            </TouchableOpacity>
                        </>
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
        backgroundColor: 'rgba(0,0,0,0.85)',
    },
    modal: {
        width: width * 0.8,
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.xl,
        alignItems: 'center',
        ...SHADOWS.heavy,
    },
    chestContainer: {
        marginBottom: SPACING.md,
    },
    chestIcon: {
        fontSize: 64,
    },
    chestName: {
        ...createTextStyle('xl', 'bold'),
        marginBottom: SPACING.xs,
    },
    chestDesc: {
        ...createTextStyle('sm', 'regular'),
        color: COLORS.lightGray,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    buttonRow: {
        width: '100%',
        gap: SPACING.sm,
    },
    openButton: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    openButtonText: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
    },
    adButton: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: COLORS.gold + '40',
    },
    adButtonText: {
        ...createTextStyle('sm', 'bold'),
        color: COLORS.gold,
    },
    laterButton: {
        marginTop: SPACING.md,
        padding: SPACING.sm,
    },
    laterText: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.gray,
    },
    rewardsTitle: {
        ...createTextStyle('xl', 'bold'),
        color: COLORS.gold,
        marginBottom: SPACING.lg,
    },
    rewardsList: {
        width: '100%',
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    rewardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        backgroundColor: COLORS.darkTertiary,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
    },
    rewardIcon: {
        fontSize: 28,
    },
    rewardName: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
    },
});

export default ChestModal;
