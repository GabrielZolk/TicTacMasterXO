import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Cell, GameMove, Player } from '../types/game';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createTextStyle } from '../utils/theme';
import { useI18n } from '../i18n/useI18n';

const { width } = Dimensions.get('window');

interface ReplayModalProps {
    visible: boolean;
    moves: GameMove[];
    boardSize: number;
    winner: Player | null;
    onClose: () => void;
    isPremium: boolean; // If false, show "premium required" overlay
}

const ReplayModal: React.FC<ReplayModalProps> = ({
    visible,
    moves,
    boardSize,
    winner,
    onClose,
    isPremium,
}) => {
    const { t } = useI18n();
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [board, setBoard] = useState<Cell[][]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Build empty board
    useEffect(() => {
        if (visible) {
            setCurrentStep(0);
            setIsPlaying(false);
            setBoard(Array(boardSize).fill(null).map(() => Array(boardSize).fill(null)));
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [visible, boardSize]);

    // Rebuild board up to currentStep
    useEffect(() => {
        const newBoard: Cell[][] = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
        for (let i = 0; i < currentStep && i < moves.length; i++) {
            const move = moves[i];
            newBoard[move.row][move.col] = move.player;
        }
        setBoard(newBoard);
    }, [currentStep, moves, boardSize]);

    // Auto-play
    useEffect(() => {
        if (isPlaying && currentStep < moves.length) {
            timerRef.current = setTimeout(() => {
                setCurrentStep(prev => prev + 1);
            }, 800);
        } else if (currentStep >= moves.length) {
            setIsPlaying(false);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isPlaying, currentStep, moves.length]);

    const handlePlay = () => {
        if (currentStep >= moves.length) {
            setCurrentStep(0);
        }
        setIsPlaying(true);
    };

    const handlePause = () => setIsPlaying(false);

    const handleStepForward = () => {
        setIsPlaying(false);
        if (currentStep < moves.length) setCurrentStep(prev => prev + 1);
    };

    const handleStepBack = () => {
        setIsPlaying(false);
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    const handleReset = () => {
        setIsPlaying(false);
        setCurrentStep(0);
    };

    if (!visible) return null;

    const cellSize = Math.min((width * 0.7) / boardSize, 70);
    const currentMove = currentStep > 0 && currentStep <= moves.length ? moves[currentStep - 1] : null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('replayTitle')}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>

                    {!isPremium ? (
                        // Premium gate
                        <View style={styles.premiumGate}>
                            <Ionicons name="lock-closed" size={48} color={COLORS.gold} />
                            <Text style={styles.premiumTitle}>{t('premiumFeature')}</Text>
                            <Text style={styles.premiumDesc}>
                                Assine para assistir o replay das suas partidas
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* Move counter */}
                            <Text style={styles.stepText}>
                                Jogada {currentStep}/{moves.length}
                                {currentMove && ` — ${currentMove.player} (${currentMove.row + 1},${currentMove.col + 1})`}
                            </Text>

                            {/* Board */}
                            <View style={styles.boardContainer}>
                                {board.map((row, r) => (
                                    <View key={r} style={styles.row}>
                                        {row.map((cell, c) => {
                                            const isLastMove = currentMove && currentMove.row === r && currentMove.col === c;
                                            return (
                                                <View
                                                    key={`${r}-${c}`}
                                                    style={[
                                                        styles.cell,
                                                        { width: cellSize, height: cellSize },
                                                        isLastMove && styles.cellHighlight,
                                                    ]}
                                                >
                                                    <Text style={[
                                                        styles.cellText,
                                                        { fontSize: cellSize * 0.5 },
                                                        cell === 'X' && { color: COLORS.xColor },
                                                        cell === 'O' && { color: COLORS.oColor },
                                                    ]}>
                                                        {cell || ''}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                ))}
                            </View>

                            {/* Result */}
                            {currentStep >= moves.length && (
                                <Text style={styles.resultText}>
                                    {winner ? t('replayWinner', { player: winner }) : t('replayDraw')}
                                </Text>
                            )}

                            {/* Controls */}
                            <View style={styles.controls}>
                                <TouchableOpacity onPress={handleReset} style={styles.controlBtn}>
                                    <Ionicons name="play-skip-back" size={24} color={COLORS.white} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleStepBack} style={styles.controlBtn}>
                                    <Ionicons name="play-back" size={24} color={COLORS.white} />
                                </TouchableOpacity>
                                {isPlaying ? (
                                    <TouchableOpacity onPress={handlePause} style={[styles.controlBtn, styles.playBtn]}>
                                        <Ionicons name="pause" size={28} color={COLORS.white} />
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity onPress={handlePlay} style={[styles.controlBtn, styles.playBtn]}>
                                        <Ionicons name="play" size={28} color={COLORS.white} />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={handleStepForward} style={styles.controlBtn}>
                                    <Ionicons name="play-forward" size={24} color={COLORS.white} />
                                </TouchableOpacity>
                            </View>
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
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    modal: {
        width: width * 0.9,
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        ...SHADOWS.heavy,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    title: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.white,
    },
    closeBtn: {
        padding: 4,
    },
    stepText: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.lightGray,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    boardContainer: {
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    row: {
        flexDirection: 'row',
    },
    cell: {
        borderWidth: 1,
        borderColor: COLORS.darkTertiary,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.darkBackground,
        margin: 1,
        borderRadius: 4,
    },
    cellHighlight: {
        borderColor: COLORS.gold,
        borderWidth: 2,
        backgroundColor: COLORS.gold + '15',
    },
    cellText: {
        fontWeight: 'bold',
    },
    resultText: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.gold,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.md,
    },
    controlBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.darkTertiary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.xColor,
    },
    premiumGate: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
        gap: SPACING.md,
    },
    premiumTitle: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.gold,
    },
    premiumDesc: {
        ...createTextStyle('sm', 'regular'),
        color: COLORS.lightGray,
        textAlign: 'center',
    },
});

export default ReplayModal;
