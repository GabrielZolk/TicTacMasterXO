import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  BackHandler,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { RootStackParamList, GameMode, Difficulty, OpponentType, Player } from '../types/game';
import { useGame } from '../contexts/GameContext';
import { useI18n } from '../i18n/useI18n';
import AppHeader from '../components/AppHeader';
import GameBoard from '../components/GameBoard';
import GravityBoard from '../components/GravityBoard';
import BigBoard from '../components/BigBoard';
import BlindBoard from '../components/BlindBoard';
import GameScore from '../components/GameScore';
import CustomButton from '../components/CustomButton';
import VictoryAnimation from '../components/VictoryAnimation';
import TrollMessage from '../components/TrollMessage';
import SurvivalHearts from '../components/SurvivalHearts';
import GameEndModal from '../components/GameEndModal';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  createTextStyle,
} from '../utils/theme';
import { firebaseService } from '../services/firebaseService';
import { PeerMessage, MovePayload, RoomInfo } from '../types/online';
import { useTheme } from '../hooks/useTheme';
import MysticBackground from '../components/MysticBackground';
import OnlineGameEndModal from '../components/OnlineGameEndModal';

type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;
type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;

const GameScreen: React.FC = () => {
  const navigation = useNavigation<GameScreenNavigationProp>();
  const route = useRoute<GameScreenRouteProp>();
  // Add opponentName to params destructuring, default to 'Oponente' if missing
  const { mode, opponent, difficulty, roomCode, playerName, isHost, opponentName = 'Oponente' } = route.params as any;
  const { t } = useI18n();

  const {
    gameState,
    gameStats,
    gameConfig,
    makeMove,
    restartGame,
    setGameMode,
    setOpponent,
    setDifficulty,
    updateConfig,
    updateGameStats,
    playSound,
    triggerHaptics,
    checkWinner,
    isInfinityMode,
    gameMode,
    isAIThinking,
    makeAIMove,
    trollMessage,
    clearTrollMessage,
  } = useGame();

  const { theme } = useTheme();

  const [showMenu, setShowMenu] = useState(false);
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  const [showOnlineEndModal, setShowOnlineEndModal] = useState(false); // New modal for online
  const menuScale = useSharedValue(0);
  const [gameStatsUpdated, setGameStatsUpdated] = useState(false);
  const gameEndProcessedRef = useRef(false);

  // Online State
  // playerSymbol determines if I am X (start first) or O
  // Default: Host is X, Guest is O. But lottery can change this.
  const [playerSymbol, setPlayerSymbol] = useState<Player>(isHost ? 'X' : 'O');
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false);
  const [iWantRematch, setIWantRematch] = useState(false);
  const turnDeterminedRef = useRef(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(
    firebaseService.getConnectionStatus()
  ); // Using any to avoid importing ConnectionStatus type if not already imported or conflict

  // Set game mode, opponent and difficulty when screen loads
  useEffect(() => {
    setGameMode(mode);
    setOpponent(opponent);
    if (difficulty) {
      setDifficulty(difficulty);
    }

    // Reset local UI states when parameters change
    setShowGameEndModal(false);
    setShowVictoryAnimation(false);
    setGameStatsUpdated(false);
    gameEndProcessedRef.current = false;
  }, [mode, opponent, difficulty, setGameMode, setOpponent, setDifficulty]);

  // Make AI move when it's AI's turn
  useEffect(() => {
    if (
      opponent === 'ai' &&
      gameState.currentPlayer === 'O' &&
      !gameState.winner &&
      !(gameState as any).isDraw &&
      !isAIThinking &&
      // Additional check: ensure there are empty cells available
      gameState.board.some(row => row.some(cell => cell === null))
    ) {
      // Small delay to make the AI move feel more natural
      const timer = setTimeout(() => {
        makeAIMove();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [opponent, gameState.currentPlayer, gameState.winner, (gameState as any).isDraw, isAIThinking, makeAIMove, gameState.board]);

  // Show modal when game ends
  useEffect(() => {
    const isGameOver = gameState.winner || (gameState as any).isDraw;

    if (isGameOver && gameState.moveCount > 0 && !gameEndProcessedRef.current) {
      gameEndProcessedRef.current = true;

      // Determine sound to play
      let soundToPlay: 'win' | 'lose' | 'draw' = 'win';

      if ((gameState as any).isDraw) {
        soundToPlay = 'draw';
      } else if (opponent === 'ai') {
        soundToPlay = gameState.winner === 'X' ? 'win' : 'lose';
      } else {
        soundToPlay = 'win';
      }

      // Play sound and haptics
      playSound(soundToPlay);
      triggerHaptics('heavy');
      setShowVictoryAnimation(true);

      // Show modal after animation with guaranteed delay
      const modalTimeout = setTimeout(() => {
        // Double-check game is still over before showing modal
        if (gameState.winner || (gameState as any).isDraw) {
          if (opponent === 'online') {
            setShowOnlineEndModal(true);
          } else {
            setShowGameEndModal(true);
          }
        }
      }, 2000);

      return () => clearTimeout(modalTimeout);
    }
  }, [gameState.winner, (gameState as any).isDraw, gameState.moveCount, opponent, playSound, triggerHaptics]);


  // Reset animations and stats when game starts fresh
  useEffect(() => {
    const isGameReset = !gameState.winner && !(gameState as any).isDraw && gameState.moveCount === 0;

    if (isGameReset && (!showGameEndModal && !showOnlineEndModal)) {
      // Only reset if modal is already closed
      setGameStatsUpdated(false);
      setShowVictoryAnimation(false);
      gameEndProcessedRef.current = false;
      // Reset rematch states
      setOpponentWantsRematch(false);
      setIWantRematch(false);
    }
  }, [gameState.winner, (gameState as any).isDraw, gameState.moveCount, showGameEndModal, showOnlineEndModal]);

  // Update game statistics when game ends
  useEffect(() => {
    if ((gameState.winner || (gameState as any).isDraw) && !gameStatsUpdated) {

      // Update stats only once when game ends
      updateGameStats(gameState.winner, (gameState as any).isDraw);
      setGameStatsUpdated(true);
    }
  }, [gameState.winner, (gameState as any).isDraw, gameStatsUpdated, gameMode, updateGameStats]);

  // Refs to hold latest function versions to avoid dependency changes
  const makeMoveRef = useRef(makeMove);
  const restartGameRef = useRef(restartGame);
  const navigationRef = useRef(navigation);

  // Update refs when functions change
  useEffect(() => {
    makeMoveRef.current = makeMove;
    restartGameRef.current = restartGame;
    navigationRef.current = navigation;
  }, [makeMove, restartGame, navigation]);

  // Online mode: Listen for updates and messages
  useEffect(() => {
    if (opponent !== 'online') return;

    console.log('🔗 Setting up stable online game listener');

    // Listen for Room Updates (Persistent Rematch Status)
    firebaseService.onRoomUpdate((room: RoomInfo) => {
      // console.log('📊 Game Room Update:', room); // Too noisy usually
      if (isHost) {
        // Host watches Guest
        // Detect if Guest Left (via disconnect or removal)
        if (!room.guest) {
          Alert.alert('Oponente Saiu', 'O convidado desconectou da sala.', [
            { text: 'OK', onPress: () => navigationRef.current.goBack() }
          ]);
          return;
        }

        if (room.guest?.wantRematch !== undefined) {
          setOpponentWantsRematch(room.guest.wantRematch);
        }

        // Auto-restart check for Host
        // Auto-restart check for Host
        if (room.host.wantRematch && room.guest?.wantRematch) {
          console.log('✅ Both players confirmed rematch in DB. Restarting...');

          // Only proceed if game is actually ended (prevent loop if room update comes late)
          if (!gameEndProcessedRef.current) return;

          firebaseService.sendMessage({ type: 'restart' });
          firebaseService.updateRematchStatus(false);
          setShowOnlineEndModal(false);
          setShowGameEndModal(false);
          restartGameRef.current();
        }
      } else {
        // Guest watches Host
        // Detect if Host Left (room deleted usually, but checking null host just in case)
        if (!room.host) {
          Alert.alert('Host Saiu', 'O dono da sala desconectou.', [
            { text: 'OK', onPress: () => navigationRef.current.goBack() }
          ]);
          return;
        }

        if (room.host.wantRematch !== undefined) {
          setOpponentWantsRematch(room.host.wantRematch);
        }
      }
    });

    const handlePeerMessage = (message: PeerMessage) => {
      console.log('🎮 GameScreen received message:', message);

      if (message.type === 'move') {
        const payload = message.payload as MovePayload;
        makeMoveRef.current(payload.row, payload.col);
        playSound('click');
        triggerHaptics('light');
      } else if (message.type === 'restart') {
        console.log('🔄 Opponent requested restart (or Host confirmed)');
        // Clear my rematch status in DB
        firebaseService.updateRematchStatus(false);
        // Close modals explicitly
        setShowOnlineEndModal(false);
        setShowGameEndModal(false);
        restartGameRef.current();
      } else if (message.type === 'leave') {
        console.log('🚪 Opponent left');
        Alert.alert('Oponente Saiu', 'O oponente saiu da partida', [
          {
            text: 'OK',
            onPress: () => navigationRef.current.goBack(),
          },
        ]);
      } else if (message.type === 'start_player') {
        const { hostIs } = message.payload;
        if (hostIs === 'O') {
          setPlayerSymbol('X');
          Alert.alert('Sorteio Inicial', 'Você começa jogando! (Você é X)');
        } else {
          setPlayerSymbol('O');
          Alert.alert('Sorteio Inicial', 'Oponente começa jogando! (Você é O)');
        }
      }
    };

    firebaseService.onMessage(handlePeerMessage);

    return () => {
      console.log('🧹 Cleaning up game screen listener');
    };
  }, [opponent, isHost]);

  // Monitor Connection Status & Cleanup
  useEffect(() => {
    // Monitor status
    firebaseService.onConnectionStatus((status) => {
      setConnectionStatus(status);
      if (opponent === 'online' && status === 'disconnected') {
        // Avoid double alert if handled by room update or leave msg
        // But good as fallback
        // Alert.alert('Desconectado', 'Conexão perdida.'); // Optional, maybe too aggressive if handled elsewhere
      }
    });

    return () => {
      if (opponent === 'online') {
        console.log('🔌 Leaving game session on unmount');
        // Use leaveRoom to notify opponent before disconnecting
        firebaseService.leaveRoom();
      }
    };
  }, []);


  // Handle hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleGoBack();
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler?.remove();
    }, [])
  );

  const handleGoBack = async () => {
    await triggerHaptics('light');
    await playSound('button');
    navigation.goBack();
  };

  const handleMenuToggle = async () => {
    await triggerHaptics('light');
    await playSound('button');

    const newShowMenu = !showMenu;
    setShowMenu(newShowMenu);

    if (newShowMenu) {
      menuScale.value = withTiming(1, { duration: 200 });
    } else {
      menuScale.value = withTiming(0, { duration: 200 });
    }
  };

  const handleCellPress = async (row: number, col: number) => {
    if (gameState.winner || (gameState as any).isDraw || (gameMode !== 'gravity' && gameState.board[row][col] !== null)) {
      await playSound('error');
      await triggerHaptics('heavy');
      return;
    }

    // Online mode: Check if it's your turn
    if (opponent === 'online') {
      const mySymbol = playerSymbol; // Use dynamic state instead of static calculation
      if (gameState.currentPlayer !== mySymbol) {
        await playSound('error');
        await triggerHaptics('heavy');
        return; // Not your turn
      }

      // Send move to opponent
      firebaseService.sendMove(row, col, mySymbol, gameState.moveCount + 1);
    }

    await playSound('click');
    await triggerHaptics('medium');
    makeMove(row, col);
  };

  const handleColumnPress = async (col: number) => {
    if (gameState.winner || (gameState as any).isDraw) {
      await playSound('error');
      await triggerHaptics('heavy');
      return;
    }

    // For gravity mode, check if column is full
    if (gameState.board[0][col] !== null) {
      await playSound('error');
      await triggerHaptics('heavy');
      return;
    }

    await playSound('click');
    await triggerHaptics('medium');
    makeMove(0, col); // Row doesn't matter for gravity mode
  };

  const handlePlayAgain = () => {
    // Standard offline/AI play again
    // Close modal first
    setShowGameEndModal(false);

    // Small delay to ensure modal closes before resetting game
    setTimeout(() => {
      setShowVictoryAnimation(false);
      setGameStatsUpdated(false);
      gameEndProcessedRef.current = false;
      restartGame();
    }, 200); // Wait for modal close animation

    triggerHaptics('light');
    playSound('button');
  };

  const handleViewBoard = () => {
    setShowGameEndModal(false);
    triggerHaptics('light');
  };

  const handleCloseModal = () => {
    setShowGameEndModal(false);
  };



  const handleRestartGame = async () => {
    await triggerHaptics('heavy');
    await playSound('button');

    restartGame();
    if (opponent === 'online') {
      // If host restarts manually mid-game
      firebaseService.sendMessage({ type: 'restart' });
    }
    setShowMenu(false);
    menuScale.value = withTiming(0, { duration: 200 });
  };

  const handleOnlinePlayAgain = () => {
    setIWantRematch(true);
    // Update DB status
    firebaseService.updateRematchStatus(true);

    // If I am host and opponent already wants rematch (checked via DB/State), start immediately
    if (isHost && opponentWantsRematch) {
      console.log('✅ Both players want rematch (Host clicked last), restarting...');
      firebaseService.sendMessage({ type: 'restart' });
      // Clear my status
      firebaseService.updateRematchStatus(false);
      setShowOnlineEndModal(false);
      restartGame();
    }
  };

  const handleOnlineExit = () => {
    firebaseService.leaveRoom();
    navigation.goBack();
  };

  const getGameModeTitle = (mode: GameMode, opponent: OpponentType): string => {
    const modeTitles = {
      classic: 'Clássico',
      infinity: 'Infinito',
      gravity: 'Gravity 🪐',
      blind: 'Cego 🙈',
      bigBoard: 'Grande 🏟️',
      survival: 'Sobrevivência ❤️',
    };

    const modeTitle = modeTitles[mode] || 'Modo Desconhecido';

    // Add Host indicator if online
    let suffix = '';
    if (opponent === 'online') {
      suffix = isHost ? ' (👑 Host)' : ' (Convidado)';
    } else if (opponent === 'ai') {
      suffix = ` VS IA (${difficulty?.toUpperCase()})`;
    } else {
      suffix = ' - 2 Jogadores';
    }

    return modeTitle + suffix;
  };

  const winningLine = checkWinner();

  // Menu animation style
  const menuAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: menuScale.value }],
    opacity: menuScale.value,
  }));

  return (
    <LinearGradient colors={['#0A0A0A', '#1A1A2E']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBackground} />
      <SafeAreaView style={styles.safeArea}>

        {/* Mystic Background for Samuel theme */}
        <MysticBackground theme={theme} />

        {/* Header */}
        <Animated.View entering={FadeInUp.duration(600)}>
          <AppHeader
            title={getGameModeTitle(mode, opponent)}
            showBackButton={true}
            showHomeButton={false}
            onBackPress={handleGoBack}
            rightComponent={
              <TouchableOpacity
                onPress={handleMenuToggle}
                style={styles.headerButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showMenu ? "close" : "ellipsis-vertical"}
                  size={24}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            }
          />
        </Animated.View>

        {/* Game Score */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <GameScore
            currentPlayer={gameState.currentPlayer}
            gameStats={gameStats}
            winner={gameState.winner}
            isDraw={(gameState as any).isDraw}
            gameMode={getGameModeTitle(mode, opponent)}
          />
        </Animated.View>

        {/* Survival Hearts - only show in survival mode */}
        {gameMode === 'survival' && (
          <Animated.View entering={FadeInUp.delay(300).duration(600)}>
            <SurvivalHearts
              currentLives={(gameState as any).lives || 3}
              maxLives={(gameState as any).maxLives || 3}
              animated={gameState.winner === 'O'} // Animate when player loses
            />
          </Animated.View>
        )}






        {/* Game Board */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(800)}
          style={styles.boardContainer}
        >
          {gameMode === 'gravity' ? (
            <GravityBoard
              board={gameState.board}
              onColumnPress={handleColumnPress}
              winningLine={winningLine}
              moves={gameState.moves}
              disabled={!!gameState.winner || (gameState as any).isDraw || isAIThinking || (opponent === 'ai' && gameState.currentPlayer === 'O')}
            />
          ) : gameMode === 'bigBoard' ? (
            <BigBoard
              board={gameState.board}
              onCellPress={handleCellPress}
              winningLine={winningLine}
              moves={gameState.moves}
              disabled={!!gameState.winner || (gameState as any).isDraw || isAIThinking || (opponent === 'ai' && gameState.currentPlayer === 'O')}
            />
          ) : gameMode === 'blind' ? (
            <BlindBoard
              gameState={gameState as any}
              onCellPress={handleCellPress}
              winningLine={winningLine}
              disabled={!!gameState.winner || (gameState as any).isDraw || isAIThinking || (opponent === 'ai' && gameState.currentPlayer === 'O')}
              gameEnded={Boolean(gameState.winner) || Boolean((gameState as any).isDraw)}
            />
          ) : (
            <GameBoard
              board={gameState.board}
              onCellPress={handleCellPress}
              winningLine={winningLine}
              moves={gameState.moves}
              isInfinityMode={isInfinityMode}
              disabled={!!gameState.winner || (gameState as any).isDraw || isAIThinking || (opponent === 'ai' && gameState.currentPlayer === 'O')}
            />
          )}
        </Animated.View>

        {/* AI Thinking Indicator */}
        {isAIThinking && (
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={styles.aiThinkingContainer}
          >
            <View style={styles.aiThinkingCard}>
              <Ionicons name="hardware-chip" size={20} color={COLORS.oColor} />
              <Text style={styles.aiThinkingText}>{t('aiThinking')}</Text>
              <View style={styles.thinkingDots}>
                <Animated.View style={styles.dot} />
                <Animated.View style={[styles.dot, { animationDelay: '0.2s' }]} />
                <Animated.View style={[styles.dot, { animationDelay: '0.4s' }]} />
              </View>
            </View>
          </Animated.View>
        )}

        {/* Infinity Mode Info */}
        {isInfinityMode && (
          <Animated.View
            entering={FadeInUp.delay(600).duration(600)}
            style={styles.infinityInfo}
          >
            <View style={styles.infinityCard}>
              <Ionicons name="infinite" size={20} color={COLORS.info} />
              <Text style={styles.infinityText}>
                {t('pieces')}: {gameState.moves.length}/6
              </Text>
              {gameState.moves.length >= 6 && (
                <Text style={styles.infinitySubtext}>
                  {t('infinityDescription')}
                </Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* Overlay Menu */}
        {showMenu && (
          <View style={styles.menuOverlay}>
            <TouchableOpacity
              style={styles.menuBackdrop}
              activeOpacity={1}
              onPress={handleMenuToggle}
            />
            <Animated.View style={[styles.menu, menuAnimatedStyle]}>
              <Text style={styles.menuTitle}>{t('gameOptions')}</Text>


              {(opponent !== 'online' || isHost) && (
                <TouchableOpacity
                  onPress={handleRestartGame}
                  style={styles.menuItem}
                  activeOpacity={0.7}
                >
                  <Ionicons name="reload-outline" size={20} color={COLORS.error} />
                  <Text style={[styles.menuItemText, { color: COLORS.error }]}>
                    {t('restartGame')}
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.menuDivider} />

              <TouchableOpacity
                onPress={() => {
                  handleMenuToggle();
                  navigation.navigate('Settings');
                }}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-outline" size={20} color={COLORS.gray} />
                <Text style={[styles.menuItemText, { color: COLORS.gray }]}>
                  {t('settings')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  handleMenuToggle();
                  navigation.navigate('Statistics');
                }}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <Ionicons name="stats-chart-outline" size={20} color={COLORS.gray} />
                <Text style={[styles.menuItemText, { color: COLORS.gray }]}>
                  {t('statistics')}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Victory Animation */}
        {showVictoryAnimation && gameState.winner && (
          <VictoryAnimation
            winner={gameState.winner}
            duration={2000}
            onComplete={() => {
              setShowVictoryAnimation(false);
              // Modal já foi mostrado pelo setTimeout, não fazer nada mais aqui
            }}
          />
        )}

        {/* Troll Message */}
        {trollMessage && (
          <TrollMessage
            message={trollMessage}
            onDismiss={clearTrollMessage}
          />
        )}

        {/* Game End Modal */}
        <GameEndModal
          visible={showGameEndModal}
          winner={gameState.winner}
          isDraw={(gameState as any).isDraw}
          gameMode={getGameModeTitle(mode, opponent)}
          onPlayAgain={handlePlayAgain}
          onViewBoard={handleViewBoard}
          onClose={handleCloseModal}
        />

        {/* Online Game End Modal */}
        <OnlineGameEndModal
          visible={showOnlineEndModal}
          winner={gameState.winner}
          isDraw={(gameState as any).isDraw}
          gameMode={getGameModeTitle(mode, opponent)}
          myPlayerName={playerName}
          opponentName={opponentName}
          isHost={isHost}
          opponentWantsRematch={opponentWantsRematch}
          onPlayAgain={handleOnlinePlayAgain}
          onExit={handleOnlineExit}
        />

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
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.darkSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  boardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xs,
  },
  aiThinkingContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  aiThinkingCard: {
    backgroundColor: COLORS.darkSecondary + '80',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.oColor + '40',
  },
  aiThinkingText: {
    ...createTextStyle('sm', 'semibold'),
    color: COLORS.oColor,
  },
  thinkingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.oColor,
  },
  infinityInfo: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  infinityCard: {
    backgroundColor: COLORS.darkSecondary + '80',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  infinityText: {
    ...createTextStyle('sm', 'semibold'),
    color: COLORS.info,
  },
  infinitySubtext: {
    ...createTextStyle('xs', 'regular'),
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menu: {
    backgroundColor: COLORS.darkSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    margin: SPACING.lg,
    minWidth: 250,
    ...SHADOWS.heavy,
  },
  menuTitle: {
    ...createTextStyle('lg', 'bold'),
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.md,
  },
  menuItemText: {
    ...createTextStyle('md', 'medium'),
    color: COLORS.white,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.darkGray,
    marginVertical: SPACING.sm,
  },
});

export default GameScreen;

