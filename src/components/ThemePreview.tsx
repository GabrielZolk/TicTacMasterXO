import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ThemePreviewProps {
    gradient: string[];
    textColor?: string;
    secondaryColor?: string;
    size?: number;
}

const MINI_BOARD = [
    ['X', null, 'O'],
    [null, 'X', null],
    ['O', null, 'X'],
];

const ThemePreview: React.FC<ThemePreviewProps> = ({
    gradient,
    textColor = '#FF6B35',
    secondaryColor = '#4ECDC4',
    size = 80,
}) => {
    const cellSize = (size - 8) / 3;

    return (
        <LinearGradient
            colors={gradient.length >= 2 ? gradient as any : [gradient[0], gradient[0]]}
            style={[styles.container, { width: size, height: size }]}
        >
            {MINI_BOARD.map((row, r) => (
                <View key={r} style={styles.row}>
                    {row.map((cell, c) => (
                        <View key={`${r}-${c}`} style={[styles.cell, { width: cellSize, height: cellSize }]}>
                            {cell && (
                                <Text style={[
                                    styles.cellText,
                                    { fontSize: cellSize * 0.5 },
                                    cell === 'X' ? { color: textColor } : { color: secondaryColor },
                                ]}>
                                    {cell}
                                </Text>
                            )}
                        </View>
                    ))}
                </View>
            ))}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 8,
        padding: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
    },
    cell: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.15)',
        margin: 0.5,
        borderRadius: 2,
    },
    cellText: {
        fontWeight: 'bold',
    },
});

export default ThemePreview;
