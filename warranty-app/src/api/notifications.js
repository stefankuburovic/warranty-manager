import apiClient from './client';

export const notificationsApi = {
  // Register FCM token
  async registerToken(fcmToken) {
    const response = await apiClient.post('/notifications/register-token', {
      fcm_token: fcmToken
    }, {
      timeout: 5000 // 5 second timeout for notification registration
    });
    return response.data;
  },

  // Remove FCM token
  async removeToken() {
    const response = await apiClient.post('/notifications/remove-token');
    return response.data;
  },

  // Toggle notifications
  async toggleNotifications(enabled) {
    const response = await apiClient.post('/notifications/toggle', { enabled });
    return response.data;
  },

  // Get settings
  async getSettings() {
    const response = await apiClient.get('/notifications/settings');
    return response.data;
  },

  // Get notification history
  async getHistory(params = {}) {
    const response = await apiClient.get('/notifications/history', { params });
    return response.data;
  },

  // Send test notification (dev)
  async sendTest() {
    const response = await apiClient.post('/notifications/test');
    return response.data;
  },

  // Advanced Notifications v1.7.0 - New endpoints
  // Get preferences
  async getPreferences() {
    const response = await apiClient.get('/notifications/preferences');
    return response.data;
  },

  // Update preferences
  async updatePreferences(preferences) {
    const response = await apiClient.put('/notifications/preferences', preferences);
    return response.data;
  },

  // Snooze notification
  async snoozeNotification(productId, hours) {
    const response = await apiClient.post('/notifications/snooze', {
      product_id: productId,
      hours: hours
    });
    return response.data;
  },

  // Test notification channels
  async testChannels(channels = 'all') {
    const response = await apiClient.post('/notifications/test-channels', {
      channels: channels
    });
    return response.data;
  }
};

