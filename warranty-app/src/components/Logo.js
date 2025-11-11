import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';

export default function Logo({ 
  size = 'medium', 
  style, 
  variant = 'default',
  animated = false,
  showText = true 
}) {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  React.useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated, scaleAnim]);
  
  const sizes = {
    small: 32,
    medium: 48,
    large: 80,
    xlarge: 120
  };
  
  const fontSize = sizes[size] || sizes.medium;
  
  const variants = {
    default: {
      borderRadius: fontSize / 4,
      backgroundColor: theme.colors.primary,
    },
    rounded: {
      borderRadius: fontSize / 2,
      backgroundColor: theme.colors.primary,
    },
    square: {
      borderRadius: fontSize / 8,
      backgroundColor: theme.colors.primary,
    },
    outlined: {
      borderRadius: fontSize / 4,
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    gradient: {
      borderRadius: fontSize / 4,
      backgroundColor: theme.colors.primary,
    }
  };
  
  const variantStyle = variants[variant] || variants.default;
  
  const styles = StyleSheet.create({
    container: {
      width: fontSize,
      height: fontSize,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: variant === 'outlined' ? 0 : 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      ...variantStyle,
    },
    text: {
      fontSize: fontSize * 0.6,
      fontWeight: 'bold',
      color: variant === 'outlined' ? theme.colors.primary : '#FFFFFF',
      letterSpacing: 1,
    }
  });
  
  const containerStyle = animated 
    ? [styles.container, style, { transform: [{ scale: scaleAnim }] }]
    : [styles.container, style];
  
  return (
    <Animated.View style={containerStyle}>
      {showText && (
        <Text style={styles.text}>W</Text>
      )}
    </Animated.View>
  );
}

