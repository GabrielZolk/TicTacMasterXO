import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = keyof typeof Ionicons.glyphMap;
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../utils/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n/useI18n';
import { GameRewards } from '../types/game';

const { width, height } = Dimensions.get('window');

interface GameEndModalProps {
  visible: boolean;
  winner: 'X' | 'O' | null;
  isDraw: boolean;
  gameMode: string;
  onPlayAgain: () => void;
  onViewBoard: () => void;
  onClose: () => void;
  playAgainLabel?: string; // Override button text (e.g., "Proxima Rodada")
  /** Shows the "share result" button when provided. */
  onShare?: () => void;
  /**
   * What the round paid out. Everything in it was already being credited and
   * none of it was shown, so a win read as if it paid nothing.
   */
  rewards?: GameRewards | null;
}

const GameEndModal: React.FC<GameEndModalProps> = ({
  visible,
  winner,
  isDraw,
  gameMode,
  playAgainLabel,
  onPlayAgain,
  onViewBoard,
  onClose,
  onShare,
  rewards,
}) => {
  const { colors } = useTheme();
  const { t, tc } = useI18n();
  // Use useRef to persist animation values across renders
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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

  const getResultInfo = () => {
    if (isDraw) {
      return {
        title: t('gameResult.draw'),
        subtitle: t('gameResult.drawMessage'),
        icon: 'hand-right-outline' as const,
        color: COLORS.warning,
        emoji: '🤝',
      };
    } else if (winner) {
      const isPlayerWin = winner === 'X';
      return {
        title: isPlayerWin ? t('gameResult.victory') : t('gameResult.defeat'),
        subtitle: isPlayerWin 
          ? t('gameResult.victoryMessage') 
          : t('gameResult.defeatMessage'),
        icon: isPlayerWin ? 'trophy-outline' : 'sad-outline',
        color: isPlayerWin ? COLORS.success : COLORS.error,
        emoji: isPlayerWin ? '🏆' : '😔',
      };
    }
    return {
      title: t('gameResult.gameOver'),
      subtitle: '',
      icon: 'flag-outline',
      color: COLORS.info,
      emoji: '🏁',
    };
  };

  const resultInfo = getResultInfo();

  // One pill per thing actually earned. A payout of zero is left out rather than
  // shown as "+0", so a loss doesn't advertise an empty reward row.
  const rewardChips: { emoji: string; value: string; color: string }[] = [];
  if (rewards) {
    if (rewards.stars > 0) rewardChips.push({ emoji: '⭐', value: `+${rewards.stars}`, color: COLORS.gold });
    if (rewards.xp > 0) rewardChips.push({ emoji: '⚡', value: `+${rewards.xp} XP`, color: COLORS.xColor });
    if (rewards.rankedPoints > 0) rewardChips.push({ emoji: '🏆', value: `+${rewards.rankedPoints}`, color: COLORS.info });
    if (rewards.chest) rewardChips.push({ emoji: '🎁', value: t('chest'), color: COLORS.warning });
    if (rewards.leveledUp) {
      rewardChips.push({
        emoji: '🎖️',
        value: t('levelUpTo').replace('{level}', String(rewards.newLevel)),
        color: COLORS.success,
      });
    }
    rewards.achievements.forEach((id) => {
      rewardChips.push({ emoji: '🏅', value: tc(`achv.${id}.title`, id), color: COLORS.success });
    });
  }

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
                  name={resultInfo.icon as IoniconName} 
                  size={32} 
                  color={resultInfo.color}
                  style={styles.headerIcon}
                />
              </View>
              
              <Text style={[styles.title, { color: colors.text }]}>
                {resultInfo.title}
              </Text>
              
              {resultInfo.subtitle ? (
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {resultInfo.subtitle}
                </Text>
              ) : null}
            </View>

            {/* Game Info */}
            <View style={styles.gameInfo}>
              <View style={[styles.gameInfoItem, { backgroundColor: colors.secondary + '30' }]}>
                <Ionicons name="game-controller-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.gameInfoText, { color: colors.textSecondary }]}>
                  {gameMode}
                </Text>
              </View>
              
              {winner && (
                <View style={[styles.gameInfoItem, { backgroundColor: resultInfo.color + '20' }]}>
                  <Text style={[styles.winnerText, { color: resultInfo.color }]}>
                    {t('gameResult.winner')}: {winner}
                  </Text>
                </View>
              )}
            </View>

            {/* What the round paid out. Same pill language as the game-info row
                above, so it reads as part of the card and not as a banner. */}
            {rewardChips.length > 0 && (
              <View style={styles.rewards}>
                <Text style={[styles.rewardsTitle, { color: colors.textSecondary }]}>
                  {t('rewardsEarned')}
                </Text>
                <View style={styles.rewardsRow}>
                  {rewardChips.map((chip, i) => (
                    <View
                      key={i}
                      style={[styles.rewardChip, { backgroundColor: chip.color + '1F', borderColor: chip.color + '55' }]}
                    >
                      <Text style={styles.rewardEmoji}>{chip.emoji}</Text>
                      <Text style={[styles.rewardValue, { color: chip.color }]}>{chip.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, { backgroundColor: COLORS.xColor }]}
                onPress={onPlayAgain}
                activeOpacity={0.8}
              >
                <Ionicons name={playAgainLabel ? "arrow-forward" : "refresh-outline"} size={20} color="white" />
                <Text style={styles.primaryButtonText}>
                  {playAgainLabel || t('actions.playAgain')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton, { borderColor: colors.secondary }]}
                onPress={onViewBoard}
                activeOpacity={0.8}
              >
                <Ionicons name="eye-outline" size={20} color={colors.text} />
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                  {t('actions.viewBoard')}
                </Text>
              </TouchableOpacity>

              {/* Shareable emoji result card — the main organic-growth hook */}
              {onShare && (
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton, { borderColor: COLORS.gold }]}
                  onPress={onShare}
                  activeOpacity={0.8}
                >
                  <Ionicons name="share-social-outline" size={20} color={COLORS.gold} />
                  <Text style={[styles.secondaryButtonText, { color: COLORS.gold }]}>
                    {t('shareResult')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 400,
  },
  modal: {
    borderRadius: 20,
    padding: 24,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.darkGray + '40',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  emoji: {
    fontSize: 32,
    position: 'absolute',
    top: 8,
    right: 8,
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
  gameInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  rewards: {
    alignItems: 'center',
    marginTop: -12,
    marginBottom: 22,
  },
  rewardsTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  rewardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  rewardEmoji: {
    fontSize: 14,
  },
  rewardValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  gameInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  gameInfoText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  winnerText: {
    fontSize: 14,
    fontWeight: 'bold',
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
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
});

export default GameEndModal;
