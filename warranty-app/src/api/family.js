import apiClient from './client';

export const familyApi = {
  // Create family
  async createFamily(name) {
    const response = await apiClient.post('/family/create', { name });
    return response.data;
  },

  // Get family info
  async getFamily() {
    const response = await apiClient.get('/family');
    return response.data;
  },

  // Join family
  async joinFamily(inviteCode) {
    const response = await apiClient.post('/family/join', { invite_code: inviteCode });
    return response.data;
  },

  // Leave family
  async leaveFamily() {
    const response = await apiClient.post('/family/leave');
    return response.data;
  },

  // Delete family
  async deleteFamily() {
    const response = await apiClient.delete('/family');
    return response.data;
  },

  // Share product
  async shareProduct(productId) {
    const response = await apiClient.post(`/family/products/${productId}/share`);
    return response.data;
  },

  // Unshare product
  async unshareProduct(productId) {
    const response = await apiClient.delete(`/family/products/${productId}/unshare`);
    return response.data;
  },

  // Get shared products
  async getSharedProducts() {
    const response = await apiClient.get('/family/shared-products');
    return response.data;
  },

  // Remove member
  async removeMember(memberId) {
    const response = await apiClient.delete(`/family/members/${memberId}`);
    return response.data;
  }
};

