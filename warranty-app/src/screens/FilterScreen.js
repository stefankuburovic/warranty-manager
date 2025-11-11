import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Text, Button, Card, Chip, Divider, RadioButton, TextInput, Appbar
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { categoriesApi } from '../api/categories';
import { storesApi } from '../api/stores';
import Autocomplete from '../components/Autocomplete';

export default function FilterScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { currentFilters = {}, onApplyFilters } = route.params || {};

  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(currentFilters.categories || []);
  const [selectedStores, setSelectedStores] = useState(currentFilters.stores || []);
  const [status, setStatus] = useState(currentFilters.status || '');
  const [priceMin, setPriceMin] = useState(currentFilters.priceRange?.min?.toString() || '');
  const [priceMax, setPriceMax] = useState(currentFilters.priceRange?.max?.toString() || '');
  const [purchaseDateStart, setPurchaseDateStart] = useState(currentFilters.purchaseDateRange?.start || '');
  const [purchaseDateEnd, setPurchaseDateEnd] = useState(currentFilters.purchaseDateRange?.end || '');
  const [warrantyDateStart, setWarrantyDateStart] = useState(currentFilters.warrantyDateRange?.start || '');
  const [warrantyDateEnd, setWarrantyDateEnd] = useState(currentFilters.warrantyDateRange?.end || '');

  useEffect(() => {
    loadCategories();
    loadStores();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getCategories();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStores = async () => {
    try {
      const data = await storesApi.getStores();
      setStores(data.stores || []);
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const toggleCategory = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const toggleStore = (storeId) => {
    if (selectedStores.includes(storeId)) {
      setSelectedStores(selectedStores.filter(id => id !== storeId));
    } else {
      setSelectedStores([...selectedStores, storeId]);
    }
  };

  const applyFilters = () => {
    const filters = {};

    if (selectedCategories.length > 0) {
      filters.categories = selectedCategories;
    }

    if (selectedStores.length > 0) {
      filters.stores = selectedStores;
    }

    if (status) {
      filters.status = status;
    }

    if (priceMin || priceMax) {
      filters.priceRange = {
        min: parseFloat(priceMin) || 0,
        max: parseFloat(priceMax) || 999999
      };
    }

    if (purchaseDateStart || purchaseDateEnd) {
      filters.purchaseDateRange = {
        start: purchaseDateStart || new Date(0).toISOString().split('T')[0],
        end: purchaseDateEnd || new Date().toISOString().split('T')[0]
      };
    }

    if (warrantyDateStart || warrantyDateEnd) {
      filters.warrantyDateRange = {
        start: warrantyDateStart || new Date(0).toISOString().split('T')[0],
        end: warrantyDateEnd || new Date().toISOString().split('T')[0]
      };
    }

    if (onApplyFilters) {
      onApplyFilters(filters);
    }
    navigation.goBack();
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedStores([]);
    setStatus('');
    setPriceMin('');
    setPriceMax('');
    setPurchaseDateStart('');
    setPurchaseDateEnd('');
    setWarrantyDateStart('');
    setWarrantyDateEnd('');
  };

  const getCategoryTranslation = (categoryName) => {
    return t(`categories.${categoryName}`, { defaultValue: categoryName });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    scrollView: {
      flex: 1
    },
    content: {
      padding: 16
    },
    section: {
      marginBottom: 24
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
      color: theme.colors.text
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
    },
    chip: {
      marginRight: 8,
      marginBottom: 8
    },
    selectedChip: {
      backgroundColor: theme.colors.primary
    },
    radioGroup: {
      marginTop: 8
    },
    radioItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12
    },
    input: {
      flex: 1
    },
    dateInput: {
      flex: 1
    },
    buttonContainer: {
      padding: 16,
      backgroundColor: theme.colors.surface,
      elevation: 8
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12
    },
    button: {
      flex: 1
    }
  });

  return (
    <View style={styles.container}>
      <Appbar.Header style={{ backgroundColor: theme.colors.appBar }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('search.filter.title')} />
      </Appbar.Header>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('search.filter.categories')}</Text>
          <View style={styles.chipContainer}>
            {categories.map(category => (
              <Chip
                key={category.category_id}
                selected={selectedCategories.includes(category.category_id)}
                onPress={() => toggleCategory(category.category_id)}
                style={[
                  styles.chip,
                  selectedCategories.includes(category.category_id) && styles.selectedChip
                ]}
              >
                {getCategoryTranslation(category.category_name)}
              </Chip>
            ))}
          </View>
        </View>

        <Divider />

        {/* Stores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('search.filter.stores')}</Text>
          <View style={styles.chipContainer}>
            {stores.map(store => (
              <Chip
                key={store.store_id}
                selected={selectedStores.includes(store.store_id)}
                onPress={() => toggleStore(store.store_id)}
                style={[
                  styles.chip,
                  selectedStores.includes(store.store_id) && styles.selectedChip
                ]}
              >
                {store.store_name}
              </Chip>
            ))}
          </View>
        </View>

        <Divider />

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('search.filter.status')}</Text>
          <View style={styles.radioGroup}>
            <View style={styles.radioItem}>
              <RadioButton
                value="active"
                status={status === 'active' ? 'checked' : 'unchecked'}
                onPress={() => setStatus(status === 'active' ? '' : 'active')}
              />
              <Text onPress={() => setStatus(status === 'active' ? '' : 'active')} style={{ color: theme.colors.text }}>
                {t('search.status.active')}
              </Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton
                value="expiring"
                status={status === 'expiring' ? 'checked' : 'unchecked'}
                onPress={() => setStatus(status === 'expiring' ? '' : 'expiring')}
              />
              <Text onPress={() => setStatus(status === 'expiring' ? '' : 'expiring')} style={{ color: theme.colors.text }}>
                {t('search.status.expiring')}
              </Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton
                value="expired"
                status={status === 'expired' ? 'checked' : 'unchecked'}
                onPress={() => setStatus(status === 'expired' ? '' : 'expired')}
              />
              <Text onPress={() => setStatus(status === 'expired' ? '' : 'expired')} style={{ color: theme.colors.text }}>
                {t('search.status.expired')}
              </Text>
            </View>
          </View>
        </View>

        <Divider />

        {/* Price Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('search.filter.priceRange')}</Text>
          <View style={styles.inputRow}>
            <TextInput
              label={t('search.filter.minPrice')}
              value={priceMin}
              onChangeText={setPriceMin}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
            <Text style={{ color: theme.colors.text }}>-</Text>
            <TextInput
              label={t('search.filter.maxPrice')}
              value={priceMax}
              onChangeText={setPriceMax}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
          </View>
        </View>

        <Divider />

        {/* Purchase Date Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('search.filter.purchaseDateRange')}</Text>
          <View style={styles.inputRow}>
            <TextInput
              label={t('search.filter.startDate')}
              value={purchaseDateStart}
              onChangeText={setPurchaseDateStart}
              placeholder="YYYY-MM-DD"
              mode="outlined"
              style={styles.dateInput}
            />
            <Text style={{ color: theme.colors.text }}>-</Text>
            <TextInput
              label={t('search.filter.endDate')}
              value={purchaseDateEnd}
              onChangeText={setPurchaseDateEnd}
              placeholder="YYYY-MM-DD"
              mode="outlined"
              style={styles.dateInput}
            />
          </View>
        </View>

        <Divider />

        {/* Warranty Date Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('search.filter.warrantyDateRange')}</Text>
          <View style={styles.inputRow}>
            <TextInput
              label={t('search.filter.startDate')}
              value={warrantyDateStart}
              onChangeText={setWarrantyDateStart}
              placeholder="YYYY-MM-DD"
              mode="outlined"
              style={styles.dateInput}
            />
            <Text style={{ color: theme.colors.text }}>-</Text>
            <TextInput
              label={t('search.filter.endDate')}
              value={warrantyDateEnd}
              onChangeText={setWarrantyDateEnd}
              placeholder="YYYY-MM-DD"
              mode="outlined"
              style={styles.dateInput}
            />
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <Button
            mode="outlined"
            onPress={clearFilters}
            style={styles.button}
          >
            {t('search.filter.clear')}
          </Button>
          <Button
            mode="contained"
            onPress={applyFilters}
            style={styles.button}
          >
            {t('search.filter.apply')}
          </Button>
        </View>
      </View>
    </View>
  );
}

