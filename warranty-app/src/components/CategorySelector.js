import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { categoriesApi } from '../api/categories';
import Autocomplete from './Autocomplete';

export default function CategorySelector({ value, onSelect, style }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getCategories();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const getCategoryTranslation = (categoryName) => {
    return t(`categories.${categoryName}`, { defaultValue: categoryName });
  };

  return (
    <Autocomplete
      label={t('product.category')}
      value={value}
      options={categories}
      onSelect={onSelect}
      getOptionLabel={(category) => getCategoryTranslation(category.category_name)}
      getOptionValue={(category) => category.category_id}
      placeholder={t('product.category')}
      style={style}
    />
  );
}

