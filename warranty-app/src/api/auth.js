import apiClient from './client';

export const authApi = {
  // Register new user
  async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  // Login with username/password
  async login(username, password) {
    const response = await apiClient.post('/auth/login', {
      username,
      password
    });
    return response.data;
  },

  // Google OAuth (existing)
  async loginWithGoogle(idToken) {
    const response = await apiClient.post('/auth/google', {
      id_token: idToken
    });
    return response.data;
  },

  // Forgot password
  async forgotPassword(email) {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  async resetPassword(token, newPassword) {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      new_password: newPassword
    });
    return response.data;
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    const response = await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response.data;
  },

  // Get profile (existing)
  async getProfile() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
};

