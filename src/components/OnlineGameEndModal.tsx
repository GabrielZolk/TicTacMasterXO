import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../utils/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n/useI18n';

const { width } = Dimensions.get('window');

interface OnlineGameEndModalProps {
    visible: boolean;
    winner: 'X' | 'O' | null;
    isDraw: boolean;
    gameMode: string;
    myPlayerName: string;
    opponentName: string;
    isHost: boolean;
    opponentWantsRematch: boolean;
    onPlayAgain: () => void;
    onExit: () => void;
}

const OnlineGameEndModal: React.FC<OnlineGameEndModalProps> = ({
    visible,
    winner,
    isDraw,
    gameMode,
    myPlayerName,
    opponentName,
    isHost,
    opponentWantsRematch,
    onPlayAgain,
    onExit,
}) => {
    const { colors } = useTheme();
    const { t } = useI18n();
    const scaleAnim = React.useRef(new Animated.Value(0)).current;
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    const [iWantRematch, setIWantRematch] = useState(false);

    useEffect(() => {
        if (visible) {
            setIWantRematch(false); // Reset internal state when visible
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, fadeAnim, scaleAnim]);

    const handlePlayAgainPress = () => {
        setIWantRematch(true);
        onPlayAgain();
    };

    const getResultInfo = () => {
        if (isDraw) {
            return {
                title: 'Empate!',
                subtitle: 'Ambos jogaram bem.',
                icon: 'hand-right-outline' as const,
                color: COLORS.warning,
                emoji: '🤝',
            };
        } else if (winner) {
            // Logic to determine if "I" won or lost
            // winner is 'X' or 'O'
            // Need to know my symbol. 
            // Assuming standard: Host is X, Guest is O (but this might change if we implement swap turn)
            // Actually simpler: pass 'winner === mySymbol'

            // Since we don't have exact symbol prop here easily without refactoring, 
            // let's rely on standard X=Host O=Guest logic or assume the parent passes correct winner info?
            // Actually, let's just show who won by name.

            const winnerIsHost = winner === 'X';
            const amIWinner = (isHost && winnerIsHost) || (!isHost && !winnerIsHost);
            const winnerName = winnerIsHost ? (isHost ? myPlayerName : opponentName) : (isHost ? opponentName : myPlayerName);

            return {
                title: amIWinner ? 'Vitória!' : 'Derrota',
                subtitle: amIWinner ? 'Parabéns pela vitória!' : 'Mais sorte na próxima vez!',
                icon: amIWinner ? 'trophy-outline' : 'sad-outline',
                color: amIWinner ? COLORS.success : COLORS.error,
                emoji: amIWinner ? '🏆' : '😔',
                winnerName
            };
        }
        return {
            title: 'Fim de Jogo',
            subtitle: '',
            icon: 'flag-outline',
            color: COLORS.info,
            emoji: '🏁',
        };
    };

    const resultInfo = getResultInfo();

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none">
            <Animated.View
                style={[styles.overlay, { opacity: fadeAnim }]}
            >
                <Animated.View
                    style={[
                        styles.modalContainer,
                        {
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <LinearGradient
                        colors={[colors.background, colors.background + 'E0']}
                        style={styles.modal}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={[styles.iconContainer, { backgroundColor: resultInfo.color + '20' }]}>
                                <Text style={styles.emoji}>{resultInfo.emoji}</Text>
                                <Ionicons
                                    name={resultInfo.icon}
                                    size={32}
                                    color={resultInfo.color}
                                    style={styles.headerIcon}
                                />
                            </View>

                            <Text style={[styles.title, { color: colors.text }]}>
                                {resultInfo.title}
                            </Text>

                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                {resultInfo.subtitle}
                            </Text>
                        </View>

                        {/* Status Rematch */}
                        <View style={styles.rematchStatusContainer}>
                            {/* Me Status */}
                            <View style={styles.playerStatus}>
                                <Text style={[styles.playerName, { color: colors.text }]}>{myPlayerName} (Você)</Text>
                                {iWantRematch ? (
                                    <View style={[styles.badge, { backgroundColor: COLORS.success }]}>
                                        <Ionicons name="checkmark" size={12} color="white" />
                                        <Text style={styles.badgeText}>Pronto</Text>
                                    </View>
                                ) : (
                                    <View style={[styles.badge, { backgroundColor: COLORS.warning }]}>
                                        <Text style={styles.badgeText}>Aguardando...</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.vsDivider}>
                                <View style={[styles.line, { backgroundColor: colors.border }]} />
                            </View>

                            {/* Opponent Status */}
                            <View style={styles.playerStatus}>
                                <Text style={[styles.playerName, { color: colors.text }]}>{opponentName}</Text>
                                {opponentWantsRematch ? (
                                    <View style={[styles.badge, { backgroundColor: COLORS.success }]}>
                                        <Ionicons name="checkmark" size={12} color="white" />
                                        <Text style={styles.badgeText}>Pronto</Text>
                                    </View>
                                ) : (
                                    <View style={[styles.badge, { backgroundColor: COLORS.warning }]}>
                                        <Text style={styles.badgeText}>Aguardando...</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.buttonContainer}>
                            {!iWantRematch ? (
                                <TouchableOpacity
                                    style={[styles.button, styles.primaryButton, { backgroundColor: COLORS.xColor }]}
                                    onPress={handlePlayAgainPress}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="refresh-outline" size={20} color="white" />
                                    <Text style={styles.primaryButtonText}>
                                        Jogar Novamente
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.waitingContainer}>
                                    <ActivityIndicator size="small" color={colors.textSecondary} />
                                    <Text style={[styles.waitingText, { color: colors.textSecondary }]}>
                                        {opponentWantsRematch ? 'Iniciando nova partida...' : 'Aguardando oponente...'}
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.button, styles.secondaryButton, { borderColor: colors.secondary }]}
                                onPress={onExit}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="exit-outline" size={20} color={colors.error} />
                                <Text style={[styles.secondaryButtonText, { color: colors.error }]}>
                                    Sair da Sala
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
    },
    modalContainer: {
        width: width * 0.85,
        maxWidth: 400,
    },
    modal: {
        borderRadius: 24,
        padding: 24,
        ...SHADOWS.heavy,
        borderWidth: 1,
        borderColor: COLORS.darkGray + '40',
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        position: 'relative',
    },
    emoji: {
        fontSize: 28,
        position: 'absolute',
        top: 6,
        right: 6,
    },
    headerIcon: {
        marginTop: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.8,
    },
    rematchStatusContainer: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        gap: 12
    },
    playerStatus: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    playerName: {
        fontSize: 16,
        fontWeight: '600',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    vsDivider: {
        height: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 4
    },
    line: {
        flex: 1,
        height: 1,
        width: '100%',
        opacity: 0.2
    },
    buttonContainer: {
        gap: 12,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
    },
    primaryButton: {
        ...SHADOWS.medium,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        borderWidth: 2,
        backgroundColor: 'transparent',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    waitingContainer: {
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10
    },
    waitingText: {
        fontSize: 14,
        fontWeight: '500'
    }
});

export default OnlineGameEndModal;
