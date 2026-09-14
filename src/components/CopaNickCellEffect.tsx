import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/theme';
import { Player } from '../types/game';

interface CopaNickCellEffectProps {
    theme: string;
    player: Player | null;
    isWinning: boolean;
}

/**
 * "Figurinha colada" effect for the Copa Nick theme:
 * - placing a piece triggers a quick golden foil shine sweep across the cell
 *   (like sticking a rare holographic sticker in the album)
 * - winning cells loop the shine, turning the line into gold foil stickers
 */
const CopaNickCellEffect: React.FC<CopaNickCellEffectProps> = ({
    theme,
    player,
    isWinning,
}) => {
    const shineAnim = useRef(new Animated.Value(-1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const loopRef = useRef<Animated.CompositeAnimation | null>(null);

    // Single shine sweep when a piece is placed
    useEffect(() => {
        if (theme !== 'copa_nick' || !player) return;

        shineAnim.setValue(-1);
        Animated.timing(shineAnim, {
            toValue: 1,
            duration: 650,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start();
    }, [theme, player]);

    // Looping gold foil on the winning line
    useEffect(() => {
        if (theme !== 'copa_nick') return;

        if (isWinning && player) {
            loopRef.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.timing(glowAnim, { toValue: 0.35, duration: 500, useNativeDriver: true }),
                ])
            );
            loopRef.current.start();

            const shineLoop = Animated.loop(
                Animated.sequence([
                    Animated.timing(shineAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                    Animated.timing(shineAnim, { toValue: -1, duration: 0, useNativeDriver: true }),
                    Animated.delay(400),
                ])
            );
            shineLoop.start();
            return () => {
                loopRef.current?.stop();
                shineLoop.stop();
                glowAnim.setValue(0);
            };
        } else {
            loopRef.current?.stop();
            glowAnim.setValue(0);
        }
    }, [theme, isWinning, player]);

    if (theme !== 'copa_nick' || !player) return null;

    const translateX = shineAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: [-60, 60],
    });

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Gold glow under winning stickers */}
            {isWinning && (
                <Animated.View style={[styles.winGlow, { opacity: glowAnim }]} />
            )}

            {/* Foil shine sweep */}
            <View style={styles.shineClip}>
                <Animated.View style={[styles.shineBar, { transform: [{ translateX }, { rotate: '20deg' }] }]}>
                    <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.45)', 'rgba(255,233,138,0.35)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.shineGradient}
                    />
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    winGlow: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.copaNickGold + '30',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: COLORS.copaNickGold + '90',
    },
    shineClip: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        borderRadius: 8,
    },
    shineBar: {
        position: 'absolute',
        top: -20,
        bottom: -20,
        width: 34,
        left: '30%',
    },
    shineGradient: {
        flex: 1,
    },
});

export default CopaNickCellEffect;
