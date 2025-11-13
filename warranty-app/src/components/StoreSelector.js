import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { TextInput, Text, Button, Portal, Dialog } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { storesApi } from '../api/stores';

export default function StoreSelector({ value, onSelect, style }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('existing'); // 'existing' or 'mine'
  const [searchQuery, setSearchQuery] = useState('');
  const [existingStores, setExistingStores] = useState([]);
  const [customStores, setCustomStores] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef(null);
  const [inputLayout, setInputLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    loadStores(''); // Load all stores initially
  }, []);

  // Track if modal was just opened to initialize search query
  const [isModalJustOpened, setIsModalJustOpened] = useState(false);
  const [hasInitializedSearch, setHasInitializedSearch] = useState(false);

  useEffect(() => {
    // Only set search query from value when modal opens for the first time
    if (showSuggestions && !isModalJustOpened) {
      setIsModalJustOpened(true);
      setHasInitializedSearch(false);
    } else if (!showSuggestions) {
      setIsModalJustOpened(false);
      setHasInitializedSearch(false);
      // Clear search when modal closes
      setSearchQuery('');
    }
  }, [showSuggestions]);

  useEffect(() => {
    // Initialize search query once when modal opens and stores are available
    if (showSuggestions && isModalJustOpened && !hasInitializedSearch) {
      if (value) {
        const allStores = [...existingStores, ...customStores];
        const selected = allStores.find(store => {
          const storeId = store.store_id;
          return storeId === value || storeId === String(value);
        });
        if (selected) {
          setSearchQuery(selected.store_name);
        }
      }
      setHasInitializedSearch(true);
    }
  }, [showSuggestions, isModalJustOpened, hasInitializedSearch, value, existingStores, customStores]);

  const loadStores = async (search = '') => {
    try {
      const data = await storesApi.getStores({ search });
      const stores = data.stores || [];
      
      // Separate existing stores and custom stores
      const existing = stores.filter(store => store.type === 'regular');
      const custom = stores.filter(store => store.type === 'custom');
      
      setExistingStores(existing);
      setCustomStores(custom);
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  useEffect(() => {
    // Reload stores when search query changes (only if modal is open)
    if (showSuggestions) {
      const timeoutId = setTimeout(() => {
        loadStores(searchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, showSuggestions]);

  const handleSelectStore = (store) => {
    const storeId = store.store_id;
    setShowSuggestions(false);
    setSearchQuery(''); // Clear search query when selecting
    onSelect(storeId);
  };

  const handleCreateStore = async (storeNameToCreate = null) => {
    const nameToUse = storeNameToCreate || newStoreName;
    if (!nameToUse?.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      const result = await storesApi.createStore({
        store_name: nameToUse.trim(),
        is_custom: true
      });
      
      await loadStores('');
      setShowCreateDialog(false);
      setNewStoreName('');
      setSearchQuery('');
      
      // Select the newly created store
      const newStore = result.store;
      handleSelectStore(newStore);
    } catch (error) {
      console.error('Error creating store:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const getDisplayValue = () => {
    if (value) {
      const allStores = [...existingStores, ...customStores];
      const selected = allStores.find(store => {
        const storeId = store.store_id;
        return storeId === value || storeId === String(value);
      });
      return selected ? selected.store_name : '';
    }
    return '';
  };

  const getCurrentStores = () => {
    if (activeTab === 'existing') {
      return existingStores.filter(store => 
        !searchQuery || store.store_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      return customStores.filter(store => 
        !searchQuery || store.store_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={[styles.container, style]}>
      <View
        ref={inputRef}
        onLayout={() => {
          inputRef.current?.measureInWindow((x, y, width, height) => {
            setInputLayout({ x, y, width, height });
          });
        }}
      >
        <TextInput
          label={t('store.selectStore')}
          value={getDisplayValue()}
          onChangeText={() => {
            // Don't allow typing directly - open modal instead
          }}
          onFocus={() => {
            inputRef.current?.measureInWindow((x, y, width, height) => {
              setInputLayout({ x, y, width, height });
            });
            setShowSuggestions(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setShowSuggestions(false);
            }, 200);
          }}
          mode="outlined"
          placeholder={t('store.selectStore')}
          style={styles.input}
          editable={false}
          right={
            <TextInput.Icon
              icon={showSuggestions ? 'chevron-up' : 'chevron-down'}
              onPress={() => {
                inputRef.current?.measureInWindow((x, y, width, height) => {
                  setInputLayout({ x, y, width, height });
                });
                setShowSuggestions(!showSuggestions);
              }}
            />
          }
        />
      </View>

      <Modal
        visible={showSuggestions}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowSuggestions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSuggestions(false)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.suggestionsContainer,
                {
                  top: inputLayout.y + inputLayout.height + 4,
                  left: inputLayout.x,
                  width: inputLayout.width,
                }
              ]}
              onStartShouldSetResponder={() => true}
            >
              {/* Search Input */}
              <View style={styles.searchContainer}>
                <TextInput
                  placeholder={activeTab === 'existing' ? t('store.searchStore') : t('store.searchMyStores')}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  mode="outlined"
                  style={styles.searchInput}
                  right={<TextInput.Icon icon="magnify" />}
                />
              </View>

              {/* Tabs */}
              <View style={styles.tabsContainer}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'existing' && styles.tabActive]}
                  onPress={() => setActiveTab('existing')}
                >
                  <Text style={[styles.tabText, activeTab === 'existing' && styles.tabTextActive]}>
                    {t('store.existing')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'mine' && styles.tabActive]}
                  onPress={() => setActiveTab('mine')}
                >
                  <Text style={[styles.tabText, activeTab === 'mine' && styles.tabTextActive]}>
                    {t('store.mine')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Store List */}
              <ScrollView
                style={styles.storesList}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {getCurrentStores().map((store) => (
                  <TouchableOpacity
                    key={store.store_id}
                    style={styles.storeItem}
                    onPress={() => handleSelectStore(store)}
                  >
                    <Text style={styles.storeText}>{store.store_name}</Text>
                  </TouchableOpacity>
                ))}
                {getCurrentStores().length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      {activeTab === 'existing' 
                        ? t('store.noExistingStores')
                        : t('store.noCustomStores')}
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Add New Button (only in Mine tab) */}
              {activeTab === 'mine' && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    // If there's text in search query, create store directly
                    if (searchQuery.trim()) {
                      handleCreateStore(searchQuery);
                      setShowSuggestions(false);
                    } else {
                      // Otherwise open dialog
                      setShowSuggestions(false);
                      setShowCreateDialog(true);
                    }
                  }}
                >
                  <Text style={styles.addButtonText}>{t('store.addNew')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Create Store Dialog */}
      <Portal>
        <Dialog
          visible={showCreateDialog}
          onDismiss={() => {
            setShowCreateDialog(false);
            setNewStoreName('');
          }}
          style={styles.dialog}
        >
          <Dialog.Title>{t('store.createNewStore')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={t('store.storeName') + ' *'}
              value={newStoreName}
              onChangeText={setNewStoreName}
              mode="outlined"
              placeholder={t('store.enterStoreName')}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setShowCreateDialog(false);
              setNewStoreName('');
            }}>
              {t('common.cancel')}
            </Button>
            <Button
              mode="contained"
              onPress={handleCreateStore}
              loading={isCreating}
              disabled={isCreating || !newStoreName.trim()}
            >
              {t('common.create')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1
  },
  input: {
    backgroundColor: theme.colors.surface
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  suggestionsContainer: {
    position: 'absolute',
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 400,
    elevation: 10,
    shadowColor: theme.colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider
  },
  searchInput: {
    backgroundColor: theme.colors.surface
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabActive: {
    borderBottomColor: theme.colors.primary
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.textSecondary || theme.colors.text
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '600'
  },
  storesList: {
    maxHeight: 250
  },
  storeItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider
  },
  storeText: {
    fontSize: 14,
    color: theme.colors.text
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary || theme.colors.text,
    textAlign: 'center'
  },
  addButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: theme.colors.primary + '15',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600'
  },
  dialog: {
    backgroundColor: theme.colors.surface
  },
  dialogInput: {
    backgroundColor: theme.colors.surface
  }
});
