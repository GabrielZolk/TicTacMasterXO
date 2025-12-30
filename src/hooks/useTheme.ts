import { useGame } from '../contexts/GameContext';
import { getThemeColors } from '../utils/theme';

export const useTheme = () => {
  const { gameConfig } = useGame();
  const theme = gameConfig.theme;
  const themeColors = getThemeColors(theme);
  
  return {
    theme,
    colors: themeColors,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };
};

