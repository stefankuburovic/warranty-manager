import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Appbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { productsApi } from '../api/products';
import StoreSelector from '../components/StoreSelector';
import CategorySelector from '../components/CategorySelector';
import { formatPriceInput, parsePrice } from '../utils/numberHelpers';

export default function EditProductScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { productId, product: initialProduct } = route.params;
  
  const [productName, setProductName] = useState(initialProduct.product_name);
  const [brand, setBrand] = useState(initialProduct.brand || '');
  const [modelNumber, setModelNumber] = useState(initialProduct.model_number || '');
  const [serialNumber, setSerialNumber] = useState(initialProduct.serial_number || '');
  const [barcode, setBarcode] = useState(initialProduct.barcode || '');
  const [purchaseDate, setPurchaseDate] = useState(initialProduct.purchase_date);
  const [price, setPrice] = useState(() => {
    // Format initial price for display
    if (initialProduct.purchase_price) {
      return formatPriceInput(initialProduct.purchase_price.toString());
    }
    return '';
  });
  const [warrantyMonths, setWarrantyMonths] = useState(initialProduct.warranty_duration_months?.toString() || '12');
  const [notes, setNotes] = useState(initialProduct.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  
  // Determine initial store value - could be regular store_id or custom store (from Store.store_id)
  const getInitialStoreId = () => {
    // Check if product has Store object with store_id (normalized format)
    if (initialProduct.Store?.store_id) {
      return initialProduct.Store.store_id; // Could be regular ID or "custom_123"
    }
    // Fallback to direct store_id
    if (initialProduct.store_id) {
      return initialProduct.store_id;
    }
    // Check for user_custom_store_id
    if (initialProduct.user_custom_store_id) {
      return `custom_${initialProduct.user_custom_store_id}`;
    }
    return null;
  };
  
  const [selectedCategory, setSelectedCategory] = useState(initialProduct.category_id);
  const [selectedStore, setSelectedStore] = useState(getInitialStoreId());

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
      // Parse formatted price back to number
      const parsedPrice = price ? parseFloat(parsePrice(price)) : null;
      
      const productData = {
        product_name: productName.trim(),
        brand: brand.trim() || null,
        model_number: modelNumber.trim() || null,
        serial_number: serialNumber.trim() || null,
        barcode: barcode.trim() || null,
        purchase_date: purchaseDate,
        purchase_price: parsedPrice && !isNaN(parsedPrice) ? parsedPrice : null,
        currency: 'RSD',
        warranty_duration_months: parseInt(warrantyMonths) || 12,
        category_id: selectedCategory,
        store_id: selectedStore,
        notes: notes.trim() || null
      };

      await productsApi.updateProduct(productId, productData);
      
      Alert.alert(t('common.success'), t('product.productUpdated'), [
        { 
          text: t('common.ok'), 
          onPress: () => navigation.goBack() 
        }
      ]);
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert(t('common.error'), t('error.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('product.editProduct')} />
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
          />

          <TextInput
            label={t('product.modelNumber')}
            value={modelNumber}
            onChangeText={setModelNumber}
            mode="outlined"
            style={styles.input}
            textColor={theme.colors.text}
          />

          <TextInput
            label={t('product.serialNumber')}
            value={serialNumber}
            onChangeText={setSerialNumber}
            mode="outlined"
            style={styles.input}
            textColor={theme.colors.text}
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

          <TextInput
            label={t('product.notes')}
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            textColor={theme.colors.text}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            style={styles.submitButton}
          >
            {t('product.editProduct')}
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
    zIndex: 1000
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 8
  }
});

