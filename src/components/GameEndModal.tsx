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
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../utils/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n/useI18n';

const { width, height } = Dimensions.get('window');

interface GameEndModalProps {
  visible: boolean;
  winner: 'X' | 'O' | null;
  isDraw: boolean;
  gameMode: string;
  onPlayAgain: () => void;
  onViewBoard: () => void;
  onClose: () => void;
}

const GameEndModal: React.FC<GameEndModalProps> = ({
  visible,
  winner,
  isDraw,
  gameMode,
  onPlayAgain,
  onViewBoard,
  onClose,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();
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

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton, { backgroundColor: COLORS.xColor }]}
                onPress={onPlayAgain}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={20} color="white" />
                <Text style={styles.primaryButtonText}>
                  {t('actions.playAgain')}
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
