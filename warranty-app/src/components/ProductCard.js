import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Text, Chip, useTheme } from 'react-native-paper';
import { getWarrantyStatus, formatDate, getDaysUntilExpiry } from '../utils/dateHelpers';

export default function ProductCard({ product, onPress }) {
  const theme = useTheme();
  const status = getWarrantyStatus(product.warranty_end_date);
  const daysUntil = getDaysUntilExpiry(product.warranty_end_date);
  const [opacity] = useState(new Animated.Value(1));

  const getStatusColor = () => {
    switch (status) {
      case 'expired':
        return '#d32f2f';
      case 'expiring_soon':
        return '#f57c00';
      default:
        return '#388e3c';
    }
  };

  const getStatusText = () => {
    if (status === 'expired') return 'Expired';
    if (daysUntil !== null && daysUntil <= 7) return `${daysUntil} days left`;
    if (daysUntil !== null && daysUntil <= 30) return `${daysUntil} days left`;
    return 'Active';
  };

  const handlePressIn = () => {
    Animated.timing(opacity, {
      toValue: 0.6,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const cardStyles = createCardStyles(theme);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.touchable}
    >
      <Animated.View style={{ opacity }}>
        <View style={cardStyles.card}>
          <View style={cardStyles.content}>
            <View style={cardStyles.header}>
              <Text variant="titleMedium" style={cardStyles.productName}>
                {product.product_name}
              </Text>
              <Chip 
                style={[cardStyles.chip, { backgroundColor: getStatusColor() }]}
                textStyle={cardStyles.chipText}
              >
                {getStatusText()}
              </Chip>
            </View>
            
            {product.brand && (
              <Text variant="bodyMedium" style={cardStyles.brand}>
                {product.brand}
              </Text>
            )}

            {product.warranty_end_date && (
              <Text variant="bodySmall" style={cardStyles.date}>
                Expires: {formatDate(product.warranty_end_date)}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    marginBottom: 12,
    marginHorizontal: 16
  }
});

const createCardStyles = (theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface || '#fff',
    borderRadius: 4,
    padding: 0,
    margin: 0,
    // Completely remove all shadows/elevation for Android
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowColor: 'transparent',
    // Additional Android-specific shadow removal
    ...(Platform.OS === 'android' && {
      elevation: 0,
      borderWidth: 0,
    }),
  },
  content: {
    padding: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  productName: {
    flex: 1,
    fontWeight: 'bold',
    color: theme.colors.text
  },
  chip: {
    marginLeft: 8
  },
  chipText: {
    color: '#fff',
    fontSize: 12
  },
  brand: {
    color: theme.colors.textSecondary || '#666',
    marginTop: 4
  },
  date: {
    color: theme.colors.textSecondary || '#999',
    marginTop: 4
  }
});

