import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, createTextStyle } from '../utils/theme';
import { Player, BlitzGameState } from '../types/game';

interface BlitzTimerProps {
    gameState: BlitzGameState;
    currentPlayer: Player;
    isGameOver: boolean;
    onTimeout: (player: Player) => void;
    isPaused?: boolean; // Pause timer (e.g., during AI turn)
}

const BlitzTimer: React.FC<BlitzTimerProps> = ({
    gameState,
    currentPlayer,
    isGameOver,
    onTimeout,
    isPaused = false,
}) => {
    const [timeRemaining, setTimeRemaining] = useState(gameState.timePerMove);
    const pulseAnimation = useSharedValue(1);
    const colorProgress = useSharedValue(0);
    const timeoutCalledRef = React.useRef(false);
    const gameEndedLocallyRef = React.useRef(false); // Track if we triggered the timeout
    const lastMoveCountRef = React.useRef(gameState.moveCount); // Track move count changes
    const wasTimedOutRef = React.useRef(false); // Track previous timedOut state

    // Detect new game start
    useEffect(() => {
        const isNewGame = gameState.moveCount === 0 && lastMoveCountRef.current > 0;
        const isGameRestarted = gameState.moveCount < lastMoveCountRef.current;

        // Also detect restart after timeout with 0 moves: timedOut goes from true to false
        const isRestartAfterTimeout = wasTimedOutRef.current === true && gameState.timedOut === false && gameState.moveCount === 0;

        if (isNewGame || isGameRestarted || isRestartAfterTimeout) {
            // New game started - reset everything
            console.log('🔄 BlitzTimer: New game detected, resetting timer');
            gameEndedLocallyRef.current = false;
            timeoutCalledRef.current = false;
            setTimeRemaining(gameState.timePerMove);
            colorProgress.value = 0;
            pulseAnimation.value = 1;
        }

        lastMoveCountRef.current = gameState.moveCount;
        wasTimedOutRef.current = gameState.timedOut;
    }, [gameState.moveCount, gameState.timePerMove, gameState.timedOut]);

    // Reset timer when turn changes (during active game)
    useEffect(() => {
        // Only reset timer for turn changes if:
        // - Game is not over
        // - We haven't triggered a timeout locally
        // - Game state doesn't show timeout
        // - There are moves (not the initial state which is handled above)
        if (!isGameOver && !gameEndedLocallyRef.current && !gameState.timedOut && gameState.moveCount > 0) {
            setTimeRemaining(gameState.timePerMove);
            colorProgress.value = 0;
            timeoutCalledRef.current = false;
            pulseAnimation.value = 1;
        }
    }, [currentPlayer, gameState.currentTurnStartTime, isGameOver, gameState.timedOut]);

    // Countdown timer
    useEffect(() => {
        // Don't run timer if game is over, there's a winner, we already triggered timeout, or timer is paused
        if (isGameOver || gameState.winner || gameState.timedOut || gameEndedLocallyRef.current || isPaused) {
            return;
        }

        // Use a ref to track if we've already triggered timeout this turn
        let hasTriggeredTimeout = false;
        let intervalId: ReturnType<typeof setInterval> | null = null;

        intervalId = setInterval(() => {
            // Double-check we should still be running
            if (gameEndedLocallyRef.current || hasTriggeredTimeout) {
                if (intervalId) clearInterval(intervalId);
                return;
            }

            setTimeRemaining((prev) => {
                const newTime = Math.max(0, prev - 0.1);

                // Update color progress (0 = green, 1 = red)
                colorProgress.value = 1 - (newTime / gameState.timePerMove);

                // Start pulsing when time is low (only if time allows for it)
                const pulseThreshold = Math.min(2, gameState.timePerMove * 0.5);
                if (newTime <= pulseThreshold && newTime > 0) {
                    pulseAnimation.value = withRepeat(
                        withSequence(
                            withTiming(1.2, { duration: 150 }),
                            withTiming(1, { duration: 150 })
                        ),
                        -1
                    );
                }

                // Check if time is up and we haven't already called timeout
                if (newTime <= 0 && !timeoutCalledRef.current && !hasTriggeredTimeout && !gameEndedLocallyRef.current) {
                    timeoutCalledRef.current = true;
                    hasTriggeredTimeout = true;
                    gameEndedLocallyRef.current = true; // Mark that we triggered the game end

                    // Clear the interval immediately to prevent any more updates
                    if (intervalId) clearInterval(intervalId);

                    // Call timeout synchronously - no need for setTimeout since we've locked everything
                    console.log(`⏱️ BlitzTimer: Calling timeout for player ${currentPlayer}`);
                    onTimeout(currentPlayer);

                    return 0;
                }

                return newTime;
            });
        }, 100);

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [currentPlayer, isGameOver, gameState.winner, gameState.timedOut, gameState.timePerMove, onTimeout, isPaused]);

    const animatedContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseAnimation.value }],
    }));

    const animatedTimerStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            colorProgress.value,
            [0, 0.5, 1],
            [COLORS.success, COLORS.warning, COLORS.error]
        );
        return { backgroundColor };
    });

    // Format time display
    const formatTime = (time: number): string => {
        return time.toFixed(1);
    };

    // Calculate progress bar width
    const progressWidth = (timeRemaining / gameState.timePerMove) * 100;

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.timerContainer, animatedContainerStyle]}>
                <Animated.View style={[styles.timerBackground, animatedTimerStyle, isPaused && styles.timerPaused]}>
                    <Ionicons
                        name={isPaused ? "pause-circle-outline" : "timer-outline"}
                        size={20}
                        color={COLORS.white}
                        style={styles.icon}
                    />
                    <Text style={styles.timerText}>{formatTime(timeRemaining)}s</Text>
                </Animated.View>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                    <Animated.View
                        style={[
                            styles.progressBar,
                            animatedTimerStyle,
                            { width: `${progressWidth}%` },
                            isPaused && styles.progressBarPaused
                        ]}
                    />
                </View>
            </Animated.View>

            {/* Current player indicator */}
            <View style={styles.playerIndicator}>
                <Text style={styles.playerText}>
                    {isPaused ? (
                        <>
                            <Ionicons name="hardware-chip-outline" size={14} color={COLORS.oColor} />
                            {' IA pensando...'}
                        </>
                    ) : (
                        <>
                            Vez: <Text style={[
                                styles.playerSymbol,
                                { color: currentPlayer === 'X' ? COLORS.xColor : COLORS.oColor }
                            ]}>{currentPlayer}</Text>
                        </>
                    )}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: SPACING.sm,
    },
    timerContainer: {
        alignItems: 'center',
    },
    timerBackground: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
        minWidth: 100,
        justifyContent: 'center',
    },
    icon: {
        marginRight: SPACING.xs,
    },
    timerText: {
        ...createTextStyle('xl', 'bold'),
        color: COLORS.white,
    },
    progressContainer: {
        width: 120,
        height: 4,
        backgroundColor: COLORS.darkGray,
        borderRadius: 2,
        marginTop: SPACING.xs,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
    playerIndicator: {
        marginTop: SPACING.sm,
    },
    playerText: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.lightGray,
    },
    playerSymbol: {
        ...createTextStyle('md', 'bold'),
    },
    timerPaused: {
        opacity: 0.7,
    },
    progressBarPaused: {
        opacity: 0.5,
    },
});

export default BlitzTimer;
