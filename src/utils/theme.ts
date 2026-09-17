import { Dimensions } from 'react-native';
import { ThemeType } from '../types/game';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // Primary colors for X and O
  xColor: '#FF6B35', // Orange/Coral for X
  oColor: '#00BF63', // Green for O

  // Dark theme colors (primary)
  darkBackground: '#0A0A0A',
  darkSecondary: '#1A1A2E',
  darkTertiary: '#16213E',

  // Light theme colors
  lightBackground: '#F5F5F5',
  lightSecondary: '#FFFFFF',
  lightTertiary: '#E8E8E8',

  // Accent colors
  gold: '#FFD700',
  yellow: '#FFC107',

  // Neutral colors
  white: '#FFFFFF',
  lightGray: '#E0E0E0',
  gray: '#9E9E9E',
  darkGray: '#424242',
  black: '#000000',

  // Status colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',

  // Gradients
  primaryGradient: ['#0A0A0A', '#1A1A2E', '#000000'],
  lightGradient: ['#F5F5F5', '#E8E8E8', '#FFFFFF'],
  buttonGradient: ['#16213E', '#1A1A2E'],
  lightButtonGradient: ['#FFFFFF', '#E8E8E8'],
  winnerGradient: ['#FFD700', '#FFC107'],

  // New Theme Colors
  // Cartoon Theme
  cartoonBackground: '#FFE4E1',
  cartoonSecondary: '#FFB6C1',
  cartoonTertiary: '#FF69B4',
  cartoonPrimary: '#FF1493',
  cartoonAccent: '#32CD32',
  cartoonGradient: ['#FFE4E1', '#FFB6C1', '#FF69B4'],

  // Futuristic Theme
  futuristicBackground: '#0D1421',
  futuristicSecondary: '#1A2332',
  futuristicTertiary: '#2D3748',
  futuristicPrimary: '#00D9FF',
  futuristicAccent: '#7C3AED',
  futuristicGradient: ['#0D1421', '#1A2332', '#2D3748'],

  // Meme Theme
  memeBackground: '#FFF8DC',
  memeSecondary: '#FFFF00',
  memeTertiary: '#FF6347',
  memePrimary: '#FF4500',
  memeAccent: '#32CD32',
  memeGradient: ['#FFF8DC', '#FFFF00', '#FF6347'],

  // Neon Theme
  neonBackground: '#000000',
  neonSecondary: '#1a0033',
  neonTertiary: '#330066',
  neonPrimary: '#FF00FF',
  neonAccent: '#00FFFF',
  neonGradient: ['#000000', '#1a0033', '#330066'],

  // Retro Theme
  retroBackground: '#8B4513',
  retroSecondary: '#CD853F',
  retroTertiary: '#DEB887',
  retroPrimary: '#FFD700',
  retroAccent: '#FF6347',
  retroGradient: ['#8B4513', '#CD853F', '#DEB887'],

  // Nature Theme
  natureBackground: '#2F4F2F',
  natureSecondary: '#228B22',
  natureTertiary: '#32CD32',
  naturePrimary: '#ADFF2F',
  natureAccent: '#FF6347',
  natureGradient: ['#2F4F2F', '#228B22', '#32CD32'],

  // Samuel Doutor Estranho Theme
  samuelBackground: '#0a0410',
  samuelSecondary: '#1a0f28',
  samuelTertiary: '#2e1a4a',
  samuelPrimary: '#ff6b00',
  samuelAccent: '#00ffcc',
  samuelMystic: '#9d00ff',
  samuelPortal: '#ff00aa',
  samuelEnergy: '#ffed00',
  samuelGradient: ['#0a0410', '#1a0f28', '#2e1a4a'],
  samuelMysticGradient: ['#2e1a4a', '#9d00ff', '#ff00aa'],
  samuelPortalGradient: ['#ff6b00', '#ff00aa', '#00ffcc'],

  // Copa Nick theme (homenagem — figurinha de álbum de Copa)
  copaNickBackground: '#F6EDD4',   // papel creme do álbum
  copaNickSecondary: '#EFE3BC',    // creme mais quente
  copaNickTertiary: '#17803E',     // verde bandeira
  copaNickPrimary: '#155F31',      // verde escuro (texto)
  copaNickGold: '#C9A227',         // chuteira de ouro
  copaNickBlue: '#1B4FA0',         // azul copa
  copaNickGradient: ['#F6EDD4', '#EFE3BC', '#E7D392'],
  copaNickShineGradient: ['#C9A227', '#FFE98A', '#C9A227'],

  // Matrix Theme
  matrixBackground: '#0D0208',
  matrixSecondary: '#001A00',
  matrixTertiary: '#003300',
  matrixPrimary: '#00FF41',
  matrixAccent: '#00DD00',
  matrixGradient: ['#0D0208', '#001A00', '#003300'],

  // Ocean Theme
  oceanBackground: '#001F3F',
  oceanSecondary: '#003D5C',
  oceanTertiary: '#006494',
  oceanPrimary: '#00D9FF',
  oceanAccent: '#87CEEB',
  oceanGradient: ['#001F3F', '#003D5C', '#006494'],

  // Fire & Ice Theme
  fireIceBackground: '#1A0A2E',
  fireIceSecondary: '#2E1A47',
  fireIceTertiary: '#4A1A4A',
  fireIcePrimary: '#FF6B35',
  fireIceAccent: '#00D9FF',
  fireIceGradient: ['#1A0A2E', '#2E1A47', '#4A1A4A'],

  // Gold Luxury Theme
  goldLuxuryBackground: '#1A1106',
  goldLuxurySecondary: '#2E1F0A',
  goldLuxuryTertiary: '#4A3310',
  goldLuxuryPrimary: '#FFD700',
  goldLuxuryAccent: '#FFA500',
  goldLuxuryGradient: ['#1A1106', '#2E1F0A', '#4A3310'],

  // Alien Theme
  alienBackground: '#0A0520',
  alienSecondary: '#16093D',
  alienTertiary: '#2D0F5E',
  alienPrimary: '#B026FF',
  alienAccent: '#00FF88',
  alienGradient: ['#0A0520', '#16093D', '#2D0F5E'],
};

export const FONTS = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    title: 40,
    header: 48,
  },
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
};

export const SHADOWS = {
  light: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4.65,
    elevation: 8,
  },
  heavy: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5.62,
    elevation: 12,
  },
};

export const DIMENSIONS = {
  screenWidth: width,
  screenHeight: height,
  isSmallDevice: width < 375,
  isMediumDevice: width >= 375 && width < 414,
  isLargeDevice: width >= 414,
};

// Game-specific dimensions
/**
 * The board is square, so it has to be bounded by the SHORT edge of the
 * viewport — not by the width.
 *
 * Sizing off `width` alone only ever worked because the app was locked to
 * portrait. From Android 16 the system ignores that lock on displays of 600dp
 * and up (tablets, foldables, Chromebooks, Android XR — all inside our
 * distribution), so the game can be launched straight into landscape. There
 * `width` is the LONG edge: every cell came out at its maximum and the board
 * ran off the bottom of the screen.
 *
 * `height * 0.72` reserves the ~28% of vertical space the header, the score row
 * and the controls occupy. In portrait that term is far larger than the width,
 * so `Math.min` picks the width and the phone layout is unchanged to the pixel.
 * In landscape it wins, and the board shrinks to fit instead of overflowing.
 */
const boardEdge = Math.min(width, height * 0.72);

export const GAME_DIMENSIONS = {
  boardSize: Math.min(boardEdge * 0.9, 350),
  cellSize: Math.min(boardEdge * 0.25, 100),
  pieceSize: Math.min(boardEdge * 0.18, 70),
};

export const ANIMATIONS = {
  duration: {
    fast: 200,
    medium: 300,
    slow: 500,
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
  },
};

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'gradient' | 'success';

export const createButtonStyle = (variant: ButtonVariant = 'primary') => {
  const baseStyle = {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 56,
    ...SHADOWS.medium,
  };

  switch (variant) {
    case 'primary':
      return {
        ...baseStyle,
        backgroundColor: COLORS.darkTertiary,
        borderWidth: 1,
        borderColor: COLORS.gold,
      };
    case 'secondary':
      return {
        ...baseStyle,
        backgroundColor: COLORS.darkSecondary,
        borderWidth: 1,
        borderColor: COLORS.gray,
      };
    case 'success':
      return {
        ...baseStyle,
        backgroundColor: COLORS.success,
        borderWidth: 1,
        borderColor: COLORS.success,
      };
    case 'outline':
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: COLORS.gold,
        shadowOpacity: 0,
        elevation: 0,
      };
    default:
      return baseStyle;
  }
};

export const createTextStyle = (
  size: keyof typeof FONTS.sizes = 'md',
  weight: keyof typeof FONTS.weights = 'regular',
  color: string = COLORS.white
) => ({
  fontSize: FONTS.sizes[size],
  fontWeight: FONTS.weights[weight],
  color,
});

// Helper functions
export const getResponsiveSize = (baseSize: number): number => {
  if (DIMENSIONS.isSmallDevice) return baseSize * 0.9;
  if (DIMENSIONS.isLargeDevice) return baseSize * 1.1;
  return baseSize;
};

export const getPlayerColor = (player: 'X' | 'O'): string => {
  return player === 'X' ? COLORS.xColor : COLORS.oColor;
};

// Returns the BRIGHT color gradient used in the store preview for a given
// theme. getThemeColors().gradient returns DARKER variants (used for screen
// backgrounds), but the store preview uses these brighter ones — so the
// in-game board (when "Tema" skin is equipped) must use these to match.
export const getStorePreviewGradient = (theme: ThemeType = 'dark'): string[] => {
  switch (theme) {
    case 'meme': return COLORS.memeGradient;
    case 'nature': return COLORS.natureGradient;
    case 'neon': return COLORS.neonGradient;
    case 'retro': return COLORS.retroGradient;
    case 'futuristic': return COLORS.futuristicGradient;
    case 'samuel': return COLORS.samuelGradient;
    case 'copa_nick': return ['#F6EDD4', '#FFE98A', '#17803E'];
    case 'matrix': return COLORS.matrixGradient;
    case 'ocean': return COLORS.oceanGradient;
    case 'fire_ice': return COLORS.fireIceGradient;
    case 'gold_luxury': return COLORS.goldLuxuryGradient;
    case 'alien': return COLORS.alienGradient;
    case 'cartoon': return COLORS.cartoonGradient;
    case 'light': return ['#E8EAF0', '#D0D4E0', '#C0C4D4'];
    case 'dark':
    default: return COLORS.primaryGradient;
  }
};

// Theme utility functions
export const getThemeColors = (theme: ThemeType = 'dark') => {
  switch (theme) {
    case 'light':
      return {
        background: '#E8EAF0',
        secondary: '#D0D4E0',
        tertiary: '#B8BDD0',
        text: '#1A1A2E',
        textSecondary: '#333344',
        textTertiary: '#555566',
        border: '#9EA3B8',
        gradient: ['#E8EAF0', '#D0D4E0', '#C0C4D4'],
        buttonGradient: ['#4A4A6A', '#2A2A4A'],
      };

    case 'cartoon':
      return {
        background: '#2E1A3E',
        secondary: '#3D2650',
        tertiary: '#4E3562',
        text: '#FF69B4',
        textSecondary: '#FFB6C1',
        textTertiary: '#E0E0E0',
        gradient: ['#2E1A3E', '#3D2650', '#4E3562'],
        buttonGradient: ['#FF69B4', '#FF1493'],
      };

    case 'futuristic':
      return {
        background: COLORS.futuristicBackground,
        secondary: COLORS.futuristicSecondary,
        tertiary: COLORS.futuristicTertiary,
        text: COLORS.futuristicPrimary,
        textSecondary: COLORS.white,
        textTertiary: COLORS.lightGray,
        gradient: COLORS.futuristicGradient,
        buttonGradient: [COLORS.futuristicTertiary, COLORS.futuristicAccent],
      };

    case 'meme':
      return {
        background: '#1A1A00',
        secondary: '#2E2E0A',
        tertiary: '#444410',
        text: '#FFD700',
        textSecondary: '#FF6347',
        textTertiary: '#E0E0E0',
        gradient: ['#1A1A00', '#2E2E0A', '#444410'],
        buttonGradient: ['#FF6347', '#FF4500'],
      };

    case 'neon':
      return {
        background: COLORS.neonBackground,
        secondary: COLORS.neonSecondary,
        tertiary: COLORS.neonTertiary,
        text: COLORS.neonPrimary,
        textSecondary: COLORS.neonAccent,
        textTertiary: COLORS.white,
        gradient: COLORS.neonGradient,
        buttonGradient: [COLORS.neonTertiary, COLORS.neonPrimary],
      };

    case 'retro':
      return {
        background: COLORS.retroBackground,
        secondary: COLORS.retroSecondary,
        tertiary: COLORS.retroTertiary,
        text: COLORS.retroPrimary,
        textSecondary: COLORS.white,
        textTertiary: COLORS.lightGray,
        gradient: COLORS.retroGradient,
        buttonGradient: [COLORS.retroTertiary, COLORS.retroPrimary],
      };

    case 'nature':
      return {
        background: COLORS.natureBackground,
        secondary: COLORS.natureSecondary,
        tertiary: COLORS.natureTertiary,
        text: COLORS.naturePrimary,
        textSecondary: COLORS.white,
        textTertiary: COLORS.lightGray,
        gradient: COLORS.natureGradient,
        buttonGradient: [COLORS.natureTertiary, COLORS.naturePrimary],
      };

    case 'samuel':
      return {
        background: COLORS.samuelBackground,
        secondary: COLORS.samuelSecondary,
        tertiary: COLORS.samuelTertiary,
        text: COLORS.samuelPrimary,
        textSecondary: COLORS.samuelAccent,
        textTertiary: COLORS.white,
        gradient: COLORS.samuelGradient,
        buttonGradient: COLORS.samuelMysticGradient,
      };

    case 'copa_nick':
      return {
        background: COLORS.copaNickBackground,
        secondary: COLORS.copaNickSecondary,
        tertiary: COLORS.copaNickTertiary,
        text: COLORS.copaNickPrimary,
        textSecondary: COLORS.copaNickGold,
        textTertiary: COLORS.copaNickBlue,
        gradient: COLORS.copaNickGradient,
        buttonGradient: [COLORS.copaNickTertiary, COLORS.copaNickGold],
      };

    case 'matrix':
      return {
        background: COLORS.matrixBackground,
        secondary: COLORS.matrixSecondary,
        tertiary: COLORS.matrixTertiary,
        text: COLORS.matrixPrimary,
        textSecondary: COLORS.matrixAccent,
        textTertiary: COLORS.white,
        gradient: COLORS.matrixGradient,
        buttonGradient: [COLORS.matrixTertiary, COLORS.matrixPrimary],
      };

    case 'ocean':
      return {
        background: COLORS.oceanBackground,
        secondary: COLORS.oceanSecondary,
        tertiary: COLORS.oceanTertiary,
        text: COLORS.oceanPrimary,
        textSecondary: COLORS.oceanAccent,
        textTertiary: COLORS.white,
        gradient: COLORS.oceanGradient,
        buttonGradient: [COLORS.oceanTertiary, COLORS.oceanPrimary],
      };

    case 'fire_ice':
      return {
        background: COLORS.fireIceBackground,
        secondary: COLORS.fireIceSecondary,
        tertiary: COLORS.fireIceTertiary,
        text: COLORS.fireIcePrimary,
        textSecondary: COLORS.fireIceAccent,
        textTertiary: COLORS.white,
        gradient: COLORS.fireIceGradient,
        buttonGradient: [COLORS.fireIcePrimary, COLORS.fireIceAccent],
      };

    case 'gold_luxury':
      return {
        background: COLORS.goldLuxuryBackground,
        secondary: COLORS.goldLuxurySecondary,
        tertiary: COLORS.goldLuxuryTertiary,
        text: COLORS.goldLuxuryPrimary,
        textSecondary: COLORS.goldLuxuryAccent,
        textTertiary: COLORS.white,
        gradient: COLORS.goldLuxuryGradient,
        buttonGradient: [COLORS.goldLuxuryTertiary, COLORS.goldLuxuryPrimary],
      };

    case 'alien':
      return {
        background: COLORS.alienBackground,
        secondary: COLORS.alienSecondary,
        tertiary: COLORS.alienTertiary,
        text: COLORS.alienPrimary,
        textSecondary: COLORS.alienAccent,
        textTertiary: COLORS.white,
        gradient: COLORS.alienGradient,
        buttonGradient: [COLORS.alienTertiary, COLORS.alienPrimary],
      };


    default: // 'dark'
      return {
        background: COLORS.darkBackground,
        secondary: COLORS.darkSecondary,
        tertiary: COLORS.darkTertiary,
        text: COLORS.white,
        textSecondary: COLORS.lightGray,
        textTertiary: COLORS.gray,
        gradient: COLORS.primaryGradient,
        buttonGradient: COLORS.buttonGradient,
      };
  }
};

// Theme metadata for UI
export const THEME_INFO = {
  dark: {
    name: 'Escuro',
    emoji: '🌙',
    description: 'Tema clássico escuro',
  },
  light: {
    name: 'Claro',
    emoji: '☀️',
    description: 'Tema claro e limpo',
  },
  cartoon: {
    name: 'Cartoon',
    emoji: '🎨',
    description: 'Colorido e divertido',
  },
  futuristic: {
    name: 'Futurístico',
    emoji: '🚀',
    description: 'Cyberpunk e tecnológico',
  },
  meme: {
    name: 'Meme',
    emoji: '😂',
    description: 'Para os amantes de memes',
  },
  neon: {
    name: 'Neon',
    emoji: '💫',
    description: 'Cores vibrantes neon',
  },
  retro: {
    name: 'Retrô',
    emoji: '📻',
    description: 'Nostálgico anos 80/90',
  },
  nature: {
    name: 'Natureza',
    emoji: '🌿',
    description: 'Verde e relaxante',
  },
  samuel: {
    name: '"Samuel Doutor Estranho"',
    emoji: '🔮✨',
    description: 'Místico e dimensional',
  },
  copa_nick: {
    name: '"Copa Nick"',
    emoji: '⚽👟',
    description: 'Figurinha de Copa — bola e Chuteira de Ouro',
  },
  matrix: {
    name: 'Matrix',
    emoji: '💻',
    description: 'Código verde caindo',
  },
  ocean: {
    name: 'Oceano',
    emoji: '🌊',
    description: 'Profundezas marinhas',
  },
  fire_ice: {
    name: 'Fogo & Gelo',
    emoji: '🔥❄️',
    description: 'Contraste épico de elementos',
  },
  gold_luxury: {
    name: 'Ouro Luxo',
    emoji: '👑',
    description: 'Elegância dourada premium',
  },
  alien: {
    name: 'Alienígena',
    emoji: '👽',
    description: 'Mundo extraterrestre',
  },
};

export const createThemedButtonStyle = (
  variant: 'primary' | 'secondary' | 'outline' = 'primary',
  theme: ThemeType = 'dark'
) => {
  const themeColors = getThemeColors(theme);
  const baseStyle = {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 56,
    ...SHADOWS.medium,
  };

  switch (variant) {
    case 'primary':
      return {
        ...baseStyle,
        backgroundColor: themeColors.tertiary,
        borderWidth: 1,
        borderColor: COLORS.gold,
      };
    case 'secondary':
      return {
        ...baseStyle,
        backgroundColor: themeColors.secondary,
        borderWidth: 1,
        borderColor: theme === 'dark' ? COLORS.gray : COLORS.lightGray,
      };
    case 'outline':
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: COLORS.gold,
        shadowOpacity: 0,
        elevation: 0,
      };
    default:
      return baseStyle;
  }
};

export const createThemedTextStyle = (
  size: keyof typeof FONTS.sizes = 'md',
  weight: keyof typeof FONTS.weights = 'regular',
  theme: ThemeType = 'dark',
  variant: 'primary' | 'secondary' | 'tertiary' = 'primary'
) => {
  const themeColors = getThemeColors(theme);
  let color = themeColors.text;

  switch (variant) {
    case 'secondary':
      color = themeColors.textSecondary;
      break;
    case 'tertiary':
      color = themeColors.textTertiary;
      break;
    default:
      color = themeColors.text;
      break;
  }

  return {
    fontSize: FONTS.sizes[size],
    fontWeight: FONTS.weights[weight],
    color,
  };
};

