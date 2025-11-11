import client from './client';

export const analyticsApi = {
  // Get comprehensive analytics
  getAnalytics: async (period = '6months') => {
    const response = await client.get(`/analytics?period=${period}`);
    return response.data;
  },

  // Get category-specific analytics
  getCategoryAnalytics: async (categoryId) => {
    const response = await client.get(`/analytics/category/${categoryId}`);
    return response.data;
  },

  // Get spending comparison
  getSpendingComparison: async (type = 'monthly') => {
    const response = await client.get(`/analytics/comparison?type=${type}`);
    return response.data;
  }
};

