import client from './client';

export const searchApi = {
  // Search products
  searchProducts: async (query, filters = {}, options = {}) => {
    const response = await client.post('/search', {
      query,
      filters,
      ...options
    });
    return response.data;
  },

  // Get search suggestions
  getSearchSuggestions: async (query) => {
    const response = await client.get(`/search/suggestions?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get search history
  getSearchHistory: async (limit = 20) => {
    const response = await client.get(`/search/history?limit=${limit}`);
    return response.data;
  },

  // Clear search history
  clearSearchHistory: async () => {
    const response = await client.delete('/search/history');
    return response.data;
  },

  // Save search
  saveSearch: async (searchName, searchQuery, filters, sortBy, isDefault = false) => {
    const response = await client.post('/search/saved', {
      searchName,
      searchQuery,
      filters,
      sortBy,
      isDefault
    });
    return response.data;
  },

  // Get saved searches
  getSavedSearches: async () => {
    const response = await client.get('/search/saved');
    return response.data;
  },

  // Update saved search
  updateSavedSearch: async (savedSearchId, updates) => {
    const response = await client.put(`/search/saved/${savedSearchId}`, updates);
    return response.data;
  },

  // Delete saved search
  deleteSavedSearch: async (savedSearchId) => {
    const response = await client.delete(`/search/saved/${savedSearchId}`);
    return response.data;
  },

  // Use saved search
  useSavedSearch: async (savedSearchId) => {
    const response = await client.post(`/search/saved/${savedSearchId}/use`);
    return response.data;
  },

  // Get popular searches
  getPopularSearches: async () => {
    const response = await client.get('/search/popular');
    return response.data;
  }
};

