import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

import { RootStackParamList, GameMode } from '../types/game';
import { useGame } from '../contexts/GameContext';
import { useI18n } from '../i18n/useI18n';
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
import { ConnectionStatus } from '../types/online';

type OnlineLobbyScreenNavigationProp = StackNavigationProp<RootStackParamList, any>;
type OnlineLobbyScreenRouteProp = RouteProp<{ params: { mode: GameMode } }, 'params'>;

const OnlineLobbyScreen: React.FC = () => {
    const navigation = useNavigation<OnlineLobbyScreenNavigationProp>();
    const route = useRoute<OnlineLobbyScreenRouteProp>();
    const { mode } = route.params;
    const { playSound, triggerHaptics } = useGame();
    const { t } = useI18n();

    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [isJoiningRoom, setIsJoiningRoom] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [playerName, setPlayerName] = useState('Jogador');
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [showJoinInput, setShowJoinInput] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        // Inicializar Firebase quando entrar na tela
        const initializeFirebase = async () => {
            setIsInitializing(true);
            try {
                await firebaseService.initialize();
                firebaseService.onConnectionStatus((status) => {
                    setConnectionStatus(status);
                });
                setIsInitializing(false);
            } catch (error) {
                console.error('Failed to initialize Firebase:', error);
                Alert.alert('Erro', 'Não foi possível conectar ao Firebase');
                setIsInitializing(false);
            }
        };

        initializeFirebase();

        // Cleanup quando sair da tela
        return () => {
            // Não destruir o peer aqui, apenas desconectar se necessário
        };
    }, []);

    const handleGoBack = async () => {
        await triggerHaptics('light');
        await playSound('button');
        navigation.goBack();
    };

    const handleCreateRoom = async () => {
        if (playerName.trim().length === 0) {
            Alert.alert('Atenção', 'Digite seu nome');
            return;
        }

        await triggerHaptics('medium');
        await playSound('button');
        setIsCreatingRoom(true);

        try {
            const generatedRoomCode = await firebaseService.createRoom(mode, playerName);

            // Navegar para tela de espera
            navigation.navigate('OnlineWaitingRoom' as any, {
                mode,
                roomCode: generatedRoomCode,
                playerName,
                isHost: true,
            });
        } catch (error) {
            console.error('Failed to create room:', error);
            Alert.alert('Erro', 'Não foi possível criar a sala');
        } finally {
            setIsCreatingRoom(false);
        }
    };

    const handleJoinRoom = async () => {
        if (playerName.trim().length === 0) {
            Alert.alert('Atenção', 'Digite seu nome');
            return;
        }

        if (roomCode.trim().length !== 6) {
            Alert.alert('Atenção', 'Código da sala deve ter 6 caracteres');
            return;
        }

        await triggerHaptics('medium');
        await playSound('button');
        setIsJoiningRoom(true);

        try {
            await firebaseService.joinRoom(roomCode.toUpperCase(), playerName);

            // Navegar para tela de espera
            navigation.navigate('OnlineWaitingRoom' as any, {
                mode,
                roomCode: roomCode.toUpperCase(),
                playerName,
                isHost: false,
            });
        } catch (error) {
            console.error('Failed to join room:', error);
            Alert.alert('Erro', 'Não foi possível entrar na sala. Verifique o código.');
        } finally {
            setIsJoiningRoom(false);
        }
    };

    const toggleJoinInput = () => {
        setShowJoinInput(!showJoinInput);
        triggerHaptics('light');
    };

    return (
        <LinearGradient colors={COLORS.primaryGradient} style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBackground} />
            <SafeAreaView style={styles.safeArea}>

                {/* Header */}
                <AppHeader
                    title="Modo Online 🌍"
                    showBackButton={true}
                    showHomeButton={true}
                    onBackPress={handleGoBack}
                />

                {/* Content */}
                <View style={styles.content}>

                    {/* Title Section */}
                    <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.titleSection}>
                        <Text style={styles.title}>Jogue pela Internet</Text>
                        <Text style={styles.subtitle}>
                            Conecte-se com um amigo e jogue de qualquer lugar
                        </Text>
                    </Animated.View>

                    {/* Player Name Input */}
                    <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>👤 Seu Nome</Text>
                        <TextInput
                            style={styles.input}
                            value={playerName}
                            onChangeText={setPlayerName}
                            placeholder="Digite seu nome..."
                            placeholderTextColor={COLORS.gray}
                            maxLength={15}
                        />
                    </Animated.View>

                    {/* Create Room Button */}
                    <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.buttonContainer}>
                        <CustomButton
                            title="🎮 Criar Nova Sala"
                            onPress={handleCreateRoom}
                            loading={isCreatingRoom || isInitializing}
                            disabled={isCreatingRoom || isJoiningRoom || isInitializing}
                            variant="primary"
                        />
                    </Animated.View>

                    {/* Divider */}
                    <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.dividerContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>OU</Text>
                        <View style={styles.divider} />
                    </Animated.View>

                    {/* Join Room Toggle */}
                    <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.buttonContainer}>
                        <CustomButton
                            title={showJoinInput ? "❌ Cancelar" : "🔍 Entrar em uma Sala"}
                            onPress={toggleJoinInput}
                            disabled={isCreatingRoom || isJoiningRoom || isInitializing}
                            variant="secondary"
                        />
                    </Animated.View>

                    {/* Join Room Input (Conditional) */}
                    {showJoinInput && (
                        <Animated.View entering={FadeInDown.duration(400)} style={styles.joinContainer}>
                            <Text style={styles.inputLabel}>🔑 Código da Sala</Text>
                            <TextInput
                                style={styles.input}
                                value={roomCode}
                                onChangeText={(text) => setRoomCode(text.toUpperCase())}
                                placeholder="ABC123"
                                placeholderTextColor={COLORS.gray}
                                maxLength={6}
                                autoCapitalize="characters"
                            />

                            <CustomButton
                                title="Entrar na Sala"
                                onPress={handleJoinRoom}
                                loading={isJoiningRoom}
                                disabled={roomCode.length !== 6 || isJoiningRoom}
                                variant="success"
                            />
                        </Animated.View>
                    )}

                    {/* Info Card */}
                    <Animated.View entering={FadeInUp.delay(700).duration(600)} style={styles.infoCard}>
                        <Ionicons name="information-circle-outline" size={24} color={COLORS.gold} />
                        <View style={styles.infoText}>
                            <Text style={styles.infoTitle}>💡 Como funciona?</Text>
                            <Text style={styles.infoDescription}>
                                • Crie uma sala e compartilhe o código com seu amigo{'\n'}
                                • Ou peça o código e entre na sala dele{'\n'}
                                • Aguarde ambos ficarem prontos e jogue!
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Connection Status */}
                    {connectionStatus !== 'disconnected' && (
                        <Animated.View entering={FadeInUp.duration(300)} style={styles.statusContainer}>
                            <View style={[
                                styles.statusDot,
                                { backgroundColor: connectionStatus === 'connected' ? COLORS.success : COLORS.warning }
                            ]} />
                            <Text style={styles.statusText}>
                                {connectionStatus === 'connecting' && 'Conectando...'}
                                {connectionStatus === 'connected' && 'Conectado'}
                                {connectionStatus === 'waiting' && 'Aguardando jogador...'}
                                {connectionStatus === 'error' && 'Erro de conexão'}
                            </Text>
                        </Animated.View>
                    )}
                </View>
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
    content: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        ...createTextStyle('xxxl', 'extrabold'),
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    subtitle: {
        ...createTextStyle('md', 'medium'),
        color: COLORS.lightGray,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: SPACING.lg,
    },
    inputLabel: {
        ...createTextStyle('sm', 'semibold'),
        color: COLORS.white,
        marginBottom: SPACING.sm,
    },
    input: {
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        ...createTextStyle('md', 'medium'),
        color: COLORS.white,
        borderWidth: 2,
        borderColor: COLORS.darkGray,
    },
    buttonContainer: {
        marginBottom: SPACING.md,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.lg,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.darkGray,
    },
    dividerText: {
        ...createTextStyle('sm', 'semibold'),
        color: COLORS.gray,
        marginHorizontal: SPACING.md,
    },
    joinContainer: {
        backgroundColor: COLORS.darkSecondary + '80',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.success + '40',
    },
    infoCard: {
        backgroundColor: COLORS.darkSecondary + '80',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        marginTop: SPACING.xl,
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
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.md,
        padding: SPACING.sm,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: SPACING.sm,
    },
    statusText: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.white,
    },
});

export default OnlineLobbyScreen;
