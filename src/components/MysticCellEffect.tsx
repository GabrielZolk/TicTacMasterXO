import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/theme';
import { Player } from '../types/game';

interface MysticCellEffectProps {
    theme: string;
    player: Player | null;
    isWinning: boolean;
}

const MysticCellEffect: React.FC<MysticCellEffectProps> = ({
    theme,
    player,
    isWinning,
}) => {
    const glowAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    // Create particle animations statically (always same number of hooks)
    const particle1Anim = useRef(new Animated.Value(0)).current;
    const particle2Anim = useRef(new Animated.Value(0)).current;
    const particle3Anim = useRef(new Animated.Value(0)).current;
    const particle4Anim = useRef(new Animated.Value(0)).current;
    const particleAnims = [particle1Anim, particle2Anim, particle3Anim, particle4Anim];

    useEffect(() => {
        if (theme !== 'samuel' || !player) return;

        // Animação de brilho ao colocar peça
        Animated.sequence([
            Animated.timing(glowAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
                toValue: 0.5,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();

        // Animação de pulso contínuo
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Rotação mística
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 8000,
                useNativeDriver: true,
            })
        ).start();
    }, [player, theme]);

    useEffect(() => {
        if (isWinning && theme === 'samuel') {
            // Animação especial para células vencedoras
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0.3,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [isWinning, theme]);

    // Particle animations (run only when winning)
    useEffect(() => {
        if (!isWinning || theme !== 'samuel') return;

        const animations = particleAnims.map((particleAnim, index) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(index * 200),
                    Animated.timing(particleAnim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(particleAnim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            );
        });

        animations.forEach(anim => anim.start());

        return () => {
            animations.forEach(anim => anim.stop());
        };
    }, [isWinning, theme]);

    if (theme !== 'samuel' || !player) {
        return null;
    }

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Cores baseadas no jogador
    const colors = player === 'X'
        ? [COLORS.samuelPrimary, COLORS.samuelPortal, COLORS.samuelEnergy]
        : [COLORS.samuelAccent, COLORS.samuelMystic, COLORS.samuelPrimary];

    return (
        <View style={styles.container} pointerEvents="none">
            {/* Anel místico rotativo */}
            <Animated.View
                style={[
                    styles.mysticRing,
                    {
                        transform: [
                            { rotate: rotation },
                            { scale: pulseAnim },
                        ],
                        opacity: glowAnim,
                    },
                ]}
            >
                <LinearGradient
                    colors={[...colors, 'transparent'] as any}
                    style={styles.ringGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            {/* Brilho central */}
            <Animated.View
                style={[
                    styles.centerGlow,
                    {
                        opacity: glowAnim,
                        transform: [{ scale: pulseAnim }],
                    },
                ]}
            >
                <LinearGradient
                    colors={[colors[0] + '80', colors[1] + '40', 'transparent'] as any}
                    style={styles.glowGradient}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            {/* Partículas místicas */}
            {isWinning && particleAnims.map((particleAnim, index) => {
                const particleOpacity = particleAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1, 0],
                });

                const particleScale = particleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 2],
                });

                const angle = (index * 90 * Math.PI) / 180;
                const radius = 30;

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.particle,
                            {
                                opacity: particleOpacity,
                                transform: [
                                    { translateX: Math.cos(angle) * radius },
                                    { translateY: Math.sin(angle) * radius },
                                    { scale: particleScale },
                                ],
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.particleDot,
                                { backgroundColor: colors[index % colors.length] },
                            ]}
                        />
                    </Animated.View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mysticRing: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    ringGradient: {
        flex: 1,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    centerGlow: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    glowGradient: {
        flex: 1,
        borderRadius: 30,
    },
    particle: {
        position: 'absolute',
        width: 6,
        height: 6,
    },
    particleDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 8,
    },
});

export default MysticCellEffect;
