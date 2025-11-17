import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Appbar, Card, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { familyApi } from '../api/family';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/numberHelpers';

export default function SharedProductsScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const styles = createStyles(theme);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await familyApi.getSharedProducts();
      setProducts(data.products);
    } catch (error) {
      console.error('Load products error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const getWarrantyStatus = (product) => {
    if (product.is_active === false) {
      return { label: t('product.status.inactive', 'Inactive'), color: '#757575' };
    }

    const today = new Date();
    const endDate = new Date(product.warranty_end_date);
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return { label: t('product.status.expired', 'Expired'), color: '#f44336' };
    } else if (daysRemaining <= 30) {
      return { label: t('product.status.daysLeft', { count: daysRemaining }), color: '#ff9800' };
    } else {
      return { label: t('product.status.active', 'Active'), color: '#4caf50' };
    }
  };

  const renderProduct = ({ item }) => {
    const warrantyStatus = getWarrantyStatus(item);
    const purchaseDate = new Date(item.purchase_date).toLocaleDateString();
    const sharedDate = new Date(item.shared_at).toLocaleDateString();

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ProductDetail', { productId: item.product_id })}
      >
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Text variant="titleMedium" style={styles.productName}>
                  {item.product_name}
                </Text>
                {item.brand && (
                  <Text variant="bodySmall" style={styles.brand}>
                    {item.brand}
                  </Text>
                )}
                <Text variant="bodySmall" style={styles.sharedBy}>
                  {t('family.sharedBy')}: {item.shared_by}
                </Text>
              </View>
              <Chip
                mode="flat"
                style={[styles.statusChip, { backgroundColor: warrantyStatus.color + '20' }]}
                textStyle={{ color: warrantyStatus.color, fontSize: 12 }}
              >
                {warrantyStatus.label}
              </Chip>
            </View>

            <View style={styles.cardDetails}>
              {item.Store && (
                <Text variant="bodySmall" style={styles.detailText}>
                  🏪 {item.Store.store_name}
                </Text>
              )}
              <Text variant="bodySmall" style={styles.detailText}>
                📅 {t('product.purchaseDate')}: {purchaseDate}
              </Text>
              {item.purchase_price && (
                <Text variant="bodySmall" style={styles.detailText}>
                  💰 {formatCurrency(item.purchase_price, item.currency)}
                </Text>
              )}
              <Text variant="bodySmall" style={styles.detailText}>
                📤 {t('family.sharedOn')}: {sharedDate}
              </Text>
            </View>

            {item.Category && (
              <Chip
                mode="flat"
                style={styles.categoryChip}
                textStyle={{ fontSize: 11 }}
              >
                {item.Category.category_name}
              </Chip>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('family.sharedProducts')} />
      </Appbar.Header>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            {t('family.noSharedProducts')}
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            {t('family.noSharedProductsDescription')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.product_id.toString()}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    marginBottom: 10,
    textAlign: 'center',
    color: theme.colors.text
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary
  },
  list: {
    padding: 16
  },
  card: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: theme.colors.card
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 8
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.text
  },
  brand: {
    color: theme.colors.textSecondary,
    marginBottom: 4
  },
  sharedBy: {
    color: theme.colors.primary,
    fontStyle: 'italic'
  },
  statusChip: {
    height: 34
  },
  cardDetails: {
    marginBottom: 8
  },
  detailText: {
    color: theme.colors.textSecondary,
    marginBottom: 4
  },
  categoryChip: {
    alignSelf: 'flex-start',
    height: 32
  }
});

