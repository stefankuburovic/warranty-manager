import apiClient from './client';

export const locationApi = {
  // Get stores with locations
  getStoresWithLocations: async (userLat, userLon, radius) => {
    const params = { userLat, userLon, radius };
    const response = await apiClient.get('/location/stores', { params });
    return response.data;
  },

  // Get service centers
  getServiceCenters: async (userLat, userLon, filters = {}) => {
    const params = { userLat, userLon, ...filters };
    const response = await apiClient.get('/location/service-centers', { params });
    return response.data;
  },

  // Get service centers for product
  getServiceCentersForProduct: async (productId, userLat, userLon, radius) => {
    const params = { userLat, userLon, radius };
    const response = await apiClient.get(`/location/service-centers/product/${productId}`, { params });
    return response.data;
  },

  // Geocode address
  geocodeAddress: async (address) => {
    const response = await apiClient.post('/location/geocode', { address });
    return response.data;
  },

  // Reverse geocode
  reverseGeocode: async (latitude, longitude) => {
    const response = await apiClient.get('/location/reverse-geocode', {
      params: { latitude, longitude }
    });
    return response.data;
  },

  // Get location analytics
  getLocationAnalytics: async () => {
    const response = await apiClient.get('/location/analytics');
    return response.data;
  }
};

