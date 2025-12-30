import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, createButtonStyle, createTextStyle, SHADOWS } from '../utils/theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'gradient';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const buttonStyles = createButtonStyle(variant);
  
  const sizeStyles = {
    small: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      minHeight: 44,
    },
    medium: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      minHeight: 56,
    },
    large: {
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.lg,
      minHeight: 64,
    },
  };

  const textSizes = {
    small: createTextStyle('md', 'semibold'),
    medium: createTextStyle('lg', 'bold'),
    large: createTextStyle('xl', 'bold'),
  };

  const getTextColor = () => {
    if (disabled) return COLORS.gray;
    switch (variant) {
      case 'outline':
        return COLORS.gold;
      case 'secondary':
        return COLORS.lightGray;
      default:
        return COLORS.white;
    }
  };

  const buttonContent = (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        buttonStyles,
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text
            style={[
              textSizes[size],
              { color: getTextColor() },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={disabled ? [COLORS.darkGray, COLORS.gray] : COLORS.buttonGradient}
        style={[
          styles.gradientButton,
          sizeStyles[size],
          fullWidth && styles.fullWidth,
          style,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled || loading}
          activeOpacity={0.8}
          style={styles.gradientContent}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <View style={styles.content}>
              {icon && <View style={styles.icon}>{icon}</View>}
              <Text
                style={[
                  textSizes[size],
                  { color: disabled ? COLORS.gray : COLORS.white },
                  textStyle,
                ]}
              >
                {title}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return buttonContent;
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientButton: {
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  gradientContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: SPACING.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default CustomButton;
