import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { getWarrantyStatus, formatDate, getDaysUntilExpiry } from '../utils/dateHelpers';

export default function ProductCard({ product, onPress }) {
  const status = getWarrantyStatus(product.warranty_end_date);
  const daysUntil = getDaysUntilExpiry(product.warranty_end_date);

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

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.productName}>
            {product.product_name}
          </Text>
          <Chip 
            style={[styles.chip, { backgroundColor: getStatusColor() }]}
            textStyle={styles.chipText}
          >
            {getStatusText()}
          </Chip>
        </View>
        
        {product.brand && (
          <Text variant="bodyMedium" style={styles.brand}>
            {product.brand}
          </Text>
        )}

        {product.warranty_end_date && (
          <Text variant="bodySmall" style={styles.date}>
            Expires: {formatDate(product.warranty_end_date)}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    marginHorizontal: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  productName: {
    flex: 1,
    fontWeight: 'bold'
  },
  chip: {
    marginLeft: 8
  },
  chipText: {
    color: '#fff',
    fontSize: 12
  },
  brand: {
    color: '#666',
    marginTop: 4
  },
  date: {
    color: '#999',
    marginTop: 4
  }
});

