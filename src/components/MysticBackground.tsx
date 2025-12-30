import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/theme';

const { width, height } = Dimensions.get('window');

interface MysticBackgroundProps {
    theme: string;
}

const MysticBackground: React.FC<MysticBackgroundProps> = ({ theme }) => {
    // Animações para diferentes efeitos
    const portal1 = useRef(new Animated.Value(0)).current;
    const portal2 = useRef(new Animated.Value(0)).current;
    const portal3 = useRef(new Animated.Value(0)).current;
    const mysticGlow = useRef(new Animated.Value(0)).current;
    const energyPulse = useRef(new Animated.Value(1)).current;

    // Create particle animations statically (always same number of hooks)
    const particle1Anim = useRef(new Animated.Value(0)).current;
    const particle2Anim = useRef(new Animated.Value(0)).current;
    const particle3Anim = useRef(new Animated.Value(0)).current;
    const particle4Anim = useRef(new Animated.Value(0)).current;
    const particle5Anim = useRef(new Animated.Value(0)).current;
    const particle6Anim = useRef(new Animated.Value(0)).current;
    const particle7Anim = useRef(new Animated.Value(0)).current;
    const particle8Anim = useRef(new Animated.Value(0)).current;
    const particleAnims = [
        particle1Anim,
        particle2Anim,
        particle3Anim,
        particle4Anim,
        particle5Anim,
        particle6Anim,
        particle7Anim,
        particle8Anim,
    ];

    useEffect(() => {
        if (theme !== 'samuel') return;

        // Animação de rotação dos portais
        const portalAnimation = Animated.loop(
            Animated.parallel([
                Animated.timing(portal1, {
                    toValue: 1,
                    duration: 15000,
                    useNativeDriver: true,
                }),
                Animated.timing(portal2, {
                    toValue: 1,
                    duration: 10000,
                    useNativeDriver: true,
                }),
                Animated.timing(portal3, {
                    toValue: 1,
                    duration: 20000,
                    useNativeDriver: true,
                }),
            ])
        );

        // Animação de brilho místico
        const glowAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(mysticGlow, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(mysticGlow, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        );

        // Animação de pulso de energia
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(energyPulse, {
                    toValue: 1.2,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(energyPulse, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );

        portalAnimation.start();
        glowAnimation.start();
        pulseAnimation.start();

        return () => {
            portalAnimation.stop();
            glowAnimation.stop();
            pulseAnimation.stop();
        };
    }, [theme]);

    // Particle animations
    useEffect(() => {
        if (theme !== 'samuel') return;

        const particleAnimations = particleAnims.map((particleAnim, index) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(index * 500),
                    Animated.timing(particleAnim, {
                        toValue: 1,
                        duration: 4000,
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

        particleAnimations.forEach(anim => anim.start());

        return () => {
            particleAnimations.forEach(anim => anim.stop());
        };
    }, [theme]);

    if (theme !== 'samuel') {
        return null;
    }

    const portal1Rotation = portal1.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const portal2Rotation = portal2.interpolate({
        inputRange: [0, 1],
        outputRange: ['360deg', '0deg'],
    });

    const portal3Rotation = portal3.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-360deg'],
    });

    const glowOpacity = mysticGlow.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.8],
    });

    return (
        <View style={styles.container} pointerEvents="none">
            {/* Portal 1 - Topo direito */}
            <Animated.View
                style={[
                    styles.portal,
                    styles.portal1,
                    {
                        transform: [
                            { rotate: portal1Rotation },
                            { scale: energyPulse },
                        ],
                    },
                ]}
            >
                <LinearGradient
                    colors={COLORS.samuelPortalGradient as any}
                    style={styles.portalGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            {/* Portal 2 - Centro esquerda */}
            <Animated.View
                style={[
                    styles.portal,
                    styles.portal2,
                    {
                        transform: [{ rotate: portal2Rotation }],
                    },
                ]}
            >
                <LinearGradient
                    colors={COLORS.samuelMysticGradient as any}
                    style={styles.portalGradient}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 1 }}
                />
            </Animated.View>

            {/* Portal 3 - Fundo centro */}
            <Animated.View
                style={[
                    styles.portal,
                    styles.portal3,
                    {
                        transform: [
                            { rotate: portal3Rotation },
                            { scale: energyPulse },
                        ],
                    },
                ]}
            >
                <LinearGradient
                    colors={[COLORS.samuelMystic, COLORS.samuelPrimary, COLORS.samuelAccent] as any}
                    style={styles.portalGradient}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
            </Animated.View>

            {/* Brilho místico central */}
            <Animated.View
                style={[
                    styles.mysticGlow,
                    {
                        opacity: glowOpacity,
                        transform: [{ scale: energyPulse }],
                    },
                ]}
            >
                <LinearGradient
                    colors={[
                        'rgba(157, 0, 255, 0)',
                        'rgba(157, 0, 255, 0.3)',
                        'rgba(255, 0, 170, 0.3)',
                        'rgba(0, 255, 204, 0.2)',
                        'rgba(255, 107, 0, 0)',
                    ]}
                    style={styles.glowGradient}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            {/* Partículas de energia */}
            {particleAnims.map((particleAnim, index) => {
                const particleOpacity = particleAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1, 0],
                });

                const particleY = particleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, -100],
                });

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.particle,
                            {
                                left: (width / 8) * index,
                                opacity: particleOpacity,
                                transform: [{ translateY: particleY }],
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.particleDot,
                                {
                                    backgroundColor:
                                        index % 3 === 0
                                            ? COLORS.samuelPrimary
                                            : index % 3 === 1
                                                ? COLORS.samuelMystic
                                                : COLORS.samuelAccent,
                                },
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
        overflow: 'hidden',
    },
    portal: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.15,
    },
    portal1: {
        top: -100,
        right: -100,
        width: 350,
        height: 350,
        borderRadius: 175,
    },
    portal2: {
        top: height * 0.4,
        left: -150,
        width: 300,
        height: 300,
    },
    portal3: {
        bottom: -80,
        left: width * 0.3,
        width: 400,
        height: 400,
        borderRadius: 200,
    },
    portalGradient: {
        flex: 1,
        borderRadius: 200,
    },
    mysticGlow: {
        position: 'absolute',
        top: height * 0.3,
        left: width * 0.2,
        width: width * 0.6,
        height: height * 0.4,
        borderRadius: 300,
    },
    glowGradient: {
        flex: 1,
        borderRadius: 300,
    },
    particle: {
        position: 'absolute',
        width: 4,
        height: 4,
    },
    particleDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 5,
    },
});

export default MysticBackground;
