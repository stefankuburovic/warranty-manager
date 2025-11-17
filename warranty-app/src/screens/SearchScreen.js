import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Text, Searchbar, Chip, Card, IconButton, ActivityIndicator,
  Menu, Portal, Modal, Button, List, TextInput, Dialog, Appbar
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { searchApi } from '../api/search';
import { productsApi } from '../api/products';
import ProductCard from '../components/ProductCard';

const PAGE_SIZE = 20;

export default function SearchScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({});
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortBy, setSortBy] = useState('purchase_date_desc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSavedSearches, setShowSavedSearches] = useState(false);

  const searchTimeout = useRef(null);

  useEffect(() => {
    loadSavedSearches();
  }, []);

  useEffect(() => {
    // Auto-search when filters or sort change
    if (searchQuery.length > 0 || Object.keys(filters).length > 0) {
      performSearch(true);
    }
  }, [filters, sortBy]);

  const loadSavedSearches = async () => {
    try {
      const data = await searchApi.getSavedSearches();
      setSavedSearches(data.searches || []);
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  const performSearch = async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setCurrentPage(1);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const page = reset ? 1 : currentPage + 1;
      const results = await searchApi.searchProducts(
        searchQuery,
        filters,
        { sortBy, page, limit: PAGE_SIZE }
      );
      
      const newProducts = results.products || [];
      
      if (reset) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }
      
      setHasMore(results.hasMore !== false && newProducts.length === PAGE_SIZE);
      setCurrentPage(page);
    } catch (error) {
      console.error('Search error:', error);
      if (reset) {
        setProducts([]);
      }
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
      setShowSuggestions(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && !isLoading && (searchQuery.length > 0 || Object.keys(filters).length > 0)) {
      performSearch(false);
    }
  };

  const handleSearchChange = async (text) => {
    setSearchQuery(text);

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Get suggestions
    if (text.length >= 2) {
      try {
        const data = await searchApi.getSearchSuggestions(text);
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Suggestions error:', error);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    // Debounce search
    searchTimeout.current = setTimeout(() => {
      if (text.length > 0) {
        performSearch(true);
      } else {
        setProducts([]);
      }
    }, 500);
  };

  const handleSearchSubmit = () => {
    performSearch(true);
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
    performSearch(true);
  };

  const openFilters = () => {
    navigation.navigate('SearchFilters', {
      currentFilters: filters,
      onApplyFilters: (newFilters) => {
        setFilters(newFilters);
        updateActiveFilters(newFilters);
      }
    });
  };

  const updateActiveFilters = (newFilters) => {
    const active = [];

    if (newFilters.categories && newFilters.categories.length > 0) {
      active.push({
        key: 'categories',
        label: `${newFilters.categories.length} ${t('search.categories')}`,
        value: newFilters.categories
      });
    }

    if (newFilters.stores && newFilters.stores.length > 0) {
      active.push({
        key: 'stores',
        label: `${newFilters.stores.length} ${t('search.stores')}`,
        value: newFilters.stores
      });
    }

    if (newFilters.status) {
      active.push({
        key: 'status',
        label: `${t('search.filter.status')}: ${t(`search.status.${newFilters.status}`)}`,
        value: newFilters.status
      });
    }

    if (newFilters.priceRange) {
      active.push({
        key: 'priceRange',
        label: `${newFilters.priceRange.min} - ${newFilters.priceRange.max} RSD`,
        value: newFilters.priceRange
      });
    }

    setActiveFilters(active);
  };

  const removeFilter = (filterKey) => {
    const newFilters = { ...filters };
    delete newFilters[filterKey];
    setFilters(newFilters);
    updateActiveFilters(newFilters);
  };

  const clearAllFilters = () => {
    setFilters({});
    setActiveFilters([]);
    setSearchQuery('');
    setProducts([]);
  };

  const saveCurrentSearch = () => {
    setSaveSearchName('');
    setShowSaveDialog(true);
  };

  const handleSaveSearch = async () => {
    if (!saveSearchName.trim()) {
      return;
    }
    try {
      await searchApi.saveSearch(saveSearchName, searchQuery, filters, sortBy);
      setShowSaveDialog(false);
      setSaveSearchName('');
      loadSavedSearches();
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  const loadSavedSearch = async (search) => {
    try {
      await searchApi.useSavedSearch(search.saved_search_id);
      setSearchQuery(search.search_query || '');
      setFilters(search.filters || {});
      setSortBy(search.sort_by || 'purchase_date_desc');
      updateActiveFilters(search.filters || {});
      setShowSavedSearches(false);
      performSearch();
    } catch (error) {
      console.error('Error loading saved search:', error);
    }
  };

  const sortOptions = [
    { value: 'relevance', label: t('search.sort.relevance') },
    { value: 'name_asc', label: t('search.sort.nameAsc') },
    { value: 'name_desc', label: t('search.sort.nameDesc') },
    { value: 'price_asc', label: t('search.sort.priceAsc') },
    { value: 'price_desc', label: t('search.sort.priceDesc') },
    { value: 'purchase_date_asc', label: t('search.sort.oldestFirst') },
    { value: 'purchase_date_desc', label: t('search.sort.newestFirst') },
    { value: 'warranty_expiry_asc', label: t('search.sort.expiringSoonest') },
    { value: 'warranty_expiry_desc', label: t('search.sort.expiringLatest') }
  ];

  const handleToggleStatus = async (productId, newStatus) => {
    try {
      await productsApi.updateProduct(productId, { is_active: newStatus });
      // Update local state
      setProducts(products.map(p => 
        p.product_id === productId ? { ...p, is_active: newStatus } : p
      ));
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  const handleDelete = async (productId) => {
    try {
      await productsApi.deleteProduct(productId);
      // Remove from local state
      setProducts(products.filter(p => p.product_id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleExtend = (product) => {
    navigation.navigate('EditProduct', { productId: product.product_id, extendMode: true });
  };

  const renderProductItem = ({ item }) => (
    <ProductCard
      product={item}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.product_id })}
      onToggleStatus={handleToggleStatus}
      onDelete={handleDelete}
      onExtend={handleExtend}
    />
  );

  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: theme.colors.background 
    },
    searchContainer: { 
      backgroundColor: theme.colors.surface, 
      padding: 8, 
      elevation: 2 
    },
    searchBar: { 
      marginBottom: 8 
    },
    actionButtons: { 
      flexDirection: 'row', 
      justifyContent: 'space-around', 
      marginTop: 8 
    },
    suggestionsCard: { 
      margin: 8, 
      elevation: 4 
    },
    filtersContainer: { 
      padding: 8, 
      backgroundColor: theme.colors.surface 
    },
    filterChip: { 
      marginRight: 8 
    },
    clearChip: { 
      backgroundColor: theme.colors.error + '20' 
    },
    resultsCount: { 
      padding: 16, 
      fontWeight: 'bold',
      color: theme.colors.text
    },
    loadingContainer: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center' 
    },
    loadingText: { 
      marginTop: 16, 
      opacity: 0.7,
      color: theme.colors.textSecondary
    },
    listContainer: { 
      padding: 8 
    },
    emptyContainer: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: 32 
    },
    emptyText: { 
      textAlign: 'center', 
      opacity: 0.7, 
      marginTop: 8, 
      marginBottom: 24,
      color: theme.colors.textSecondary
    },
    clearButton: { 
      marginTop: 16 
    },
    modalContainer: { 
      backgroundColor: theme.colors.surface, 
      padding: 20, 
      margin: 20, 
      borderRadius: 8, 
      maxHeight: '80%' 
    },
    modalTitle: { 
      marginBottom: 16, 
      fontWeight: 'bold',
      color: theme.colors.text
    },
    savedSearchesList: { 
      maxHeight: 400 
    },
    noSavedText: { 
      textAlign: 'center', 
      opacity: 0.7, 
      paddingVertical: 32,
      color: theme.colors.textSecondary
    },
    loadingMore: {
      paddingVertical: 20,
      alignItems: 'center'
    }
  });

  return (
    <View style={styles.container}>
      <Appbar.Header style={{ backgroundColor: theme.colors.appBar }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('search.title')} />
      </Appbar.Header>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('search.placeholder')}
          onChangeText={handleSearchChange}
          value={searchQuery}
          onSubmitEditing={handleSearchSubmit}
          style={styles.searchBar}
          icon="magnify"
          clearIcon="close"
        />
        
        <View style={styles.actionButtons}>
          <IconButton
            icon="filter-variant"
            size={24}
            onPress={openFilters}
            mode={Object.keys(filters).length > 0 ? 'contained' : 'outlined'}
          />
          
          <Menu
            visible={showSortMenu}
            onDismiss={() => setShowSortMenu(false)}
            anchor={
              <IconButton
                icon="sort"
                size={24}
                onPress={() => setShowSortMenu(true)}
              />
            }
          >
            {sortOptions.map(option => (
              <Menu.Item
                key={option.value}
                onPress={() => {
                  setSortBy(option.value);
                  setShowSortMenu(false);
                }}
                title={option.label}
                leadingIcon={sortBy === option.value ? 'check' : undefined}
              />
            ))}
          </Menu>

          <IconButton
            icon="content-save"
            size={24}
            onPress={saveCurrentSearch}
          />

          <IconButton
            icon="bookmark-multiple"
            size={24}
            onPress={() => setShowSavedSearches(true)}
          />
        </View>
      </View>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card style={styles.suggestionsCard}>
          {suggestions.map((suggestion, index) => (
            <List.Item
              key={index}
              title={suggestion.text}
              description={suggestion.type === 'history' ? `${suggestion.count} results` : suggestion.brand}
              left={props => <List.Icon {...props} icon={suggestion.type === 'history' ? 'history' : 'magnify'} />}
              onPress={() => handleSelectSuggestion(suggestion)}
            />
          ))}
        </Card>
      )}

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {activeFilters.map(filter => (
              <Chip
                key={filter.key}
                onClose={() => removeFilter(filter.key)}
                style={styles.filterChip}
              >
                {filter.label}
              </Chip>
            ))}
            <Chip
              icon="close-circle"
              onPress={clearAllFilters}
              style={styles.clearChip}
            >
              {t('search.clearAll')}
            </Chip>
          </ScrollView>
        </View>
      )}

      {/* Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('search.searching')}</Text>
        </View>
      ) : products.length > 0 ? (
        <>
          <Text style={styles.resultsCount}>
            {products.length} {t('search.results', { count: products.length })}
          </Text>
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={item => item.product_id.toString()}
            contentContainerStyle={styles.listContainer}
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
        </>
      ) : searchQuery.length > 0 || Object.keys(filters).length > 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={{ color: theme.colors.text }}>
            {t('search.noResults')}
          </Text>
          <Text style={styles.emptyText}>
            {t('search.noResultsHint')}
          </Text>
          <Button
            mode="outlined"
            onPress={clearAllFilters}
            style={styles.clearButton}
          >
            {t('search.clearSearch')}
          </Button>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={{ color: theme.colors.text }}>
            {t('search.searchYourProducts')}
          </Text>
          <Text style={styles.emptyText}>
            {t('search.searchHint')}
          </Text>
        </View>
      )}

      {/* Save Search Dialog */}
      <Portal>
        <Dialog visible={showSaveDialog} onDismiss={() => setShowSaveDialog(false)}>
          <Dialog.Title>{t('search.saveSearch')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={t('search.searchName')}
              value={saveSearchName}
              onChangeText={setSaveSearchName}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSaveDialog(false)}>{t('common.cancel')}</Button>
            <Button onPress={handleSaveSearch}>{t('common.save')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Saved Searches Modal */}
      <Portal>
        <Modal
          visible={showSavedSearches}
          onDismiss={() => setShowSavedSearches(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {t('search.savedSearches')}
          </Text>
          
          {savedSearches.length > 0 ? (
            <ScrollView style={styles.savedSearchesList}>
              {savedSearches.map(search => (
                <List.Item
                  key={search.saved_search_id}
                  title={search.search_name}
                  description={search.search_query || t('search.filterBasedSearch')}
                  left={props => <List.Icon {...props} icon="bookmark" />}
                  right={props => search.is_default && <List.Icon {...props} icon="star" />}
                  onPress={() => loadSavedSearch(search)}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noSavedText}>{t('search.noSavedSearches')}</Text>
          )}

          <Button onPress={() => setShowSavedSearches(false)}>{t('common.close')}</Button>
        </Modal>
      </Portal>
    </View>
  );
}

