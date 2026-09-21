import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,

  StatusBar,
  TouchableOpacity,
  BackHandler,
  Alert,
  Share,
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

import { RootStackParamList, GameMode, Difficulty, OpponentType, Player, BlitzGameState, GravityGameState, BigBoardGameState, BombGameState, MadGameState, GobbleGameState, GobbleSize } from '../types/game';
import { useGame } from '../contexts/GameContext';
import { useI18n } from '../i18n/useI18n';
import BlitzTimer from '../components/BlitzTimer';
import BlitzTimePicker from '../components/BlitzTimePicker';
import AppHeader from '../components/AppHeader';
import PlayerAvatar from '../components/art/PlayerAvatar';
import GameBoard from '../components/GameBoard';
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
import CopaNickBackground from '../components/CopaNickBackground';
import MatrixBackground from '../components/MatrixBackground';
import MysticSeal from '../components/art/MysticSeal';
import BombExplosion from '../components/BombExplosion';
import GobbleSizePicker from '../components/GobbleSizePicker';
import MadMutationBanner from '../components/MadMutationBanner';
import OnlineGameEndModal from '../components/OnlineGameEndModal';
import RemoveAdsButton from '../components/RemoveAdsButton';
import adMobService from '../services/adMobService';
import { boostService } from '../services/boostService';
import { chestService } from '../services/chestService';
import { battlepassService } from '../services/battlepassService';
import { profileService } from '../services/profileService';
import { AIPlayer } from '../utils/aiPlayer';
import EmoteBar from '../components/EmoteBar';
import ChestModal from '../components/ChestModal';
import LevelUpAnimation from '../components/LevelUpAnimation';
import ReplayModal from '../components/ReplayModal';
import iapService from '../services/iapService';
import { tournamentService } from '../services/tournamentService';
import { Emote, EMOTE_PACKS } from '../types/emotes';
import { EmotePayload } from '../types/online';
import { ChestRarity } from '../types/chest';
import { buildShareCard } from '../utils/shareCard';

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
    handleBlitzTimeout,
    setBlitzTime,
    completeGravityFall,
    undoLastMoves,
    addBlitzTime,
    selectGobbleSize,
    lastRewards,
    clearLastRewards,
  } = useGame();

  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [showMenu, setShowMenu] = useState(false);
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  // Guard to ensure tournamentService.recordResult fires exactly once per game instance
  const tournamentRecordedRef = useRef(false);
  // We must NOT record a result until we've actually seen this GameScreen
  // observe a fresh game (moveCount === 0). Otherwise, on tournament round
  // transitions (navigation.replace) the new GameScreen mounts while the
  // GameContext still holds the previous game's terminal state (winner/draw),
  // and the recording useEffect fires immediately with stale data — causing
  // an extra round to be marked as won/drawn before the user even plays.
  const sawGameStartRef = useRef(false);
  const [showOnlineEndModal, setShowOnlineEndModal] = useState(false); // New modal for online
  const menuScale = useSharedValue(0);
  const [gameStatsUpdated, setGameStatsUpdated] = useState(false);
  const gameEndProcessedRef = useRef(false);
  const screenMountedRef = useRef(true);
  // Tracks tournament final result (set when tournament ends this game)
  const [tournamentFinished, setTournamentFinished] = useState<null | { won: boolean; totalWins: number; stars: number }>(null);
  // Tracks next tournament round label (set after recordResult)
  const [tournamentNextRoundLabel, setTournamentNextRoundLabel] = useState<string | null>(null);

  // Track mount state to prevent async updates after unmount
  useEffect(() => {
    screenMountedRef.current = true;
    return () => { screenMountedRef.current = false; };
  }, []);

  // Blitz mode state
  const [showBlitzTimePicker, setShowBlitzTimePicker] = useState(mode === 'blitz');
  const blitzTimePickerShownRef = useRef(false);

  // Online State
  // playerSymbol determines if I am X (start first) or O
  // Default: Host is X, Guest is O. But lottery can change this.
  const [playerSymbol, setPlayerSymbol] = useState<Player>(isHost ? 'X' : 'O');
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false);
  const [iWantRematch, setIWantRematch] = useState(false);
  const turnDeterminedRef = useRef(false);
  const isRestartingRef = useRef(false); // Flag to prevent duplicate restart processing
  const [connectionStatus, setConnectionStatus] = useState<any>(
    firebaseService.getConnectionStatus()
  ); // Using any to avoid importing ConnectionStatus type if not already imported or conflict

  // Emote state. Online and offline alike: a pack bought in the store has to
  // be usable in whatever match the player actually opened.
  const [receivedEmote, setReceivedEmote] = useState<Emote | null>(null);
  const emoteHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emoteReplyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (emoteHideRef.current) clearTimeout(emoteHideRef.current);
    if (emoteReplyRef.current) clearTimeout(emoteReplyRef.current);
  }, []);

  // Chest state
  const [pendingChestRarity, setPendingChestRarity] = useState<ChestRarity | null>(null);
  const [showChestModal, setShowChestModal] = useState(false);

  // Bomb mode: show the explosion overlay whenever explosionCount goes up
  const [bombBlast, setBombBlast] = useState<{ key: number; message: string } | null>(null);
  const lastExplosionCountRef = useRef(0);
  useEffect(() => {
    if (mode !== 'bomb') return;
    const bombState = gameState as BombGameState;
    const count = bombState.explosionCount || 0;
    // A restart puts explosionCount back to 0 while this ref still held the
    // previous round's total, so every later explosion failed the `>` test —
    // from the second round on, stepping on the mine was completely silent.
    if (count < lastExplosionCountRef.current) {
      lastExplosionCountRef.current = count;
    }
    if (count > lastExplosionCountRef.current && bombState.lastExplosion) {
      const victimIsMe = opponent === 'ai'
        ? bombState.lastExplosion.player === 'X'
        : true;
      setBombBlast({
        key: count,
        message: victimIsMe ? t('bombHitYou') : t('bombHitOpponent'),
      });
      playSound('error');
      triggerHaptics('heavy');
    }
    lastExplosionCountRef.current = count;
  }, [mode, (gameState as BombGameState).explosionCount]);

  // Mad mode: announce each board mutation so it doesn't look like a glitch
  const [madBanner, setMadBanner] = useState<MadGameState['lastMutation'] | null>(null);
  const lastMutationIdRef = useRef(0);
  useEffect(() => {
    if (mode !== 'mad') return;
    const madState = gameState as MadGameState;
    const mutation = madState.lastMutation;
    // Same stale-counter trap as the bomb overlay: mutation ids restart at 1
    // every new round, so without this the banner went quiet after round one.
    const mutationCount = madState.mutationCount || 0;
    if (mutationCount < lastMutationIdRef.current) {
      lastMutationIdRef.current = mutationCount;
    }
    if (mutation && mutation.id > lastMutationIdRef.current) {
      lastMutationIdRef.current = mutation.id;
      setMadBanner(mutation);
      playSound('button');
      triggerHaptics('medium');
    }
  }, [mode, (gameState as MadGameState).lastMutation?.id]);

  // Replay state
  const [showReplay, setShowReplay] = useState(false);
  const [replayMoves, setReplayMoves] = useState<typeof gameState.moves>([]);
  const [replayWinner, setReplayWinner] = useState<typeof gameState.winner>(null);

  // Battle Pass level up notification (animated overlay)
  const bpLevelRef = useRef(0);
  const [levelUpInfo, setLevelUpInfo] = useState<{ visible: boolean; level: number }>({ visible: false, level: 0 });
  useEffect(() => {
    battlepassService.getProgress().then(p => { bpLevelRef.current = p.currentLevel; });
    const unsub = battlepassService.subscribe(() => {
      battlepassService.getProgress().then(p => {
        if (!screenMountedRef.current) return;
        if (p.currentLevel > bpLevelRef.current && bpLevelRef.current > 0) {
          setLevelUpInfo({ visible: true, level: p.currentLevel });
          // Celebratory feedback
          playSound('win');
          triggerHaptics('heavy');
        }
        bpLevelRef.current = p.currentLevel;
      });
    });
    return unsub;
  }, []);

  // Profile avatar for online display. We keep the *id* rather than an emoji
  // so the drawn avatar renders here exactly as it does on the profile.
  const [myAvatarId, setMyAvatarId] = useState('avatar_default');
  useEffect(() => {
    if (opponent === 'online') {
      profileService.getProfile().then(p => {
        if (p.avatarId) setMyAvatarId(p.avatarId);
      }).catch(() => {});
    }
  }, [opponent]);

  const showEmote = (emote: Emote, holdMs: number = 3000) => {
    setReceivedEmote(emote);
    if (emoteHideRef.current) clearTimeout(emoteHideRef.current);
    emoteHideRef.current = setTimeout(() => {
      if (!screenMountedRef.current) return;
      setReceivedEmote(null);
    }, holdMs);
  };

  const handleSendEmote = (emote: Emote) => {
    triggerHaptics('light');

    if (opponent === 'online') {
      firebaseService.sendMessage({
        type: 'emote',
        payload: { emoteId: emote.id, emoji: emote.emoji } as EmotePayload,
      });
      return;
    }

    // Offline an emote had nowhere to go, so the whole bar was hidden — which
    // left a player who bought a pack in the store with no match to use it in.
    // Now it lands on the board like any other emote: against someone sharing
    // the phone that IS the point, and the AI answers so it is not a monologue.
    showEmote(emote);

    if (opponent === 'ai') {
      // Free pack only: the AI must never flash an emote the player has not
      // even seen for sale.
      const replies = EMOTE_PACKS[0].emotes.filter(e => e.id !== emote.id);
      const reply = replies[Math.floor(Math.random() * replies.length)];
      if (emoteReplyRef.current) clearTimeout(emoteReplyRef.current);
      emoteReplyRef.current = setTimeout(() => {
        if (!screenMountedRef.current) return;
        showEmote(reply, 2500);
      }, 1200);
    }
  };

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
      // Never move while a gravity fall is animating (reducer would reject it,
      // but this also avoids wasted "thinking" cycles during the animation)
      !(gameState as GravityGameState).pendingFall?.isAnimating &&
      // Additional check: ensure there are empty cells available
      gameState.board.some(row => row.some(cell => cell === null))
    ) {
      // Small delay to make the AI move feel more natural
      const timer = setTimeout(() => {
        makeAIMove();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [opponent, gameState.currentPlayer, gameState.winner, (gameState as any).isDraw, isAIThinking, makeAIMove, gameState.board, (gameState as GravityGameState).pendingFall?.isAnimating]);

  // Failsafe: if a gravity fall animation somehow never completes (e.g. app
  // backgrounded mid-animation and the reanimated callback was dropped), force
  // completion after 2.5s so the reducer's "reject moves while falling" guard
  // can never soft-lock the game.
  useEffect(() => {
    const pf = (gameState as GravityGameState).pendingFall;
    if (mode === 'gravity' && pf?.isAnimating) {
      const failsafe = setTimeout(() => {
        completeGravityFall();
      }, 2500);
      return () => clearTimeout(failsafe);
    }
  }, [mode, (gameState as GravityGameState).pendingFall?.isAnimating, completeGravityFall]);

  // Show modal when game ends
  useEffect(() => {
    const isGameOver = gameState.winner || (gameState as any).isDraw;
    // Check for Blitz timeout using both route mode and game state
    const blitzState = gameState as BlitzGameState;
    const isBlitzTimeout = mode === 'blitz' && blitzState.timedOut === true;

    // Allow modal to show even with 0 moves if it's a Blitz timeout
    const shouldShowModal = isGameOver && (gameState.moveCount > 0 || isBlitzTimeout);

    if (shouldShowModal && !gameEndProcessedRef.current) {
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

      // Show modal after animation — faster for Blitz mode
      const modalDelay = mode === 'blitz' ? 1000 : 2000;
      const modalTimeout = setTimeout(() => {
        // Double-check game is still over before showing modal
        if (gameState.winner || (gameState as any).isDraw) {
          if (opponent === 'online') {
            setShowOnlineEndModal(true);
          } else {
            setShowGameEndModal(true);
          }
        }
      }, modalDelay);

      return () => clearTimeout(modalTimeout);
    }
  }, [gameState.winner, (gameState as any).isDraw, gameState.moveCount, opponent, playSound, triggerHaptics, mode, (gameState as BlitzGameState).timedOut]);


  // Reset animations and stats when game starts fresh
  useEffect(() => {
    const blitzState = gameState as BlitzGameState;
    const isBlitzTimedOut = mode === 'blitz' && blitzState.timedOut === true;

    // Don't consider game reset if blitz timeout is still active (wait for proper restart)
    const isGameReset = !gameState.winner && !(gameState as any).isDraw && gameState.moveCount === 0 && !isBlitzTimedOut;

    if (isGameReset && (!showGameEndModal && !showOnlineEndModal)) {
      // Only reset if modal is already closed
      setGameStatsUpdated(false);
      setShowVictoryAnimation(false);
      gameEndProcessedRef.current = false;
      tournamentRecordedRef.current = false; // Allow next game's tournament result to be recorded
      sawGameStartRef.current = true;        // We've now observed a fresh game — recording is allowed
      isRestartingRef.current = false; // Reset restarting flag
      // Reset rematch states
      setOpponentWantsRematch(false);
      setIWantRematch(false);
      // Reset tournament label (will be re-set on next game end)
      setTournamentNextRoundLabel(null);
    }

  }, [gameState.winner, (gameState as any).isDraw, gameState.moveCount, showGameEndModal, showOnlineEndModal, mode, (gameState as BlitzGameState).timedOut]);

  // Update game statistics when game ends and trigger interstitial ad
  useEffect(() => {
    if ((gameState.winner || (gameState as any).isDraw) && !gameStatsUpdated) {
      // Hard guard: refuse to record until this GameScreen instance has
      // observed a fresh game start (moveCount===0). This prevents a stale
      // terminal state inherited from the previous game (e.g. tournament
      // navigation.replace remount) from being recorded as if it were the
      // result of this round.
      if (!sawGameStartRef.current) {
        return;
      }

      // Update stats only once when game ends
      updateGameStats(gameState.winner, (gameState as any).isDraw);
      setGameStatsUpdated(true);

      const inTournament = tournamentService.isActive();

      // Chest drop on win — SKIP during tournament games to avoid double-chest
      // (tournament award gives its own epic chest on full win)
      if (gameState.winner === 'X' && !inTournament) {
        chestService.onWin().then(droppedRarity => {
          if (!screenMountedRef.current) return;
          if (droppedRarity) {
            setPendingChestRarity(droppedRarity);
          }
        }).catch(() => {});
      }

      // Tournament: record result if active (guarded against double-fire)
      if (inTournament && !tournamentRecordedRef.current) {
        tournamentRecordedRef.current = true;
        // Defensive: draw and win are mutually exclusive — isDraw wins if both
        const playerDraw = !!(gameState as any).isDraw;
        const playerWon = !playerDraw && gameState.winner === 'X';
        tournamentService.recordResult(playerWon, playerDraw).then(result => {
          if (!screenMountedRef.current) return;
          // Tournament ended (win or loss): remember it so PlayAgain navigates to Home
          // (tournament win chest is already pushed to chestService.pendingChests by the service,
          // so it will show up as a banner on the Home screen automatically)
          if (result.tournamentOver) {
            setTournamentFinished({
              won: result.won,
              totalWins: result.totalWins,
              stars: result.reward?.stars || 0,
            });
          } else if (result.won || result.isDraw) {
            // Both win and draw advance the round — show "Next Round" label
            const nextRound = tournamentService.getCurrentRound();
            const roundIndex = tournamentService.getState().currentRound + 1;
            if (nextRound) {
              const prefix = result.isDraw ? t('tournamentDrawPrefix') : '';
              setTournamentNextRoundLabel(`${prefix}${t('tournamentNextRound')} (${roundIndex}/3)`);
            }
          }
        }).catch(() => {});
      }

      // Trigger interstitial ad check (shows ad every 3 games if not subscribed)
      // Only for offline/AI games - not for online to avoid interrupting the experience
      if (opponent !== 'online') {
        adMobService.onGameComplete().catch((error) => {
          console.log('📢 Interstitial not shown:', error);
        });
      }
    }
  }, [gameState.winner, (gameState as any).isDraw, gameStatsUpdated, gameMode, updateGameStats, opponent]);

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
          Alert.alert(t('opponentLeftTitle'), t('guestLeftBody'), [
            { text: 'OK', onPress: () => navigationRef.current.goBack() }
          ]);
          return;
        }

        if (room.guest?.wantRematch !== undefined) {
          setOpponentWantsRematch(room.guest.wantRematch);
        }

        // Auto-restart check for Host
        if (room.host.wantRematch && room.guest?.wantRematch) {
          // Skip if already restarting (prevents duplicate processing)
          if (isRestartingRef.current) {
            console.log('⏳ Already processing restart, skipping...');
            return;
          }

          // Only proceed if game is actually ended (prevent loop if room update comes late)
          if (!gameEndProcessedRef.current) {
            console.log('⚠️ Game not ended yet, skipping restart check');
            return;
          }

          console.log('✅ Both players confirmed rematch in DB. Restarting...');
          isRestartingRef.current = true;

          // Send restart message to guest
          firebaseService.sendMessage({ type: 'restart' });

          // Reset rematch status for BOTH players atomically (Host only)
          firebaseService.resetBothPlayersRematchStatus();

          // Close modals and reset UI states
          setShowOnlineEndModal(false);
          setShowGameEndModal(false);
          setOpponentWantsRematch(false);
          setIWantRematch(false);

          // Restart the game
          restartGameRef.current();

          // Reset the restarting flag after a short delay
          setTimeout(() => {
            isRestartingRef.current = false;
          }, 500);
        }
      } else {
        // Guest watches Host
        // Detect if Host Left (room deleted usually, but checking null host just in case)
        if (!room.host) {
          Alert.alert(t('hostLeftTitle'), t('hostLeftBody'), [
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
        makeMoveRef.current(payload.row, payload.col, payload.gravityFinalRow);
        playSound('click');
        triggerHaptics('light');
      } else if (message.type === 'restart') {
        // Skip if already restarting (prevents duplicate processing)
        if (isRestartingRef.current) {
          console.log('⏳ Already processing restart message, skipping...');
          return;
        }

        console.log('🔄 Opponent requested restart (or Host confirmed)');
        isRestartingRef.current = true;

        // Clear my rematch status in DB
        firebaseService.updateRematchStatus(false);

        // Close modals explicitly and reset states
        setShowOnlineEndModal(false);
        setShowGameEndModal(false);
        setOpponentWantsRematch(false);
        setIWantRematch(false);

        restartGameRef.current();

        // Reset the restarting flag after a short delay
        setTimeout(() => {
          isRestartingRef.current = false;
        }, 500);
      } else if (message.type === 'leave') {
        console.log('🚪 Opponent left');
        Alert.alert(t('opponentLeftTitle'), t('opponentLeftBody'), [
          {
            text: t('okAction'),
            onPress: () => navigationRef.current.goBack(),
          },
        ]);
      } else if (message.type === 'start_player') {
        const { hostIs } = message.payload;
        if (hostIs === 'O') {
          setPlayerSymbol('X');
          Alert.alert(t('coinTossTitle'), t('coinTossYouStart'));
        } else {
          setPlayerSymbol('O');
          Alert.alert(t('coinTossTitle'), t('coinTossOpponentStarts'));
        }
      } else if (message.type === 'emote') {
        const payload = message.payload as EmotePayload;
        // Through the same helper, so the hide timer is tracked and cancelled.
        // The bare setTimeout that used to be here still fired after the player
        // had left the screen.
        showEmote({ id: payload.emoteId, emoji: payload.emoji, label: '' });
      }
    };

    firebaseService.onMessage(handlePeerMessage);

    return () => {
      console.log('🧹 Cleaning up game screen listener');
      // Actually detach. Leaving these registered kept this unmounted screen's
      // closure alive, so a later room update could pop an Alert and call
      // goBack() from whatever screen the player had navigated to.
      firebaseService.onMessage(null);
      firebaseService.onRoomUpdate(null);
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
      firebaseService.onConnectionStatus(null);
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

    // If mid-tournament (active and not at end), confirm and cancel tournament
    if (tournamentService.isActive() && !tournamentFinished) {
      Alert.alert(
        t('leaveTournamentTitle'),
        t('leaveTournamentBody'),
        [
          { text: t('keepPlaying'), style: 'cancel' },
          {
            text: t('leave'),
            style: 'destructive',
            onPress: () => {
              tournamentService.cancel();
              navigation.goBack();
            },
          },
        ]
      );
      return;
    }

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
    // The occupied-cell check must apply to gravity too. It used to be skipped
    // for gravity, so tapping a filled cell online still SENT the move to the
    // opponent (whose board accepted it) while the local reducer rejected it —
    // the two boards then disagreed for the rest of the match.
    // Gobble is the one mode where an occupied cell is a legal target: a strictly
    // larger piece covers a smaller one — that is the whole mode. The reducer
    // already enforces `occupantSize >= size` (GameContext), but this guard
    // returned first, so "peça maior engole a menor" could never be played at
    // all. The size is re-checked here rather than just letting every occupied
    // tap through, so an illegal move is still never sent to an online opponent.
    const gobbleCanCover = (() => {
      if (gameMode !== 'gobble') return false;
      const gob = gameState as GobbleGameState;
      const occupant = gob.cellSizes?.[row]?.[col] ?? null;
      return occupant !== null && occupant < gob.selectedSize;
    })();

    if (gameState.winner || (gameState as any).isDraw || (gameState.board[row][col] !== null && !gobbleCanCover)) {
      await playSound('error');
      await triggerHaptics('heavy');
      return;
    }

    // Gravity: ignore taps while a piece is still falling
    if (gameMode === 'gravity' && (gameState as GravityGameState).pendingFall?.isAnimating) {
      return;
    }

    // Pre-calculate gravity for online sync (sender determines randomness)
    let gravityFinalRow: number | undefined;
    if (gameMode === 'gravity' && opponent === 'online') {
      const boardSize = gameState.board.length;
      let lowestEmptyRow = row;
      for (let r = row + 1; r < boardSize; r++) {
        if (gameState.board[r][col] === null) {
          lowestEmptyRow = r;
        } else {
          break;
        }
      }
      const willFall = lowestEmptyRow > row && Math.random() < 0.4;
      gravityFinalRow = willFall ? lowestEmptyRow : -1; // -1 means no fall
    }

    // Online mode: Check if it's your turn
    if (opponent === 'online') {
      const mySymbol = playerSymbol;
      if (gameState.currentPlayer !== mySymbol) {
        await playSound('error');
        await triggerHaptics('heavy');
        return; // Not your turn
      }

      // Send move to opponent (with gravity data if applicable)
      firebaseService.sendMove(row, col, mySymbol, gameState.moveCount + 1, gravityFinalRow);
    }

    await playSound('click');
    await triggerHaptics('medium');
    makeMove(row, col, gravityFinalRow);
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

  // Show chest if one is pending (called after game end modal closes)
  const tryShowChest = () => {
    if (pendingChestRarity) {
      setTimeout(() => setShowChestModal(true), 300);
    }
  };

  const handlePlayAgain = () => {
    try {
      setShowGameEndModal(false);
      triggerHaptics('light');
      playSound('button');
    } catch (e) {
      console.warn('handlePlayAgain init error:', e);
    }

    // Tournament FINISHED (win or loss): show result alert and go back to Home
    if (tournamentFinished) {
      const finished = tournamentFinished;
      setTournamentFinished(null);
      setTimeout(() => {
        const wins = finished.totalWins;
        if (finished.won) {
          // 3 vitórias reais — torneio vencido completo
          Alert.alert(
            t('tournamentWonTitle'),
            t('tournamentWonBody').replace('{stars}', String(finished.stars)),
            [{ text: 'OK', onPress: () => (navigation as any).navigate('Home') }]
          );
        } else if (wins >= 1) {
          // Completou o torneio mas sem vitórias suficientes (teve empates)
          const chestSuffix = wins >= 1 ? ` + ${t('chest')}` : '';
          Alert.alert(
            t('tournamentCompletedTitle'),
            t('tournamentCompletedBody')
              .replace('{wins}', String(wins))
              .replace('{stars}', String(finished.stars))
              .replace('{chest}', chestSuffix),
            [{ text: 'OK', onPress: () => (navigation as any).navigate('Home') }]
          );
        } else {
          // Eliminado ou só empatou tudo
          const reason = finished.stars > 25 ? t('tournamentEndedNoWins') : t('tournamentEndedEliminated');
          const consolation = t('tournamentConsolation').replace('{stars}', String(finished.stars));
          Alert.alert(
            t('tournamentEndedTitle'),
            `${reason}\n\n${consolation}`,
            [{ text: 'OK', onPress: () => (navigation as any).navigate('Home') }]
          );
        }
      }, 200);
      return;
    }

    // Tournament ACTIVE: advance to next round (whether last result was win OR draw)
    // Both win and draw advance the tournament — only loss eliminates
    const tournamentActive = tournamentService.isActive();
    const playerWon = gameState.winner === 'X';
    const playerDrew = !!(gameState as any).isDraw;
    const shouldAdvanceTournament = tournamentActive && (playerWon || playerDrew);
    const nextRound = tournamentActive ? tournamentService.getCurrentRound() : null;

    if (shouldAdvanceTournament && nextRound) {
      setTournamentNextRoundLabel(null);
      setTimeout(() => {
        if (!screenMountedRef.current) return;
        setShowVictoryAnimation(false);
        setGameStatsUpdated(false);
        gameEndProcessedRef.current = false;
        tournamentRecordedRef.current = false;
        // CRITICAL: stay on the same GameScreen instance — do NOT navigation.replace.
        // A remount makes the new GameScreen see the previous game's terminal
        // state (winner / isDraw still set in GameContext until reset propagates),
        // which causes the recording effect to fire a SECOND time and advance
        // the tournament round twice. Just change difficulty + restart in place.
        setDifficulty(nextRound.difficulty);
        restartGame();
      }, 200);
      return;
    }

    // If chest pending, show it first
    if (pendingChestRarity) {
      setTimeout(() => setShowChestModal(true), 300);
      return;
    }

    // Default: restart same game
    setTimeout(() => {
      try {
        if (!screenMountedRef.current) return;
        setShowVictoryAnimation(false);
        setGameStatsUpdated(false);
        gameEndProcessedRef.current = false;
        restartGame();
      } catch (e) {
        console.warn('handlePlayAgain restart error:', e);
      }
    }, 200);
  };

  const handleShareResult = async () => {
    try {
      await triggerHaptics('medium');
      const message = buildShareCard({
        board: gameState.board,
        winner: gameState.winner,
        isDraw: !!(gameState as any).isDraw,
        gameMode: getGameModeTitle(mode, opponent),
        playerSymbol: opponent === 'online' ? playerSymbol : 'X',
        labels: {
          appName: t('homeTitle'),
          won: t('shareWon'),
          lost: t('shareLost'),
          draw: t('shareDraw'),
          callToAction: t('shareCallToAction'),
        },
      });
      await Share.share({ message });
    } catch (error) {
      console.log('Share cancelled:', error);
    }
  };

  // "Ver Tabuleiro" now does what it says: closes the modal so the final board
  // (with the winning line already highlighted) is visible. It used to open the
  // Replay, which is premium-gated — so a free player asking to see the board
  // got a paywall instead. Replay kept its own entry in the game menu.
  const handleViewBoard = () => {
    setReplayMoves([...gameState.moves]);
    setReplayWinner(gameState.winner);
    triggerHaptics('light');
    setShowGameEndModal(false);
  };

  const handleOpenReplay = () => {
    setReplayMoves([...gameState.moves]);
    setReplayWinner(gameState.winner);
    setShowMenu(false);
    triggerHaptics('light');
    setShowReplay(true);
  };

  const handleCloseModal = () => {
    setShowGameEndModal(false);
    // If tournament finished, closing modal also goes back to Home
    if (tournamentFinished) {
      setTournamentFinished(null);
      setTimeout(() => (navigation as any).navigate('Home'), 200);
      return;
    }
    tryShowChest();
  };



  const handleRestartGame = async () => {
    await triggerHaptics('heavy');
    await playSound('button');

    if (opponent === 'online') {
      // Skip if already restarting
      if (isRestartingRef.current) {
        console.log('⏳ Already processing restart, ignoring menu restart...');
        return;
      }

      isRestartingRef.current = true;

      // If host restarts manually mid-game
      firebaseService.sendMessage({ type: 'restart' });
      // Reset rematch statuses for both players
      firebaseService.resetBothPlayersRematchStatus();

      // Reset local rematch states
      setOpponentWantsRematch(false);
      setIWantRematch(false);

      // Reset the flag after a delay
      setTimeout(() => {
        isRestartingRef.current = false;
      }, 500);
    }

    restartGame();
    setShowMenu(false);
    menuScale.value = withTiming(0, { duration: 200 });
  };

  const handleOnlinePlayAgain = () => {
    // Skip if already restarting
    if (isRestartingRef.current) {
      console.log('⏳ Already processing restart, ignoring click...');
      return;
    }

    setIWantRematch(true);
    // Update DB status
    firebaseService.updateRematchStatus(true);

    // If I am host and opponent already wants rematch (checked via DB/State), start immediately
    if (isHost && opponentWantsRematch) {
      console.log('✅ Both players want rematch (Host clicked last), restarting...');
      isRestartingRef.current = true;

      firebaseService.sendMessage({ type: 'restart' });
      // Clear BOTH players' rematch status atomically
      firebaseService.resetBothPlayersRematchStatus();

      // Reset states
      setShowOnlineEndModal(false);
      setOpponentWantsRematch(false);
      setIWantRematch(false);

      restartGame();

      // Reset the restarting flag after a short delay
      setTimeout(() => {
        isRestartingRef.current = false;
      }, 500);
    }
  };

  const handleOnlineExit = () => {
    firebaseService.leaveRoom();
    navigation.goBack();
  };

  const getGameModeTitle = (mode: GameMode, opponent: OpponentType): string => {
    // Mode title comes from the nested i18n keys that already exist for every
    // mode in every supported language (classic.title, infinity.title, etc.)
    const modeIcons: Record<GameMode, string> = {
      classic: '',
      infinity: '',
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

    const baseTitle = t(`${mode}.title` as any);
    const icon = modeIcons[mode] || '';
    const modeTitle = icon ? `${baseTitle} ${icon}` : baseTitle;

    // Add Host indicator if online
    let suffix = '';
    if (opponent === 'online') {
      suffix = isHost ? ` (👑 ${t('host')})` : ` (${t('guest')})`;
    } else if (opponent === 'ai') {
      const liveDiff = (gameConfig.difficulty || difficulty) as string | undefined;
      suffix = ` ${t('vsAiSuffix').replace('{difficulty}', (liveDiff || '').toUpperCase())}`;
    } else {
      suffix = ` - ${t('twoPlayers.title')}`;
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
      <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]} edges={['left', 'right', 'bottom']}>

        {/* Mystic Background for Samuel theme */}
        <MysticBackground theme={theme} />

        {/* Slowly turning seal behind the board, Samuel theme only */}
        {theme === 'samuel' && (
          <View style={styles.sealLayer} pointerEvents="none">
            <MysticSeal size={280} opacity={0.22} />
          </View>
        )}

        {/* Album-sticker background for Copa Nick theme */}
        <CopaNickBackground theme={theme} />

        {/* Living grid + scan line for the Matrix theme */}
        <MatrixBackground theme={theme} />

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
          {/* Online player names with avatar */}
          {opponent === 'online' && (
            <View style={styles.onlinePlayersBar}>
              <View style={[styles.onlinePlayerInfo, gameState.currentPlayer === playerSymbol && styles.onlinePlayerActive]}>
                <View style={styles.onlinePlayerAvatar}><PlayerAvatar id={myAvatarId} size={24} /></View>
                <Text style={styles.onlinePlayerName} numberOfLines={1}>{playerName || t('youLabel')}</Text>
              </View>
              <Text style={styles.onlineVs}>VS</Text>
              <View style={[styles.onlinePlayerInfo, gameState.currentPlayer !== playerSymbol && styles.onlinePlayerActive]}>
                <View style={styles.onlinePlayerAvatar}>
                  <Ionicons name="person-circle-outline" size={24} color={COLORS.lightGray} />
                </View>
                <Text style={styles.onlinePlayerName} numberOfLines={1}>{opponentName}</Text>
              </View>
            </View>
          )}
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

        {/* Blitz Timer - only show in blitz mode */}
        {gameMode === 'blitz' && !showBlitzTimePicker && (
          <Animated.View entering={FadeInUp.delay(300).duration(600)}>
            <BlitzTimer
              gameState={gameState as BlitzGameState}
              currentPlayer={gameState.currentPlayer}
              isGameOver={!!gameState.winner || !!(gameState as any).isDraw}
              onTimeout={handleBlitzTimeout}
              isPaused={opponent === 'ai' && gameState.currentPlayer === 'O'}
            />
          </Animated.View>
        )}

        {/* Gobble mode: piece-size tray */}
        {/* `piecesLeft` is read defensively: `gameMode` comes from the config and
            `gameState` from the board, and the two are briefly out of step on the
            frame this screen first mounts. Indexing it directly threw there and
            took the whole app down. */}
        {gameMode === 'gobble' && (gameState as GobbleGameState).piecesLeft && !gameState.winner && !(gameState as any).isDraw && (
          <Animated.View entering={FadeInUp.delay(280).duration(500)}>
            <GobbleSizePicker
              currentPlayer={gameState.currentPlayer}
              piecesLeft={(gameState as GobbleGameState).piecesLeft[gameState.currentPlayer]}
              selectedSize={(gameState as GobbleGameState).selectedSize}
              onSelect={(size: GobbleSize) => {
                triggerHaptics('light');
                selectGobbleSize(size);
              }}
              disabled={isAIThinking || (opponent === 'ai' && gameState.currentPlayer === 'O')}
            />
          </Animated.View>
        )}

        {/* Boost Bar - AI games only */}
        {opponent === 'ai' && !gameState.winner && !(gameState as any).isDraw && gameState.currentPlayer === 'X' && (
          <View style={styles.boostBar}>
            <TouchableOpacity
              style={styles.boostButton}
              onPress={async () => {
                if (boostService.getQuantity('boost_hint') <= 0) {
                  Alert.alert(t('noBoostsTitle'), t('buyHintsInStore'));
                  return;
                }

                // Compute the hint BEFORE spending the boost. It used to be
                // consumed first, so when no valid move came back the player
                // paid for silence.
                // The AI engine always plays as O, so mirror the board
                // (X<->O): the best O move there is the best X move here.
                const hintAI = new AIPlayer('challenger');
                hintAI.setDifficulty('challenger');
                const winLen = gameMode === 'bigBoard' ? (gameState as any).winCondition || 4 : 3;
                const mirrored = gameState.board.map(r =>
                  r.map(c => (c === 'X' ? 'O' : c === 'O' ? 'X' : null))
                ) as typeof gameState.board;
                const isInf = gameMode === 'infinity';
                // Mirror the players in the moves list too, so the infinity
                // removal simulation stays consistent with the mirrored board.
                const liveMoves = (isInf
                  ? gameState.moves.slice((gameState as any).oldestMoveIndex || 0)
                  : gameState.moves
                ).map(m => ({ ...m, player: (m.player === 'X' ? 'O' : 'X') as typeof m.player }));
                const hintMove = hintAI.getBestMove(mirrored, isInf, liveMoves, isInf ? 6 : undefined, false, winLen);

                if (!hintMove || hintMove.row < 0) {
                  Alert.alert(t('hintTitle'), t('hintUnavailable'));
                  return;
                }

                const used = await boostService.use('boost_hint');
                if (!used) {
                  Alert.alert(t('noBoostsTitle'), t('buyHintsInStore'));
                  return;
                }
                await triggerHaptics('medium');
                Alert.alert(t('hintTitle'), t('hintBody')
                  .replace('{row}', String(hintMove.row + 1))
                  .replace('{col}', String(hintMove.col + 1)));
              }}
            >
              <Text style={styles.boostEmoji}>💡</Text>
              <Text style={styles.boostCount}>{boostService.getQuantity('boost_hint')}</Text>
            </TouchableOpacity>

            {gameMode === 'blitz' && (
              <TouchableOpacity
                style={styles.boostButton}
                onPress={async () => {
                  const used = await boostService.use('boost_extra_time');
                  if (!used) {
                    Alert.alert(t('noBoostsTitle'), t('buyExtraTimeInStore'));
                    return;
                  }
                  await triggerHaptics('medium');
                  await playSound('button');
                  addBlitzTime(3);
                }}
              >
                <Text style={styles.boostEmoji}>⏱️</Text>
                <Text style={styles.boostCount}>{boostService.getQuantity('boost_extra_time')}</Text>
              </TouchableOpacity>
            )}

            {/* Undo — chests already granted this boost but nothing could
                spend it, so the reward was dead inventory. */}
            <TouchableOpacity
              style={styles.boostButton}
              onPress={async () => {
                if (gameState.moves.length === 0) return;
                if (boostService.getQuantity('boost_undo') <= 0) {
                  Alert.alert(t('noBoostsTitle'), t('buyUndoInStore'));
                  return;
                }
                const used = await boostService.use('boost_undo');
                if (!used) {
                  Alert.alert(t('noBoostsTitle'), t('buyUndoInStore'));
                  return;
                }
                await triggerHaptics('medium');
                await playSound('button');
                undoLastMoves();
              }}
            >
              <Text style={styles.boostEmoji}>↩️</Text>
              <Text style={styles.boostCount}>{boostService.getQuantity('boost_undo')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Game Board */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(800)}
          style={styles.boardContainer}
        >
          {gameMode === 'gravity' ? (
            <GameBoard
              board={gameState.board}
              onCellPress={handleCellPress}
              winningLine={winningLine}
              moves={gameState.moves}
              isInfinityMode={false}
              disabled={!!gameState.winner || (gameState as any).isDraw || isAIThinking || (opponent === 'ai' && gameState.currentPlayer === 'O') || !!(gameState as GravityGameState).pendingFall?.isAnimating}
              pendingFall={(gameState as GravityGameState).pendingFall}
              onGravityFallComplete={completeGravityFall}
              isDraw={(gameState as any).isDraw}
            />
          ) : gameMode === 'bigBoard' ? (
            <BigBoard
              board={gameState.board}
              onCellPress={handleCellPress}
              winningLine={winningLine}
              moves={gameState.moves}
              isDraw={(gameState as any).isDraw}
              disabled={!!gameState.winner || (gameState as any).isDraw || isAIThinking || (opponent === 'ai' && gameState.currentPlayer === 'O')}
            />
          ) : gameMode === 'blind' ? (
            <BlindBoard
              gameState={gameState as any}
              onCellPress={handleCellPress}
              winningLine={winningLine}
              disabled={!!gameState.winner || (gameState as any).isDraw || isAIThinking || (opponent === 'ai' && gameState.currentPlayer === 'O')}
              isDraw={Boolean((gameState as any).isDraw)}
              gameEnded={Boolean(gameState.winner) || Boolean((gameState as any).isDraw)}
            />
          ) : (
            <GameBoard
              board={gameState.board}
              onCellPress={handleCellPress}
              winningLine={winningLine}
              moves={gameState.moves}
              isInfinityMode={isInfinityMode}
              nextToRemove={isInfinityMode ? (gameState as any).nextToRemove : null}
              frozenCell={
                gameMode === 'mad' && (gameState as MadGameState).frozenTurnsLeft > 0
                  ? (gameState as MadGameState).frozenCell
                  : null
              }
              isDraw={(gameState as any).isDraw}
              cellSizes={gameMode === 'gobble' ? (gameState as GobbleGameState).cellSizes : null}
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
                {t('pieces')}: {gameState.board.flat().filter(Boolean).length}/6
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

              {/* Replay's only entrance used to be the "Ver Tabuleiro" button,
                  which promised the board and delivered a paywall. It lives
                  here now, labelled for what it is. */}
              {(gameState.winner || (gameState as any).isDraw) && (
                <TouchableOpacity
                  onPress={handleOpenReplay}
                  style={styles.menuItem}
                  activeOpacity={0.7}
                >
                  <Ionicons name="play-circle-outline" size={20} color={COLORS.gold} />
                  <Text style={[styles.menuItemText, { color: COLORS.gold }]}>
                    {t('watchReplay')}
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

        {/* Emote Bar - every match, not just online */}
        <EmoteBar
          onSendEmote={handleSendEmote}
          receivedEmote={receivedEmote}
        />

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
          onShare={handleShareResult}
          onClose={handleCloseModal}
          rewards={lastRewards && { ...lastRewards, chest: pendingChestRarity }}
          playAgainLabel={
            tournamentFinished
              ? (tournamentFinished.won ? t('viewPrize') : t('backToHome'))
              : tournamentNextRoundLabel || undefined
          }
        />

        {/* Chest Modal */}
        <ChestModal
          visible={showChestModal}
          chestRarity={pendingChestRarity}
          onOpen={async () => {
            return await chestService.openChest();
          }}
          onOpenWithAd={async () => {
            // Show rewarded ad, then open chest if ad completed
            const reward = await adMobService.showRewarded();
            if (reward) {
              return await chestService.openChest();
            }
            // Ad failed or skipped — don't open
            Alert.alert(t('adTitle'), t('adIncompleteBody'));
            return null;
          }}
          onClose={() => {
            setShowChestModal(false);
            setPendingChestRarity(null);
            // If game end modal was already closed (user clicked Play Again), restart now
            if (!showGameEndModal && !showOnlineEndModal) {
              setTimeout(() => {
                setShowVictoryAnimation(false);
                setGameStatsUpdated(false);
                gameEndProcessedRef.current = false;
                restartGame();
              }, 200);
            }
          }}
        />

        {/* Replay Modal */}
        <ReplayModal
          visible={showReplay}
          moves={replayMoves}
          boardSize={gameState.board.length}
          winner={replayWinner}
          isPremium={iapService.isSubscribed()}
          onClose={() => {
            setShowReplay(false);
            // If tournament finished, replay close also returns to Home
            if (tournamentFinished) {
              setTournamentFinished(null);
              setTimeout(() => (navigation as any).navigate('Home'), 200);
              return;
            }
            tryShowChest();
          }}
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

        {/* Blitz Time Picker Modal */}
        <BlitzTimePicker
          visible={showBlitzTimePicker}
          currentTime={(gameState as BlitzGameState).timePerMove || 3}
          onSelectTime={(seconds) => {
            setBlitzTime(seconds);
            setShowBlitzTimePicker(false);
          }}
          onClose={() => setShowBlitzTimePicker(false)}
        />

        {/* Remove Ads Floating Button - visible during game */}
        <RemoveAdsButton variant="floating" />

        {/* Mad mode mutation announcement */}
        {madBanner && (
          <MadMutationBanner
            mutationId={madBanner.id}
            type={madBanner.type}
            onDone={() => setMadBanner(null)}
          />
        )}

        {/* Bomb mode explosion */}
        {bombBlast && (
          <BombExplosion
            explosionKey={bombBlast.key}
            message={bombBlast.message}
            onDone={() => setBombBlast(null)}
          />
        )}

        {/* Level Up celebration */}
        <LevelUpAnimation
          visible={levelUpInfo.visible}
          newLevel={levelUpInfo.level}
          onClose={() => setLevelUpInfo({ visible: false, level: 0 })}
        />

      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  onlinePlayersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  onlinePlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.darkSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    opacity: 0.6,
  },
  onlinePlayerActive: {
    opacity: 1,
    borderWidth: 1,
    borderColor: COLORS.xColor,
  },
  // Centred behind the board; purely decorative, never intercepts touches.
  sealLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlinePlayerAvatar: {
    width: 24,
    height: 24,
  },
  onlinePlayerName: {
    ...createTextStyle('sm', 'bold'),
    color: COLORS.white,
    maxWidth: 80,
  },
  onlineVs: {
    ...createTextStyle('xs', 'bold'),
    color: COLORS.gray,
  },
  boostBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  boostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    gap: 4,
    ...SHADOWS.light,
  },
  boostEmoji: {
    fontSize: 18,
  },
  boostCount: {
    ...createTextStyle('xs', 'bold'),
    color: COLORS.lightGray,
  },
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

