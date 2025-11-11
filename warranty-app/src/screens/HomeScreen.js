import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { Text, FAB, Appbar, Card, Chip, Searchbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { productsApi } from '../api/products';

export default function HomeScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isInitialMount = useRef(true);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    // Refresh products when screen is focused (e.g., after adding a product)
    const unsubscribe = navigation.addListener('focus', () => {
      const refresh = route.params?.refresh;
      if (refresh) {
        loadProducts();
        // Clear the refresh param
        navigation.setParams({ refresh: false });
      }
    });

    return unsubscribe;
  }, [navigation, route.params]);

  useEffect(() => {
    // Skip search on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      loadProducts();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const params = { 
        status: 'active',
        sort: 'purchase_date',
        order: 'DESC',
        limit: 50, // Set explicit limit to prevent loading too many products at once
        page: 1
      };
      
      // Add search query if present
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      const data = await productsApi.getProducts(params);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
      // Show user-friendly error message
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('Request timed out. The server may be slow or unreachable.');
      }
      // Set empty array on error to prevent UI issues
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const getWarrantyStatus = (warrantyEndDate) => {
    const today = new Date();
    const endDate = new Date(warrantyEndDate);
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return { label: t('product.expired'), color: '#f44336' };
    } else if (daysRemaining <= 30) {
      return { label: t('product.daysLeft', { count: daysRemaining }), color: '#ff9800' };
    } else {
      return { label: t('product.active'), color: '#4caf50' };
    }
  };

  const renderProduct = ({ item }) => {
    const warrantyStatus = getWarrantyStatus(item.warranty_end_date);
    const purchaseDate = new Date(item.purchase_date).toLocaleDateString('sr-RS');

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
                  💰 {item.purchase_price} {item.currency}
                </Text>
              )}
            </View>

            {item.Category && (
              <Chip
                mode="outlined"
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

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.Action 
          icon="account-group" 
          onPress={() => navigation.navigate('Family')}
        />
        <Appbar.Action 
          icon="file-export" 
          onPress={() => navigation.navigate('Export')}
        />
        <Appbar.Action 
          icon="text-recognition" 
          onPress={() => navigation.navigate('OCRScanner')}
        />
        <Appbar.Action 
          icon="bell" 
          onPress={() => navigation.navigate('NotificationSettings')}
        />
        <Appbar.Action 
          icon="chart-box" 
          onPress={() => navigation.navigate('Statistics')} 
        />
        {/* <Appbar.Action 
          icon="magnify" 
          onPress={() => navigation.navigate('Search')} 
        /> */}
        <Appbar.Action icon="cog" onPress={() => navigation.navigate('Settings')} />
      </Appbar.Header>

      <Searchbar
        placeholder={t('common.search')}
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
        iconColor={theme.colors.primary}
        placeholderTextColor={theme.colors.placeholder}
        onIconPress={() => navigation.navigate('Search')}
      />

      {isLoading && products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text>{t('common.loading')}</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            {t('home.noWarranties')}
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            {t('home.noWarrantiesDescription')}
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

      <FAB
        icon="barcode-scan"
        style={styles.scanFab}
        onPress={() => navigation.navigate('BarcodeScanner')}
        label="Scan"
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddProduct')}
      />
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  appBar: {
    backgroundColor: theme.colors.appBar,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 56
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
    elevation: 2
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
    padding: 16,
    paddingTop: 8
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
    color: theme.colors.textSecondary
  },
  statusChip: {
    height: 32
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
  },
  scanFab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80,
    backgroundColor: theme.colors.primary
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.fab
  }
});
