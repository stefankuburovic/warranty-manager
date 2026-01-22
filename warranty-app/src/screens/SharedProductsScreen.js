import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Text, Appbar, Card, Chip, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { familyApi } from '../api/family';
import { productsApi } from '../api/products';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/numberHelpers';
import { useAuth } from '../context/AuthContext';

export default function SharedProductsScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const swipeRefs = useRef(new Map());
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

  const closeSwipe = (productId) => {
    const ref = swipeRefs.current.get(productId);
    ref?.close();
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
      Alert.alert(t('common.error'), error.response?.data?.error || 'Failed to update status');
    } finally {
      closeSwipe(productId);
    }
  };

  const handleDeleteProduct = (productId) => {
    Alert.alert(
      t('product.deleteProduct'),
      t('product.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await productsApi.deleteProduct(productId);
              setProducts(prev => prev.filter(product => product.product_id !== productId));
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert(t('common.error'), t('product.deleteFailed'));
            }
          }
        }
      ]
    );
  };

  const handleUnshareProduct = (productId) => {
    Alert.alert(
      t('family.sharedProducts'),
      t('family.leaveConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('product.actions.unshare', 'Stop sharing'),
          style: 'destructive',
          onPress: async () => {
            try {
              await familyApi.unshareProduct(productId);
              setProducts(prev => prev.filter(product => product.product_id !== productId));
            } catch (error) {
              console.error('Error unsharing product:', error);
              Alert.alert(t('common.error'), error.response?.data?.error || 'Failed to unshare');
            }
          }
        }
      ]
    );
  };

  const renderActionButtons = (item) => {
    const actions = [
      {
        key: 'toggle',
        icon: item.is_active ? 'eye-off' : 'eye',
        label: item.is_active
          ? t('product.actions.markInactive', 'Make inactive')
          : t('product.actions.markActive', 'Make active'),
        style: styles.toggleButton,
        onPress: () => handleToggleStatus(item.product_id, !item.is_active),
      },
      {
        key: 'delete',
        icon: 'delete',
        label: t('product.actions.delete', 'Delete'),
        style: styles.deleteButton,
        onPress: () => handleDeleteProduct(item.product_id),
      },
      {
        key: 'unshare',
        icon: 'share-off',
        label: t('product.actions.unshare', 'Stop sharing'),
        style: styles.unshareButton,
        onPress: () => handleUnshareProduct(item.product_id),
      },
    ];

    const width = actions.length * 80;

    return (
      <View style={[styles.rightActions, { width }]}>
        {actions.map(action => (
          <TouchableOpacity
            key={action.key}
            style={[styles.actionButton, action.style]}
            onPress={() => {
              closeSwipe(item.product_id);
              action.onPress();
            }}
            activeOpacity={0.7}
          >
            <IconButton icon={action.icon} iconColor="#fff" size={24} />
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderProduct = ({ item }) => {
    const warrantyStatus = getWarrantyStatus(item);
    const purchaseDate = new Date(item.purchase_date).toLocaleDateString();
    const sharedDate = new Date(item.shared_at).toLocaleDateString();
    const isOwner = item.user_id && user?.id && item.user_id === user.id;

    const card = (
      <TouchableOpacity
        onPress={() => navigation.navigate('ProductDetail', { productId: item.product_id })}
        activeOpacity={0.85}
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
          <View style={styles.sharedMeta}>
            <Text style={styles.sharedMetaText}>
              {t('family.sharedBy')}: {item.shared_by}
            </Text>
            <Text style={styles.sharedMetaText}>
              {t('family.sharedOn')}: {sharedDate}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
    if (!isOwner) {
      return card;
    }

    return (
      <ReanimatedSwipeable
        ref={(ref) => {
          if (ref) {
            swipeRefs.current.set(item.product_id, ref);
          } else {
            swipeRefs.current.delete(item.product_id);
          }
        }}
        renderRightActions={() => renderActionButtons(item)}
        rightThreshold={40}
        overshootRight={false}
      >
        {card}
      </ReanimatedSwipeable>
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
  },
  sharedMeta: {
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border || '#dddddd',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sharedMetaText: {
    color: theme.colors.textSecondary,
    marginBottom: 2
  },
  rightActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'ce'
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 120,
    paddingVertical: 16,
    paddingHorizontal: 8
  },
  toggleButton: {
    backgroundColor: '#ff9800'
  },
  deleteButton: {
    backgroundColor: '#d32f2f'
  },
  unshareButton: {
    backgroundColor: '#1976d2'
  },
  actionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center'
  }
});

