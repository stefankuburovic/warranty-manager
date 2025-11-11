import apiClient from './client';

export const productsApi = {
  // Create product
  async createProduct(productData) {
    const response = await apiClient.post('/products', productData);
    return response.data;
  },

  // Get all products with filters
  async getProducts(params = {}) {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  // Get single product
  async getProduct(id) {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  // Update product
  async updateProduct(id, productData) {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
  },

  // Delete product
  async deleteProduct(id) {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  // Get expiring products
  async getExpiringProducts(days = 30) {
    const response = await apiClient.get('/products/expiring', {
      params: { days }
    });
    return response.data;
  },

  // Get expired products
  async getExpiredProducts() {
    const response = await apiClient.get('/products/expired');
    return response.data;
  },

  // Get statistics
  async getStats() {
    const response = await apiClient.get('/products/stats');
    return response.data;
  }
};
