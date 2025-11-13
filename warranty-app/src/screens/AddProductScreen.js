import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { TextInput, Button, Text, Appbar, IconButton, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { productsApi } from '../api/products';
import { documentsApi } from '../api/documents';
import { categoriesApi } from '../api/categories';
import { storesApi } from '../api/stores';
import StoreSelector from '../components/StoreSelector';
import CategorySelector from '../components/CategorySelector';
import { formatPriceInput, parsePrice } from '../utils/numberHelpers';

export default function AddProductScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  // Get OCR data from route params if available
  const ocrData = route.params?.ocrData;
  const receiptImage = route.params?.receiptImage;
  const scannedData = route.params?.scannedData;
  const warrantyData = route.params?.warrantyData;
  const barcodeParam = route.params?.barcode;

  const [productName, setProductName] = useState(
    scannedData?.product_name || ocrData?.product_name || warrantyData?.product_name || ''
  );
  const [brand, setBrand] = useState(scannedData?.brand || '');
  const [barcode, setBarcode] = useState(scannedData?.barcode || barcodeParam || '');
  const [purchaseDate, setPurchaseDate] = useState(
    warrantyData?.purchase_date || ocrData?.purchase_date || ''
  );
  const [price, setPrice] = useState(() => {
    // Format initial price if from OCR
    if (ocrData?.purchase_price) {
      return formatPriceInput(ocrData.purchase_price.toString());
    }
    return '';
  });
  const [warrantyMonths, setWarrantyMonths] = useState(
    warrantyData?.warranty_duration?.toString() || '12'
  );
  const [documents, setDocuments] = useState(receiptImage ? [{ uri: receiptImage }] : []);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [categories, setCategories] = useState([]);

  // Handle store selection/creation from OCR data
  const handleOCRStoreSelection = async (storeName) => {
    if (!storeName) return;

    try {
      // Search for existing stores
      const storesData = await storesApi.getStores({ search: storeName });
      const stores = storesData.stores || [];
      
      // Try to find exact match (case-insensitive)
      const exactMatch = stores.find(
        store => store.store_name.toLowerCase() === storeName.toLowerCase()
      );
      
      if (exactMatch) {
        // Store exists, select it
        setSelectedStore(exactMatch.store_id);
      } else {
        // Store doesn't exist, create it as custom store
        try {
          const result = await storesApi.createStore({
            store_name: storeName.trim(),
            is_custom: true
          });
          
          if (result.store) {
            setSelectedStore(result.store.store_id);
          }
        } catch (error) {
          console.error('Error creating store from OCR:', error);
          // Don't show error to user, just log it
        }
      }
    } catch (error) {
      console.error('Error handling OCR store selection:', error);
      // Don't show error to user, just log it
    }
  };

  useEffect(() => {
    requestPermissions();
    loadCategories();
    
    // Set default date if not from OCR or warranty data
    if (!ocrData?.purchase_date && !warrantyData?.purchase_date) {
      const today = new Date().toISOString().split('T')[0];
      setPurchaseDate(today);
    }

    // Handle scanned data from barcode scanner
    if (scannedData && categories.length > 0) {
      // Set category if found
      if (scannedData.category) {
        const matchedCategory = categories.find(
          cat => cat.category_name === scannedData.category
        );
        if (matchedCategory) {
          setSelectedCategory(matchedCategory.category_id);
        }
      }
    }

    // Handle warranty data from QR code
    if (warrantyData) {
      // Warranty data is already set in state initialization
    }

    // Handle OCR data - store selection/creation
    if (ocrData?.store_name && !selectedStore) {
      handleOCRStoreSelection(ocrData.store_name);
    }

    // Show indicator if data was pre-filled
    if (ocrData || scannedData || warrantyData) {
      // Optionally show alert, but don't be too intrusive
    }

    // Set up navigation listener to refresh when coming back
    const unsubscribe = navigation.addListener('focus', () => {
      // Screen is focused, could refresh if needed
    });

    return unsubscribe;
  }, [navigation, route.params, categories.length]);

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getCategories();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('document.permissionNeeded') || 'Camera roll permission is required to upload receipts');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      addDocument({
        uri: result.assets[0].uri,
        fileName: result.assets[0].fileName || `photo_${Date.now()}.jpg`,
        type: result.assets[0].type || 'image/jpeg'
      });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      addDocument({
        uri: result.assets[0].uri,
        fileName: `receipt_${Date.now()}.jpg`,
        type: 'image/jpeg'
      });
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true
    });

    if (result.type === 'success') {
      addDocument({
        uri: result.uri,
        fileName: result.name,
        type: result.mimeType || 'application/pdf'
      });
    }
  };

  const addDocument = (file) => {
    setDocuments([...documents, file]);
  };

  const removeDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!productName.trim()) {
      Alert.alert(t('common.error'), t('product.productName') + ' ' + t('validation.required'));
      return;
    }

    if (!purchaseDate) {
      Alert.alert(t('common.error'), t('product.purchaseDate') + ' ' + t('validation.required'));
      return;
    }

    setIsLoading(true);
    
    try {
      // Step 1: Create product
      // Parse formatted price back to number
      const parsedPrice = price ? parseFloat(parsePrice(price)) : null;
      
      const productData = {
        product_name: productName.trim(),
        brand: brand.trim() || null,
        barcode: barcode.trim() || null,
        purchase_date: purchaseDate,
        purchase_price: parsedPrice && !isNaN(parsedPrice) ? parsedPrice : null,
        currency: 'RSD',
        warranty_duration_months: parseInt(warrantyMonths) || 12,
        category_id: selectedCategory,
        store_id: selectedStore
      };

      const result = await productsApi.createProduct(productData);
      const newProductId = result.product.product_id;

      // Step 2: Upload documents if any
      if (documents.length > 0) {
        setIsUploading(true);
        
        for (let i = 0; i < documents.length; i++) {
          try {
            await documentsApi.uploadDocument(
              newProductId,
              documents[i],
              'receipt',
              i === 0 // First document is primary
            );
          } catch (error) {
            console.error(`Error uploading document ${i + 1}:`, error);
            // Continue with other uploads even if one fails
          }
        }
      }

      Alert.alert(t('common.success'), t('product.productAdded'), [
        { 
          text: t('common.ok'), 
          onPress: () => {
            // Pass refresh flag to HomeScreen
            navigation.navigate('Home', { refresh: true });
          }
        }
      ]);
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert(t('common.error'), t('error.generic'));
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const renderDocument = (doc, index) => {
    const isPDF = doc.type === 'application/pdf';
    
    return (
      <View key={index} style={styles.documentItem}>
        {isPDF ? (
          <View style={styles.pdfPreview}>
            <Text style={styles.pdfIcon}>📄</Text>
          </View>
        ) : (
          <Image source={{ uri: doc.uri }} style={styles.documentPreview} />
        )}
        <View style={styles.documentInfo}>
          <Text style={styles.documentName} numberOfLines={1}>
            {doc.fileName}
          </Text>
          {index === 0 && (
            <Chip style={styles.primaryChip} compact>Primary</Chip>
          )}
        </View>
        <IconButton
          icon="close"
          size={20}
          onPress={() => removeDocument(index)}
        />
      </View>
    );
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('product.addProduct')} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <TextInput
            label={t('product.productName') + ' *'}
            value={productName}
            onChangeText={setProductName}
            mode="outlined"
            style={styles.input}
            textColor={theme.colors.text}
          />

          <TextInput
            label={t('product.brand')}
            value={brand}
            onChangeText={setBrand}
            mode="outlined"
            style={styles.input}
            textColor={theme.colors.text}
          />

          <TextInput
            label="Barcode (Optional)"
            value={barcode}
            onChangeText={setBarcode}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            textColor={theme.colors.text}
            right={
              <TextInput.Icon
                icon="barcode-scan"
                onPress={() => navigation.navigate('BarcodeScanner')}
              />
            }
          />

          <CategorySelector
            value={selectedCategory}
            onSelect={setSelectedCategory}
            style={styles.categorySelector}
          />

          <StoreSelector
            value={selectedStore}
            onSelect={setSelectedStore}
            style={styles.storeSelector}
          />

          <TextInput
            label={t('product.purchaseDate') + ' (YYYY-MM-DD) *'}
            value={purchaseDate}
            onChangeText={setPurchaseDate}
            mode="outlined"
            placeholder="2024-11-10"
            style={styles.input}
            textColor={theme.colors.text}
          />

          <TextInput
            label={t('product.price') + ' (RSD)'}
            value={price}
            onChangeText={(text) => {
              // Format as user types
              const formatted = formatPriceInput(text);
              setPrice(formatted);
            }}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            textColor={theme.colors.text}
            placeholder="10,000.00"
          />

          <TextInput
            label={t('product.warrantyDurationMonths')}
            value={warrantyMonths}
            onChangeText={setWarrantyMonths}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            textColor={theme.colors.text}
          />

          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('document.documents')} ({documents.length})
          </Text>

          {documents.map((doc, index) => renderDocument(doc, index))}

          <View style={styles.documentButtons}>
            <Button 
              mode="outlined" 
              onPress={takePhoto}
              icon="camera"
              style={styles.documentButton}
            >
              {t('document.camera')}
            </Button>
            <Button 
              mode="outlined" 
              onPress={pickImage}
              icon="image"
              style={styles.documentButton}
            >
              {t('document.gallery')}
            </Button>
            <Button 
              mode="outlined" 
              onPress={pickDocument}
              icon="file"
              style={styles.documentButton}
            >
              {t('document.pdf')}
            </Button>
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading || isUploading}
            disabled={isLoading || isUploading}
            style={styles.submitButton}
          >
            {isUploading ? t('common.loading') : t('product.addProduct')}
          </Button>
        </View>
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
  scrollView: {
    flex: 1
  },
  form: {
    padding: 16
  },
  input: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface
  },
  categorySelector: {
    marginBottom: 16
  },
  storeSelector: {
    marginBottom: 16,
    zIndex: 1000,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 16,
    color: theme.colors.text
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: theme.colors.card,
    borderRadius: 8
  },
  documentPreview: {
    width: 60,
    height: 60,
    borderRadius: 8
  },
  pdfPreview: {
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
    fontSize: 30
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12
  },
  documentName: {
    fontSize: 14,
    marginBottom: 4,
    color: theme.colors.text
  },
  primaryChip: {
    alignSelf: 'flex-start',
    height: 32,
    backgroundColor: theme.colors.success + '20'
  },
  documentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  documentButton: {
    flex: 1,
    marginHorizontal: 4
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 8
  }
});
