import apiClient from './client';

export const storesApi = {
  async getStores(params = {}) {
    const response = await apiClient.get('/stores', { params });
    return response.data;
  },

  async getStore(id) {
    const response = await apiClient.get(`/stores/${id}`);
    return response.data;
  },

  async createStore(storeData) {
    const response = await apiClient.post('/stores', storeData);
    return response.data;
  }
};

