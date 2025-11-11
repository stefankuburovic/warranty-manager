import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, TouchableOpacity, Linking } from 'react-native';
import { Text, Button, Appbar, Card, Chip, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { productsApi } from '../api/products';
import { exportApi } from '../api/export';
import { familyApi } from '../api/family';
import { useAuth } from '../context/AuthContext';

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
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await productsApi.deleteProduct(productId);
              Alert.alert('Success', 'Product deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
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

  const purchaseDate = new Date(product.purchase_date).toLocaleDateString('sr-RS');
  const warrantyEndDate = new Date(product.warranty_end_date).toLocaleDateString('sr-RS');
  const warrantyStatus = product.warranty_status;

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
              Warranty Status
            </Text>
            <View style={styles.statusContainer}>
              {warrantyStatus.is_expired ? (
                <Chip
                  mode="flat"
                  style={[styles.statusChip, { backgroundColor: theme.colors.error + '20' }]}
                  textStyle={{ color: theme.colors.error }}
                >
                  {t('product.expired')}
                </Chip>
              ) : warrantyStatus.expires_soon ? (
                <Chip
                  mode="flat"
                  style={[styles.statusChip, { backgroundColor: theme.colors.warning + '20' }]}
                  textStyle={{ color: theme.colors.warning }}
                >
                  {t('product.expiresIn', { days: warrantyStatus.days_remaining })}
                </Chip>
              ) : (
                <Chip
                  mode="flat"
                  style={[styles.statusChip, { backgroundColor: theme.colors.success + '20' }]}
                  textStyle={{ color: theme.colors.success }}
                >
                  {t('product.active')} ({t('product.daysLeft', { count: warrantyStatus.days_remaining })})
                </Chip>
              )}
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
              Product Details
            </Text>
            
            {product.brand && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Brand:</Text>
                <Text style={styles.detailValue}>{product.brand}</Text>
              </View>
            )}

            {product.model_number && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Model:</Text>
                <Text style={styles.detailValue}>{product.model_number}</Text>
              </View>
            )}

            {product.serial_number && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Serial:</Text>
                <Text style={styles.detailValue}>{product.serial_number}</Text>
              </View>
            )}

            {product.Category && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>{product.Category.category_name}</Text>
              </View>
            )}

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purchase Date:</Text>
              <Text style={styles.detailValue}>{purchaseDate}</Text>
            </View>

            {product.purchase_price && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Purchase Price:</Text>
                <Text style={styles.detailValue}>
                  {product.purchase_price} {product.currency}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Warranty Duration:</Text>
              <Text style={styles.detailValue}>
                {product.warranty_duration_months} months
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Store Information Card */}
        {product.Store && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Store Information
              </Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Store:</Text>
                <Text style={styles.detailValue}>{product.Store.store_name}</Text>
              </View>

              {product.Store.store_chain && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Chain:</Text>
                  <Text style={styles.detailValue}>{product.Store.store_chain}</Text>
                </View>
              )}

              {product.Store.city && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>City:</Text>
                  <Text style={styles.detailValue}>{product.Store.city}</Text>
                </View>
              )}

              {product.Store.phone && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
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
                  Documents ({product.Documents.length})
                </Text>
                <Button 
                  mode="text" 
                  onPress={() => navigation.navigate('Documents', { 
                    productId: product.product_id,
                    productName: product.product_name 
                  })}
                >
                  Manage
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
                      <Chip style={styles.primaryChip} compact textStyle={styles.primaryChipText}>Primary</Chip>
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
                  View All {product.Documents.length} Documents
                </Button>
              )}
            </Card.Content>
          </Card>
        )}

        {product.notes && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Notes
              </Text>
              <Text variant="bodyMedium" style={styles.notesText}>{product.notes}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Service Center Finder */}
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
