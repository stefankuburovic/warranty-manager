import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { TextInput, Button, Text, Appbar, Menu } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { productsApi } from '../api/products';
import { categoriesApi } from '../api/categories';
import { storesApi } from '../api/stores';
import { formatDate, getLocalizedDateFormat } from '../utils/dateHelpers';
import { formatPriceInput, parsePrice } from '../utils/numberHelpers';
import i18n from '../i18n';

export default function EditProductScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { productId, product: initialProduct } = route.params;
  
  const [productName, setProductName] = useState(initialProduct.product_name);
  const [brand, setBrand] = useState(initialProduct.brand || '');
  const [modelNumber, setModelNumber] = useState(initialProduct.model_number || '');
  const [serialNumber, setSerialNumber] = useState(initialProduct.serial_number || '');
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
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Convert YYYY-MM-DD to Date object
    if (initialProduct.purchase_date) {
      const [year, month, day] = initialProduct.purchase_date.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return new Date();
  });
  
  // Categories and stores
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialProduct.category_id);
  const [selectedStore, setSelectedStore] = useState(initialProduct.store_id);
  
  // Menu visibility
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [storeMenuVisible, setStoreMenuVisible] = useState(false);

  useEffect(() => {
    loadCategoriesAndStores();
  }, []);

  const loadCategoriesAndStores = async () => {
    try {
      const [categoriesData, storesData] = await Promise.all([
        categoriesApi.getCategories(),
        storesApi.getStores()
      ]);
      setCategories(categoriesData.categories || []);
      setStores(storesData.stores || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Format date for display (localized)
  const getDisplayDate = () => {
    if (!purchaseDate) return '';
    try {
      // Get localized format and convert dots to slashes for date-fns compatibility
      let dateFormat = getLocalizedDateFormat();
      // date-fns format: convert dd.MM.yyyy to dd/MM/yyyy (dots need to be escaped or use slashes)
      if (dateFormat.includes('.')) {
        dateFormat = dateFormat.replace(/\./g, '/');
      }
      return formatDate(purchaseDate, dateFormat);
    } catch (error) {
      console.error('Date formatting error:', error);
      // Fallback: use native locale formatting
      try {
        const date = new Date(purchaseDate + 'T00:00:00');
        const currentLang = i18n.language;
        if (currentLang.startsWith('sr')) {
          return date.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
        return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      } catch (fallbackError) {
        return purchaseDate; // Final fallback to raw date
      }
    }
  };

  // Handle date picker change
  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (event.type === 'set' && date) {
      setSelectedDate(date);
      // Convert Date to YYYY-MM-DD format
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setPurchaseDate(formattedDate);
      
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
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
      // Parse formatted price back to number
      const parsedPrice = price ? parseFloat(parsePrice(price)) : null;
      
      const productData = {
        product_name: productName.trim(),
        brand: brand.trim() || null,
        model_number: modelNumber.trim() || null,
        serial_number: serialNumber.trim() || null,
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

      <ScrollView style={styles.content}>
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

          <Menu
            visible={categoryMenuVisible}
            onDismiss={() => setCategoryMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => setCategoryMenuVisible(true)}>
                <TextInput
                  label={t('product.category')}
                  value={categories.find(c => c.category_id === selectedCategory)?.category_name || ''}
                  mode="outlined"
                  style={styles.input}
                  editable={false}
                  right={<TextInput.Icon icon="chevron-down" />}
                  textColor={theme.colors.text}
                />
              </TouchableOpacity>
            }
          >
            {categories.map((category) => (
              <Menu.Item
                key={category.category_id}
                onPress={() => {
                  setSelectedCategory(category.category_id);
                  setCategoryMenuVisible(false);
                }}
                title={category.category_name}
              />
            ))}
          </Menu>

          <Menu
            visible={storeMenuVisible}
            onDismiss={() => setStoreMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => setStoreMenuVisible(true)}>
                <TextInput
                  label={t('product.store')}
                  value={stores.find(s => s.store_id === selectedStore)?.store_name || ''}
                  mode="outlined"
                  style={styles.input}
                  editable={false}
                  right={<TextInput.Icon icon="chevron-down" />}
                  textColor={theme.colors.text}
                />
              </TouchableOpacity>
            }
          >
            {stores.map((store) => (
              <Menu.Item
                key={store.store_id}
                onPress={() => {
                  setSelectedStore(store.store_id);
                  setStoreMenuVisible(false);
                }}
                title={store.store_name}
              />
            ))}
          </Menu>

          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <TextInput
              label={t('product.purchaseDate') + ' *'}
              value={getDisplayDate()}
              mode="outlined"
              placeholder={t('product.purchaseDate')}
              style={styles.input}
              editable={false}
              right={<TextInput.Icon icon="calendar" />}
              textColor={theme.colors.text}
            />
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

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
  content: {
    flex: 1
  },
  form: {
    padding: 16
  },
  input: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 8
  }
});

