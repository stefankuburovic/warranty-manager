import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Text, FAB, Appbar, Searchbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { productsApi } from '../api/products';
import Logo from '../components/Logo';
import ProductCard from '../components/ProductCard';

const PAGE_SIZE = 20;

export default function HomeScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const isInitialMount = useRef(true);
  const [fabOpen, setFabOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    loadProducts(true);
  }, []);

  useEffect(() => {
    // Refresh products when screen is focused (e.g., after adding/editing/deleting a product)
    const unsubscribe = navigation.addListener('focus', () => {
      // Always refresh when screen comes into focus to ensure list is up to date
      loadProducts();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    // Skip search on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      loadProducts(true);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadProducts = async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setCurrentPage(1);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const page = reset ? 1 : currentPage + 1;
      const params = { 
        // Removed status filter to show all products (active and inactive)
        sort: 'purchase_date',
        order: 'DESC',
        limit: PAGE_SIZE,
        page: page
      };
      
      // Add search query if present
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      const data = await productsApi.getProducts(params);
      const newProducts = data.products || [];
      const pagination = data.pagination || {};
      
      if (reset) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }
      
      setTotalPages(pagination.pages || 1);
      setHasMore(page < (pagination.pages || 1));
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading products:', error);
      // Show user-friendly error message
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('Request timed out. The server may be slow or unreachable.');
      }
      // Set empty array on error only if reset
      if (reset) {
        setProducts([]);
      }
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && !isLoading) {
      loadProducts(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts(true);
    setRefreshing(false);
  };

  const handleToggleStatus = async (productId, newStatus) => {
    try {
      await productsApi.updateProduct(productId, { is_active: newStatus });
      setProducts(prev =>
        prev.map(product =>
          product.product_id === productId ? { ...product, is_active: newStatus } : product
        )
      );
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  const handleDelete = async (productId) => {
    try {
      await productsApi.deleteProduct(productId);
      setProducts(prev => prev.filter(product => product.product_id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleExtendWarranty = (product) => {
    navigation.navigate('EditProduct', { productId: product.product_id, extendMode: true });
  };

  const handleDeleteAllInactive = () => {
    const inactiveProducts = products.filter(product => product.is_active === false);
    if (inactiveProducts.length === 0) {
      Alert.alert(
        t('home.noInactiveTitle', 'No inactive warranties'),
        t('home.noInactiveDescription', 'All warranties are currently active.')
      );
      return;
    }

    Alert.alert(
      t('home.deleteInactiveTitle', 'Delete inactive warranties'),
      t('home.deleteInactiveMessage', 'This will permanently remove all inactive warranties. Continue?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsBulkDeleting(true);
              await Promise.all(
                inactiveProducts.map(product => productsApi.deleteProduct(product.product_id))
              );
              setProducts(prev => prev.filter(product => product.is_active !== false));
            } catch (error) {
              console.error('Error deleting inactive products:', error);
            } finally {
              setIsBulkDeleting(false);
              loadProducts(true);
            }
          },
        },
      ]
    );
  };

  const renderProduct = ({ item }) => {
    return (
      <ProductCard
        product={item}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.product_id })}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
        onExtend={handleExtendWarranty}
      />
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
          <Logo 
            size="medium" 
            animated={isLoading || refreshing}
            imageSource={require('../../assets/logo.png')}
          />
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

      {(isLoading || isBulkDeleting) && products.length === 0 ? (
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
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
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
          {
            icon: 'delete',
            label: t('home.deleteInactiveAction', 'Delete inactive warranties'),
            onPress: () => {
              setFabOpen(false);
              handleDeleteAllInactive();
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
    paddingHorizontal: 2,
    paddingVertical: 8,
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
  fabGroup: {
    position: 'absolute',
    right: 0,
    bottom: 0
  },
  fab: {
    backgroundColor: theme.colors.fab,
    marginRight: 16,
    marginBottom: 16
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center'
  }
});
