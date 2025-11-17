import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, TouchableOpacity, Linking } from 'react-native';
import { Text, Button, Appbar, Card, Chip, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { productsApi } from '../api/products';
import { exportApi } from '../api/export';
import { familyApi } from '../api/family';
import { useAuth } from '../context/AuthContext';
import { getCurrentLanguage } from '../i18n';

export default function ProductDetailScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  // Reload product when screen comes into focus (e.g., after editing)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProduct();
    });
    return unsubscribe;
  }, [navigation]);

  const loadProduct = async () => {
    try {
      setIsLoading(true);
      const data = await productsApi.getProduct(productId);
      setProduct(data.product);
      setIsShared(data.product.is_shared || false);
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert(t('common.error'), t('product.loadFailed') || 'Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareWithFamily = async () => {
    try {
      setIsSharing(true);
      if (isShared) {
        await familyApi.unshareProduct(productId);
        Alert.alert(t('common.success'), t('family.productUnshared'));
        setIsShared(false);
      } else {
        await familyApi.shareProduct(productId);
        Alert.alert(t('common.success'), t('family.productShared'));
        setIsShared(true);
      }
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.error || t('family.shareFailed'));
    } finally {
      setIsSharing(false);
    }
  };

  const handleDelete = () => {
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
              Alert.alert(t('common.success'), t('product.productDeleted'));
              // Navigate back and trigger refresh
              navigation.navigate('Home', { refresh: true });
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert(t('common.error'), t('product.deleteFailed'));
            }
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('EditProduct', { productId, product });
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      Alert.alert(
        t('export.exportProduct'),
        t('export.exportConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel', onPress: () => setIsExporting(false) },
          {
            text: t('export.export'),
            onPress: async () => {
              try {
                const arrayBuffer = await exportApi.exportProduct(productId);
                const filename = `warranty-${product.product_name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
                
                await exportApi.downloadAndSharePDF(arrayBuffer, filename);
                
                Alert.alert(t('common.success'), t('export.exportSuccess'));
              } catch (error) {
                console.error('Export error:', error);
                Alert.alert(t('common.error'), t('export.exportFailed'));
              } finally {
                setIsExporting(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
    }
  };

  const styles = createStyles(theme);

  if (isLoading || !product) {
    return (
      <View style={styles.container}>
        <Appbar.Header style={styles.appBar}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={t('product.title')} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  // Format dates based on user's language preference
  const currentLang = getCurrentLanguage();
  const dateLocale = currentLang.startsWith('sr') ? 'sr-RS' : 'en-US';
  const purchaseDate = new Date(product.purchase_date).toLocaleDateString(dateLocale);
  const warrantyEndDate = new Date(product.warranty_end_date).toLocaleDateString(dateLocale);
  const warrantyStatus = product.warranty_status;

  const getStatusChipInfo = () => {
    const successColor = theme.colors.success || '#4caf50';
    const warningColor = theme.colors.warning || '#ff9800';
    const errorColor = theme.colors.error || '#f44336';
    const inactiveColor = theme.colors.textSecondary || '#757575';
    const applyAlpha = (color) =>
      typeof color === 'string' && color.startsWith('#') ? `${color}20` : color;

    if (product.is_active === false) {
      return {
        text: t('product.status.inactive', 'Inactive'),
        color: inactiveColor,
        background: applyAlpha(inactiveColor) || '#eeeeee',
      };
    }

    if (warrantyStatus?.is_expired) {
      return {
        text: t('product.status.expired', 'Expired'),
        color: errorColor,
        background: applyAlpha(errorColor),
      };
    }

    if (warrantyStatus?.expires_soon) {
      const label =
        warrantyStatus.days_remaining != null
          ? t('product.status.daysLeft', { count: warrantyStatus.days_remaining })
          : t('product.status.expiringSoon', 'Expiring Soon');
      return {
        text: label,
        color: warningColor,
        background: applyAlpha(warningColor),
      };
    }

    const daysText =
      warrantyStatus?.days_remaining != null
        ? ` (${t('product.status.daysLeft', { count: warrantyStatus.days_remaining })})`
        : '';

    return {
      text: `${t('product.status.active', 'Active')}${daysText}`,
      color: successColor,
      background: applyAlpha(successColor),
    };
  };

  const statusChipInfo = getStatusChipInfo();

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={product.product_name} />
        {product.user_id === user.id && (
          <Appbar.Action 
            icon={isShared ? "account-multiple-check" : "account-multiple-plus"} 
            onPress={handleShareWithFamily}
            disabled={isSharing}
          />
        )}
        <Appbar.Action icon="file-pdf-box" onPress={handleExport} disabled={isExporting} />
        <Appbar.Action icon="pencil" onPress={handleEdit} />
        <Appbar.Action icon="delete" onPress={handleDelete} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Warranty Status Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {t('product.warrantyStatus')}
            </Text>
            <View style={styles.statusContainer}>
              <Chip
                mode="flat"
                style={[styles.statusChip, { backgroundColor: statusChipInfo.background }]}
                textStyle={{ color: statusChipInfo.color }}
              >
                {statusChipInfo.text}
              </Chip>
            </View>
            <Text variant="bodyMedium" style={styles.dateText}>
              {t('product.warrantyExpires')}: {warrantyEndDate}
            </Text>
          </Card.Content>
        </Card>

        {/* Product Details Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {t('product.productDetails')}
            </Text>
            
            {product.brand && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('product.brand')}:</Text>
                <Text style={styles.detailValue}>{product.brand}</Text>
              </View>
            )}

            {product.model_number && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('product.modelNumber')}:</Text>
                <Text style={styles.detailValue}>{product.model_number}</Text>
              </View>
            )}

            {product.serial_number && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('product.serialNumber')}:</Text>
                <Text style={styles.detailValue}>{product.serial_number}</Text>
              </View>
            )}

            {product.Category && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('product.category')}:</Text>
                <Text style={styles.detailValue}>{product.Category.category_name}</Text>
              </View>
            )}

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('product.purchaseDate')}:</Text>
              <Text style={styles.detailValue}>{purchaseDate}</Text>
            </View>

            {product.purchase_price && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('product.purchasePrice')}:</Text>
                <Text style={styles.detailValue}>
                  {product.purchase_price} {product.currency}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('product.warrantyDuration')}:</Text>
              <Text style={styles.detailValue}>
                {product.warranty_duration_months} {t('product.months')}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Store Information Card */}
        {product.Store && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {t('product.storeInformation')}
              </Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('product.store')}:</Text>
                <Text style={styles.detailValue}>{product.Store.store_name}</Text>
              </View>

              {product.Store.store_chain && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('store.storeChain')}:</Text>
                  <Text style={styles.detailValue}>{product.Store.store_chain}</Text>
                </View>
              )}

              {product.Store.city && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('store.city')}:</Text>
                  <Text style={styles.detailValue}>{product.Store.city}</Text>
                </View>
              )}

              {product.Store.phone && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('store.phone')}:</Text>
                  <Text style={styles.detailValue}>{product.Store.phone}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Documents Card */}
        {product.Documents && product.Documents.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeaderRow}>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  {t('document.documents')} ({product.Documents.length})
                </Text>
                <Button 
                  mode="text" 
                  onPress={() => navigation.navigate('Documents', { 
                    productId: product.product_id,
                    productName: product.product_name 
                  })}
                >
                  {t('document.manage')}
                </Button>
              </View>
              
              {product.Documents.slice(0, 3).map((doc) => (
                <TouchableOpacity
                  key={doc.document_id}
                  style={styles.documentItem}
                  onPress={() => Linking.openURL(doc.cloud_storage_url)}
                >
                  {doc.thumbnail_url ? (
                    <Image 
                      source={{ uri: doc.thumbnail_url }} 
                      style={styles.thumbnail}
                    />
                  ) : (
                    <View style={styles.thumbnailPlaceholder}>
                      <Text style={styles.pdfIcon}>📄</Text>
                    </View>
                  )}
                  <View style={styles.documentInfo}>
                    <Text variant="bodyMedium" numberOfLines={1} style={styles.documentName}>
                      {doc.file_name}
                    </Text>
                    <Text variant="bodySmall" style={styles.documentType}>
                      {doc.document_type}
                    </Text>
                    {doc.is_primary && (
                      <Chip style={styles.primaryChip} compact textStyle={styles.primaryChipText}>
                        {t('document.primary')}
                      </Chip>
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              {product.Documents.length > 3 && (
                <Button 
                  mode="outlined" 
                  onPress={() => navigation.navigate('Documents', { 
                    productId: product.product_id,
                    productName: product.product_name 
                  })}
                  style={styles.viewAllButton}
                >
                  {t('document.viewAllDocuments', { count: product.Documents.length })}
                </Button>
              )}
            </Card.Content>
          </Card>
        )}

        {product.notes && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {t('product.notes')}
              </Text>
              <Text variant="bodyMedium" style={styles.notesText}>{product.notes}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Service Center Finder - Only show for regular stores, not custom stores */}
        {product.Store && product.Store.type !== 'custom' && (
          <Card style={styles.card}>
            <Card.Content>
              <Button
                mode="outlined"
                icon="wrench"
                onPress={() => navigation.navigate('ServiceCenters', { productId: product.product_id })}
                style={styles.actionButton}
              >
                {t('location.findServiceCenters') || 'Find Service Centers'}
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Export Button */}
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="outlined"
              icon="file-pdf-box"
              onPress={handleExport}
              loading={isExporting}
              disabled={isExporting}
            >
              {t('export.exportAsPDF')}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  appBar: {
    backgroundColor: theme.colors.appBar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: theme.colors.textSecondary
  },
  content: {
    flex: 1,
    padding: 16
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: theme.colors.card
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: theme.colors.text
  },
  statusContainer: {
    marginBottom: 8
  },
  statusChip: {
    alignSelf: 'flex-start'
  },
  dateText: {
    color: theme.colors.textSecondary,
    marginTop: 8
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    color: theme.colors.text
  },
  divider: {
    marginVertical: 12,
    backgroundColor: theme.colors.divider
  },
  documentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center'
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12
  },
  documentInfo: {
    flex: 1
  },
  documentName: {
    color: theme.colors.text
  },
  documentType: {
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 4
  },
  primaryChip: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.success + '20',
  },
  primaryChipText: {
    color: theme.colors.success
  },
  notesText: {
    color: theme.colors.text
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  thumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  pdfIcon: {
    fontSize: 24
  },
  viewAllButton: {
    marginTop: 12
  }
});
