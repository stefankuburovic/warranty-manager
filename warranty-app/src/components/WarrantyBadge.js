import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { getWarrantyStatus, getDaysUntilExpiry } from '../utils/dateHelpers';

export default function WarrantyBadge({ endDate }) {
  const status = getWarrantyStatus(endDate);
  const daysUntil = getDaysUntilExpiry(endDate);

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
    if (daysUntil !== null && daysUntil <= 7) return `${daysUntil} days`;
    if (daysUntil !== null && daysUntil <= 30) return `${daysUntil} days`;
    return 'Active';
  };

  return (
    <Chip 
      style={[styles.badge, { backgroundColor: getStatusColor() }]}
      textStyle={styles.badgeText}
    >
      {getStatusText()}
    </Chip>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start'
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  }
});

