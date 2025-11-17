import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Text, Chip, useTheme, IconButton } from 'react-native-paper';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { getWarrantyStatus, formatDate, getDaysUntilExpiry } from '../utils/dateHelpers';
import { useTranslation } from 'react-i18next';

const ACTION_WIDTH = 240;
const priceFormatter = new Intl.NumberFormat('sr-RS', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function ProductCard({ product, onPress, onToggleStatus, onDelete, onExtend }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const status = getWarrantyStatus(product.warranty_end_date);
  const daysUntil = getDaysUntilExpiry(product.warranty_end_date);
  const [opacity] = useState(new Animated.Value(1));
  const [isOpen, setIsOpen] = useState(false);
  const swipeableRef = useRef(null);

  const getStatusColor = () => {
    if (product.is_active === false) {
      return '#757575';
    }
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
    if (product.is_active === false) {
      return t('product.status.inactive', 'Inactive');
    }
    if (status === 'expired') return t('product.status.expired', 'Expired');
    if (daysUntil !== null && daysUntil <= 30) {
      return t('product.status.daysLeft', { count: daysUntil });
    }
    return t('product.status.active', 'Active');
  };

  const formatPrice = (value, currency) => {
    if (value === null || value === undefined) return null;
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return value;
    const formatted = priceFormatter.format(numericValue);
    return currency ? `${formatted} ${currency}` : formatted;
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

  const closeSwipe = () => {
    swipeableRef.current?.close();
    setIsOpen(false);
  };

  const handleToggleStatus = async () => {
    closeSwipe();
    if (onToggleStatus) {
      await onToggleStatus(product.product_id, !product.is_active);
    }
  };

  const handleDelete = async () => {
    closeSwipe();
    if (onDelete) {
      await onDelete(product.product_id);
    }
  };

  const handleExtend = () => {
    closeSwipe();
    if (onExtend) {
      onExtend(product);
    }
  };

  const cardStyles = createCardStyles(theme);

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={ACTION_WIDTH / 2}
      overshootRight={false}
      renderRightActions={() => (
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.toggleButton]}
            onPress={handleToggleStatus}
            activeOpacity={0.7}
          >
            <IconButton
              icon={product.is_active ? 'eye-off' : 'eye'}
              iconColor="#fff"
              size={24}
            />
            <Text style={styles.actionText}>
              {product.is_active
                ? t('product.actions.markInactive', 'Make inactive')
                : t('product.actions.markActive', 'Make active')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <IconButton
              icon="delete"
              iconColor="#fff"
              size={24}
            />
            <Text style={styles.actionText}>{t('product.actions.delete', 'Delete')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.extendButton]}
            onPress={handleExtend}
            activeOpacity={0.7}
          >
            <IconButton
              icon="calendar-plus"
              iconColor="#fff"
              size={24}
            />
            <Text style={styles.actionText}>{t('product.actions.extend', 'Extend')}</Text>
          </TouchableOpacity>
        </View>
      )}
      onSwipeableOpen={() => setIsOpen(true)}
      onSwipeableClose={() => setIsOpen(false)}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          if (isOpen) {
            closeSwipe();
          } else if (onPress) {
            onPress();
          }
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        <Animated.View
          style={{ opacity }}
        >
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
                  {t('product.expiresLabel', 'Expires')}: {formatDate(product.warranty_end_date)}
                </Text>
              )}
              {product.purchase_price && (
                <Text variant="bodySmall" style={cardStyles.date}>
                  {t('product.priceLabel', 'Price')}: {formatPrice(product.purchase_price, product.currency)}
                </Text>
              )}
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  touchable: {
    marginBottom: 12,
    marginHorizontal: 16,
    backgroundColor: '#fff',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
    width: ACTION_WIDTH,
    minHeight: 100,
    maxHeight: '89%',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  toggleButton: {
    backgroundColor: '#ff9800',
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
  },
  extendButton: {
    backgroundColor: '#1976d2',
  },
  actionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});

const createCardStyles = (theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface || '#fff',
    borderRadius: 0,
    padding: 0,
    margin: 0,
    minHeight: 100,
    // Completely remove all shadows/elevation for Android
    elevation: 0,
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowColor: 'black',
    // Additional Android-specific shadow removal
    ...(Platform.OS === 'android' && {
      elevation: 0,
      borderWidth: 0,
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
      borderRadius: 4,
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

