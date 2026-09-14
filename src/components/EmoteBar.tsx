import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withSpring,
} from 'react-native-reanimated';
import { COLORS, SPACING, BORDER_RADIUS, createTextStyle, SHADOWS } from '../utils/theme';
import { Emote, getAvailableEmotes } from '../types/emotes';
import { storeService } from '../services/storeService';
import { useI18n } from '../i18n/useI18n';

interface EmoteBarProps {
    onSendEmote: (emote: Emote) => void;
    receivedEmote: Emote | null;
}

const EmoteBar: React.FC<EmoteBarProps> = ({ onSendEmote, receivedEmote }) => {
    const { t } = useI18n();
    const [emotes, setEmotes] = useState<Emote[]>([]);
    const [showPicker, setShowPicker] = useState(false);

    // Received emote animation
    const receivedScale = useSharedValue(0);
    const receivedOpacity = useSharedValue(0);
    const [displayEmote, setDisplayEmote] = useState<string>('');

    useEffect(() => {
        loadEmotes();
        const unsub = storeService.subscribe(loadEmotes);
        return unsub;
    }, []);

    useEffect(() => {
        if (receivedEmote) {
            setDisplayEmote(receivedEmote.emoji);
            receivedScale.value = withSequence(
                withSpring(1.5, { damping: 6 }),
                withTiming(1, { duration: 200 }),
            );
            receivedOpacity.value = withSequence(
                withTiming(1, { duration: 100 }),
                withTiming(1, { duration: 2000 }),
                withTiming(0, { duration: 500 }),
            );
        }
    }, [receivedEmote]);

    const loadEmotes = async () => {
        const inventory = await storeService.getInventory();
        const ownedPacks = inventory.ownedItems.filter(id => id.startsWith('pack_'));
        setEmotes(getAvailableEmotes(ownedPacks));
    };

    const receivedAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: receivedScale.value }],
        opacity: receivedOpacity.value,
    }));

    return (
        <View style={styles.container}>
            {/* Received emote bubble */}
            {displayEmote ? (
                <Animated.View style={[styles.receivedBubble, receivedAnimStyle]}>
                    <Text style={styles.receivedEmoji}>{displayEmote}</Text>
                </Animated.View>
            ) : null}

            {/* Emote toggle */}
            <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowPicker(!showPicker)}
                activeOpacity={0.7}
            >
                <Text style={styles.toggleEmoji}>{showPicker ? '✕' : '😊'}</Text>
                {!showPicker && (
                    <Text style={styles.toggleLabel}>{t('emotesLabel')}</Text>
                )}
            </TouchableOpacity>

            {/* Picker */}
            {showPicker && (
                <View style={styles.picker}>
                    {emotes.map(emote => (
                        <TouchableOpacity
                            key={emote.id}
                            style={styles.emoteButton}
                            onPress={() => {
                                onSendEmote(emote);
                                setShowPicker(false);
                            }}
                            activeOpacity={0.6}
                        >
                            <Text style={styles.emoteEmoji}>{emote.emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 80,
        right: SPACING.lg,
        alignItems: 'flex-end',
        zIndex: 100,
    },
    receivedBubble: {
        position: 'absolute',
        top: -60,
        left: SPACING.lg,
        backgroundColor: COLORS.darkSecondary,
        borderRadius: 20,
        padding: 8,
        ...SHADOWS.medium,
    },
    receivedEmoji: {
        fontSize: 32,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.xColor,
        paddingHorizontal: 14,
        ...SHADOWS.medium,
    },
    toggleEmoji: {
        fontSize: 20,
    },
    toggleLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    picker: {
        position: 'absolute',
        bottom: 48,
        right: SPACING.lg,
        flexDirection: 'row',
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.xs,
        gap: 4,
        ...SHADOWS.heavy,
    },
    emoteButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.darkTertiary,
    },
    emoteEmoji: {
        fontSize: 22,
    },
});

export default EmoteBar;
