import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
  
    StatusBar,
    TouchableOpacity,
    Alert,
    Share,
    Clipboard,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

import { RootStackParamList, GameMode } from '../types/game';
import { useGame } from '../contexts/GameContext';
import AppHeader from '../components/AppHeader';
import CustomButton from '../components/CustomButton';
import {
    COLORS,
    SPACING,
    BORDER_RADIUS,
    SHADOWS,
    createTextStyle,
} from '../utils/theme';
import { firebaseService } from '../services/firebaseService';
import { useI18n } from '../i18n/useI18n';
import { ConnectionStatus, PeerMessage, RoomInfo } from '../types/online';

type OnlineWaitingRoomScreenNavigationProp = StackNavigationProp<RootStackParamList, any>;
type OnlineWaitingRoomScreenRouteProp = RouteProp<{
    params: {
        mode: GameMode;
        roomCode: string;
        playerName: string;
        isHost: boolean;
    };
}, 'params'>;

const OnlineWaitingRoomScreen: React.FC = () => {
    const navigation = useNavigation<OnlineWaitingRoomScreenNavigationProp>();
    const route = useRoute<OnlineWaitingRoomScreenRouteProp>();
    const { mode, roomCode, playerName, isHost } = route.params;
    const { playSound, triggerHaptics } = useGame();
    const { t } = useI18n();

    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
        firebaseService.getConnectionStatus()
    );
    const [opponentName, setOpponentName] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [opponentReady, setOpponentReady] = useState(false);

    useEffect(() => {
        // Setup connection status listener
        firebaseService.onConnectionStatus((status) => {
            setConnectionStatus(status);

            if (status === 'connected') {
                playSound('click');
                triggerHaptics('medium');
            }
        });

        // Setup message listener
        firebaseService.onMessage((message: PeerMessage) => {
            handlePeerMessage(message);
        });

        // Setup room update listener
        firebaseService.onRoomUpdate((room: RoomInfo) => {
            console.log('🔄 Room update received:', { isHost, room });
            if (isHost) {
                // Update guest ready status
                if (room.guest?.ready) {
                    console.log('✅ Guest is ready!');
                    setOpponentReady(true);
                }
                // Update guest name (always update to ensure sync)
                if (room.guest?.name) {
                    setOpponentName(room.guest.name);
                }
            } else {
                // Update host ready status
                if (room.host.ready) {
                    console.log('✅ Host is ready!');
                    setOpponentReady(true);
                }
                // Update host name (always update to ensure sync)
                if (room.host.name) {
                    setOpponentName(room.host.name);
                }
            }
        });

        // Cleanup on unmount
        return () => {
            // Don't disconnect here - will disconnect when leaving game or explicitly
        };
    }, []);

    const handlePeerMessage = (message: PeerMessage) => {
        console.log('📨 Received message in waiting room:', message);

        switch (message.type) {
            case 'join':
                // Guest joined the room
                if (isHost && message.payload?.playerName) {
                    setOpponentName(message.payload.playerName);
                    playSound('button');
                    triggerHaptics('heavy');

                    // Send sync message back to guest
                    firebaseService.sendMessage({
                        type: 'sync',
                        payload: {
                            hostName: playerName,
                            mode,
                        },
                    });
                }
                break;

            case 'sync':
                // Host sent sync data
                if (!isHost && message.payload?.hostName) {
                    setOpponentName(message.payload.hostName);
                }
                break;

            case 'ready':
                // Opponent is ready
                setOpponentReady(true);
                playSound('click');
                triggerHaptics('light');
                break;

            case 'leave':
                // Opponent left
                Alert.alert(t('opponentLeftTitle'), t('opponentLeftRoomBody'), [
                    {
                        text: t('okAction'),
                        onPress: handleLeaveRoom,
                    },
                ]);
                break;

            default:
                break;
        }
    };

    // Start game when both players are ready
    useEffect(() => {
        console.log('🎮 Game start check:', { isReady, opponentReady, connectionStatus, isHost, opponentName });
        if (isReady && opponentReady && connectionStatus === 'connected' && opponentName) {
            console.log('🚀 Starting game for', isHost ? 'HOST' : 'GUEST');
            // Small delay for better UX
            setTimeout(() => {
                navigation.replace('Game' as any, {
                    mode,
                    opponent: 'online',
                    roomCode,
                    playerName,
                    isHost,
                    opponentName,
                });
            }, 1000);
        }
    }, [isReady, opponentReady, connectionStatus, isHost, mode, roomCode, playerName, navigation, opponentName]);

    const handleReady = () => {
        if (!opponentName) {
            Alert.alert(t('waitTitle'), t('waitingForPlayerJoin'));
            return;
        }

        setIsReady(true);
        firebaseService.sendReady();
        playSound('button');
        triggerHaptics('heavy');
    };

    const handleCopyCode = async () => {
        await Clipboard.setString(roomCode);
        Alert.alert(t('copiedTitle'), t('copiedBody', { code: roomCode }));
        playSound('click');
        triggerHaptics('light');
    };

    const handleShareCode = async () => {
        try {
            await Share.share({
                message: t('shareRoomMessage', { code: roomCode }),
            });
            playSound('click');
            triggerHaptics('light');
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleLeaveRoom = () => {
        firebaseService.leaveRoom();
        navigation.goBack();
        playSound('button');
        triggerHaptics('light');
    };

    const confirmLeave = () => {
        Alert.alert(
            t('leaveRoom'),
            t('leaveRoomConfirmBody'),
            [
                { text: t('cancel'), style: 'cancel' },
                { text: t('leave'), style: 'destructive', onPress: handleLeaveRoom },
            ]
        );
    };

    // Icon + the mode's own i18n title, so the room header follows the language.
    const MODE_ICONS: Record<string, string> = {
        classic: '🎯',
        infinity: '♾️',
        gravity: '🪐',
        blind: '🙈',
        bigBoard: '🏟️',
        survival: '❤️',
        blitz: '⚡',
        reverse: '🔄',
        bomb: '💣',
        mirror: '🪞',
        mad: '🎲',
        gobble: '🍽️',
    };

    const getModeName = (gameMode: string): string => {
        const icon = MODE_ICONS[gameMode];
        if (!icon) return gameMode;
        return `${icon} ${t(`${gameMode}.title` as any)}`;
    };

    return (
        <LinearGradient colors={COLORS.primaryGradient as any} style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBackground} />
            <SafeAreaView style={styles.safeArea}>

                {/* Header */}
                <AppHeader
                    title={t('waitingRoomTitle')}
                    showBackButton={true}
                    showHomeButton={false}
                    onBackPress={confirmLeave}
                />

                {/* Content with ScrollView */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                >

                    {/* Room Code Display */}
                    <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.codeContainer}>
                        <Text style={styles.codeLabel}>{t('roomCodeLabel')}</Text>
                        <View style={styles.codeBox}>
                            <Text style={styles.codeText}>{roomCode}</Text>
                        </View>

                        {/* Game Mode Badge */}
                        <View style={styles.modeBadge}>
                            <Ionicons name="game-controller-outline" size={16} color={COLORS.info} />
                            <Text style={styles.modeBadgeText}>Modo: {getModeName(mode)}</Text>
                        </View>

                        {isHost && (
                            <View style={styles.shareButtons}>
                                <TouchableOpacity style={styles.shareButton} onPress={handleCopyCode}>
                                    <Ionicons name="copy-outline" size={20} color={COLORS.white} />
                                    <Text style={styles.shareButtonText}>{t('copyAction')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.shareButton} onPress={handleShareCode}>
                                    <Ionicons name="share-social-outline" size={20} color={COLORS.white} />
                                    <Text style={styles.shareButtonText}>{t('shareAction')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Animated.View>

                    {/* Players Status */}
                    <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.playersContainer}>
                        {/* Your Card */}
                        <View style={styles.playerCard}>
                            <View style={styles.playerIcon}>
                                <Ionicons name="person" size={30} color={isReady ? COLORS.success : COLORS.xColor} />
                            </View>
                            <Text style={styles.playerName}>{playerName} (Você)</Text>
                            <View style={[styles.statusBadge, { backgroundColor: isReady ? COLORS.success : COLORS.warning }]}>
                                <Text style={styles.statusText}>
                                    {isReady ? t('readyUpper') : t('waitingBadge')}
                                </Text>
                            </View>
                        </View>

                        {/* VS Divider */}
                        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.vsDivider}>
                            <Text style={styles.vsText}>VS</Text>
                        </Animated.View>

                        {/* Opponent Card */}
                        <View style={[styles.playerCard, !opponentName && styles.playerCardWaiting]}>
                            <View style={styles.playerIcon}>
                                <Ionicons
                                    name={opponentName ? "person" : "person-add-outline"}
                                    size={30}
                                    color={opponentReady ? COLORS.success : COLORS.oColor}
                                />
                            </View>
                            <Text style={styles.playerName}>
                                {opponentName || t('waitingShort')}
                            </Text>
                            {opponentName && (
                                <View style={[styles.statusBadge, { backgroundColor: opponentReady ? COLORS.success : COLORS.warning }]}>
                                    <Text style={styles.statusText}>
                                        {opponentReady ? t('readyUpper') : t('waitingBadge')}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </Animated.View>

                    {/* Ready Button */}
                    <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.buttonContainer}>
                        {!isReady ? (
                            <CustomButton
                                title={`✅ ${t('imReady')}`}
                                onPress={handleReady}
                                disabled={!opponentName}
                                variant="primary"
                            />
                        ) : (
                            <View style={styles.waitingMessage}>
                                <Ionicons name="time-outline" size={24} color={COLORS.info} />
                                <Text style={styles.waitingText}>
                                    {opponentReady ? 'Iniciando jogo...' : t('waitingOpponentReady')}
                                </Text>
                            </View>
                        )}
                    </Animated.View>

                    {/* Leave Button */}
                    <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.leaveButtonContainer}>
                        <CustomButton
                            title={`❌ ${t('leaveRoom')}`}
                            onPress={confirmLeave}
                            variant="secondary"
                        />
                    </Animated.View>

                    {/* Info Card */}
                    {isHost && !opponentName && (
                        <Animated.View entering={FadeInUp.delay(700).duration(600)} style={styles.infoCard}>
                            <Ionicons name="information-circle-outline" size={24} color={COLORS.gold} />
                            <View style={styles.infoText}>
                                <Text style={styles.infoTitle}>💡 Aguardando Jogador</Text>
                                <Text style={styles.infoDescription}>
                                    Compartilhe o código <Text style={styles.codeInText}>{roomCode}</Text> com seu amigo para que ele possa entrar na sala!
                                </Text>
                            </View>
                        </Animated.View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.xl * 2,
    },
    codeContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    codeLabel: {
        ...createTextStyle('md', 'semibold'),
        color: COLORS.lightGray,
        marginBottom: SPACING.sm,
    },
    codeBox: {
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 2,
        borderColor: COLORS.success,
        ...SHADOWS.medium,
    },
    codeText: {
        ...createTextStyle('xxxl', 'extrabold'),
        color: COLORS.success,
        letterSpacing: 4,
    },
    modeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.info + '20',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.md,
        marginTop: SPACING.md,
        gap: SPACING.xs,
        borderWidth: 1,
        borderColor: COLORS.info + '40',
    },
    modeBadgeText: {
        ...createTextStyle('sm', 'semibold'),
        color: COLORS.info,
    },
    shareButtons: {
        flexDirection: 'row',
        marginTop: SPACING.md,
        gap: SPACING.md,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.darkSecondary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        gap: SPACING.xs,
    },
    shareButtonText: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.white,
    },
    playersContainer: {
        marginBottom: SPACING.xl,
    },
    playerCard: {
        backgroundColor: COLORS.darkSecondary + 'CC',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        alignItems: 'center',
        marginBottom: SPACING.md,
        borderWidth: 2,
        borderColor: COLORS.darkGray,
        ...SHADOWS.light,
    },
    playerCardWaiting: {
        opacity: 0.6,
    },
    playerIcon: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: COLORS.darkBackground,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    playerName: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.white,
        marginBottom: SPACING.sm,
    },
    statusBadge: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.sm,
    },
    statusText: {
        ...createTextStyle('sm', 'semibold'),
        color: COLORS.white,
    },
    vsDivider: {
        alignItems: 'center',
        marginVertical: SPACING.sm,
    },
    vsText: {
        ...createTextStyle('xxl', 'extrabold'),
        color: COLORS.gold,
    },
    buttonContainer: {
        marginBottom: SPACING.md,
    },
    waitingMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.darkSecondary + '80',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        gap: SPACING.sm,
    },
    waitingText: {
        ...createTextStyle('md', 'medium'),
        color: COLORS.info,
    },
    leaveButtonContainer: {
        marginBottom: SPACING.md,
    },
    infoCard: {
        backgroundColor: COLORS.darkSecondary + '80',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        marginTop: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.gold + '40',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    infoTitle: {
        ...createTextStyle('md', 'semibold'),
        color: COLORS.gold,
        marginBottom: SPACING.xs,
    },
    infoDescription: {
        ...createTextStyle('sm', 'regular'),
        color: COLORS.lightGray,
        lineHeight: 20,
    },
    codeInText: {
        ...createTextStyle('sm', 'bold'),
        color: COLORS.success,
    },
});

export default OnlineWaitingRoomScreen;

