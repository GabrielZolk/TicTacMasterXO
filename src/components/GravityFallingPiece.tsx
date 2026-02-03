import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withSequence,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { Player } from '../types/game';
import {
    COLORS,
    GAME_DIMENSIONS,
    BORDER_RADIUS,
    getPlayerColor,
} from '../utils/theme';
import { useEquippedSymbols } from '../hooks/useEquippedItems';

interface GravityFallingPieceProps {
    player: Player;
    startRow: number;
    endRow: number;
    col: number;
    onAnimationComplete: () => void;
    cellSize?: number;
    cellGap?: number;
}

const GravityFallingPiece: React.FC<GravityFallingPieceProps> = ({
    player,
    startRow,
    endRow,
    col,
    onAnimationComplete,
    cellSize = GAME_DIMENSIONS.cellSize,
    cellGap = 8,
}) => {
    const equippedSymbols = useEquippedSymbols();
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);
    const opacity = useSharedValue(1);

    // Calculate fall distance
    const rowsToFall = endRow - startRow;
    const fallDistance = rowsToFall * (cellSize + cellGap);

    useEffect(() => {
        // Entry animation
        scale.value = withSequence(
            withTiming(1.1, { duration: 100 }),
            withTiming(1, { duration: 100 })
        );

        // Slight rotation during fall
        rotation.value = withSequence(
            withTiming(player === 'X' ? 5 : -5, { duration: 100 }),
            withTiming(0, { duration: 200 })
        );

        // Falling animation with gravity-like easing
        translateY.value = withTiming(fallDistance, {
            duration: 200 + (rowsToFall * 120), // Slightly slower for better visibility
            easing: Easing.bezier(0.33, 0, 0.67, 1), // Gravity-like curve
        }, (finished) => {
            if (finished) {
                // Bounce effect on landing
                scale.value = withSequence(
                    withSpring(1.15, { damping: 8, stiffness: 300 }),
                    withSpring(1, { damping: 10, stiffness: 200 })
                );

                // Small rotation on impact
                rotation.value = withSequence(
                    withTiming(player === 'X' ? -3 : 3, { duration: 50 }),
                    withTiming(0, { duration: 100 })
                );

                // Call animation complete after bounce settles
                // Use opacity animation to trigger callback, but don't actually fade
                opacity.value = withTiming(0.99, { duration: 200 }, () => {
                    runOnJS(onAnimationComplete)();
                });
            }
        });
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { scale: scale.value },
            { rotate: `${rotation.value}deg` },
        ],
        opacity: opacity.value,
    }));

    const getPieceSymbol = (): string => {
        return player === 'X' ? equippedSymbols.playerX : equippedSymbols.playerO;
    };

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <View style={[styles.piece, { backgroundColor: getPlayerColor(player) + '20' }]}>
                <Text
                    style={[
                        styles.symbol,
                        {
                            color: getPlayerColor(player),
                            textShadowColor: getPlayerColor(player),
                        },
                    ]}
                >
                    {getPieceSymbol()}
                </Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 100,
    },
    piece: {
        width: GAME_DIMENSIONS.cellSize,
        height: GAME_DIMENSIONS.cellSize,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.gold + '60',
    },
    symbol: {
        fontSize: GAME_DIMENSIONS.pieceSize * 0.9,
        fontWeight: '800',
        textAlign: 'center',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
});

export default GravityFallingPiece;
