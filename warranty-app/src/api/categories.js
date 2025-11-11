import apiClient from './client';

export const categoriesApi = {
  async getCategories() {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  async getCategory(id) {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  }
};

