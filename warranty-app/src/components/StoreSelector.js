import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { storesApi } from '../api/stores';
import Autocomplete from './Autocomplete';

export default function StoreSelector({ value, onSelect, style }) {
  const { t } = useTranslation();
  const [stores, setStores] = useState([]);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const data = await storesApi.getStores();
      setStores(data.stores || []);
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const searchStores = async (query) => {
    try {
      const data = await storesApi.getStores({ search: query });
      setStores(data.stores || []);
    } catch (error) {
      console.error('Error searching stores:', error);
    }
  };

  const handleCreateStore = async (newStore) => {
    if (!newStore.store_name?.trim()) {
      throw new Error('Store name is required');
    }

    const result = await storesApi.createStore(newStore);
    await loadStores();
    return result.store;
  };

  const renderCreateForm = (newStore, setNewStore) => (
    <View>
      <TextInput
        label={t('store.storeName') + ' *'}
        value={newStore.store_name || ''}
        onChangeText={(text) => setNewStore({ ...newStore, store_name: text })}
        mode="outlined"
        style={{ marginBottom: 8 }}
      />
      <TextInput
        label={t('store.storeChain')}
        value={newStore.store_chain || ''}
        onChangeText={(text) => setNewStore({ ...newStore, store_chain: text })}
        mode="outlined"
        style={{ marginBottom: 8 }}
      />
      <TextInput
        label={t('store.city')}
        value={newStore.city || ''}
        onChangeText={(text) => setNewStore({ ...newStore, city: text })}
        mode="outlined"
        style={{ marginBottom: 8 }}
      />
      <TextInput
        label={t('store.address')}
        value={newStore.address || ''}
        onChangeText={(text) => setNewStore({ ...newStore, address: text })}
        mode="outlined"
        style={{ marginBottom: 8 }}
      />
      <TextInput
        label={t('store.phone')}
        value={newStore.phone || ''}
        onChangeText={(text) => setNewStore({ ...newStore, phone: text })}
        mode="outlined"
        keyboardType="phone-pad"
        style={{ marginBottom: 8 }}
      />
      <TextInput
        label={t('store.website')}
        value={newStore.website || ''}
        onChangeText={(text) => setNewStore({ ...newStore, website: text })}
        mode="outlined"
        keyboardType="url"
      />
    </View>
  );

  return (
    <Autocomplete
      label={t('store.selectStore')}
      value={value}
      options={stores}
      onSelect={onSelect}
      onSearch={searchStores}
      getOptionLabel={(store) => store.store_name}
      getOptionValue={(store) => store.store_id}
      placeholder={t('store.searchStore')}
      style={style}
      allowCreate={true}
      onCreate={handleCreateStore}
      createDialogTitle={t('store.createNewStore')}
      createFormFields={renderCreateForm}
    />
  );
}
