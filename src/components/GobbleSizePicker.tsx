import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GobbleSize, Player } from '../types/game';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createTextStyle, getPlayerColor } from '../utils/theme';
import { useI18n } from '../i18n/useI18n';

interface GobbleSizePickerProps {
    currentPlayer: Player;
    piecesLeft: Record<GobbleSize, number>;
    selectedSize: GobbleSize;
    onSelect: (size: GobbleSize) => void;
    disabled?: boolean;
}

const SIZE_SCALE: Record<GobbleSize, number> = { 1: 0.5, 2: 0.72, 3: 1 };

/**
 * Piece-size tray for Gobble mode. The player picks which piece to drop; a
 * bigger one can swallow any smaller piece already on the board.
 */
const GobbleSizePicker: React.FC<GobbleSizePickerProps> = ({
    currentPlayer,
    piecesLeft,
    selectedSize,
    onSelect,
    disabled = false,
}) => {
    const { t } = useI18n();
    const color = getPlayerColor(currentPlayer);

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{t('gobblePickSize')}</Text>
            <View style={styles.row}>
                {([1, 2, 3] as GobbleSize[]).map(size => {
                    const count = piecesLeft[size] || 0;
                    const isSelected = selectedSize === size;
                    const unavailable = count <= 0 || disabled;
                    const diameter = 26 + SIZE_SCALE[size] * 22;

                    return (
                        <TouchableOpacity
                            key={size}
                            style={[
                                styles.slot,
                                isSelected && { borderColor: color, backgroundColor: color + '22' },
                                unavailable && styles.slotDisabled,
                            ]}
                            onPress={() => !unavailable && onSelect(size)}
                            disabled={unavailable}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.piece,
                                    {
                                        width: diameter,
                                        height: diameter,
                                        borderRadius: diameter / 2,
                                        borderColor: color,
                                    },
                                ]}
                            >
                                <Text style={[styles.pieceSymbol, { color, fontSize: 10 + SIZE_SCALE[size] * 10 }]}>
                                    {currentPlayer}
                                </Text>
                            </View>
                            <Text style={[styles.count, count <= 0 && styles.countEmpty]}>×{count}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: SPACING.xs,
    },
    label: {
        ...createTextStyle('xs', 'medium'),
        color: COLORS.lightGray,
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: SPACING.md,
    },
    slot: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 6,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 2,
        borderColor: 'transparent',
        minWidth: 62,
        ...SHADOWS.light,
    },
    slotDisabled: {
        opacity: 0.32,
    },
    piece: {
        borderWidth: 2.5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.darkSecondary,
    },
    pieceSymbol: {
        fontWeight: '900',
    },
    count: {
        ...createTextStyle('xs', 'bold'),
        color: COLORS.lightGray,
        marginTop: 3,
    },
    countEmpty: {
        color: COLORS.darkGray,
    },
});

export default GobbleSizePicker;
