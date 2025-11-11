import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { Text, FAB, Appbar, Card, Chip, Searchbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { productsApi } from '../api/products';
import Logo from '../components/Logo';

export default function HomeScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isInitialMount = useRef(true);
  const [fabOpen, setFabOpen] = useState(false);

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
        <View style={styles.appBarLeft}>
          <Appbar.Action 
            icon="account-group" 
            size={32}
            onPress={() => navigation.navigate('Family')}
          />
          <Appbar.Action 
            icon="file-export" 
            size={32}
            onPress={() => navigation.navigate('Export')}
          />
          </View>
        <View style={styles.logoContainer}>
          <Logo size="small" variant="outlined" animated={isLoading || refreshing} />
        </View>
        <View style={styles.appBarRight}>
          <Appbar.Action 
            icon="chart-box" 
            size={32}
            onPress={() => navigation.navigate('Statistics')} 
          />
          <Appbar.Action 
            icon="cog" 
            size={32}
            onPress={() => navigation.navigate('Settings')} 
          />
        </View>
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

      <FAB.Group
        open={fabOpen}
        visible={true}
        icon={fabOpen ? 'close' : 'plus'}
        actions={[
          {
            icon: 'text-recognition',
            label: t('ocr.scanReceipt'),
            onPress: () => {
              setFabOpen(false);
              navigation.navigate('OCRScanner');
            },
          },
          {
            icon: 'barcode-scan',
            label: t('home.scanBarcode'),
            onPress: () => {
              setFabOpen(false);
              navigation.navigate('BarcodeScanner');
            },
          },
          {
            icon: 'plus',
            label: t('home.addProduct') || 'Add Product',
            onPress: () => {
              setFabOpen(false);
              navigation.navigate('AddProduct');
            },
          },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
        onPress={() => {
          if (fabOpen) {
            setFabOpen(false);
          }
        }}
        style={styles.fabGroup}
        fabStyle={styles.fab}
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
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    height: 64
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0,
    paddingHorizontal: 4
  },
  appBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
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
  fabGroup: {
    position: 'absolute',
    right: 0,
    bottom: 0
  },
  fab: {
    backgroundColor: theme.colors.fab,
    marginRight: 16,
    marginBottom: 16
  }
});
