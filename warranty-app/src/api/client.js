import axios from 'axios';
import { API_URL, getAPIURL } from '../constants/config';
import { storage } from '../utils/storage';

// Create axios instance with default URL
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // Default timeout for regular requests
  headers: {
    'Content-Type': 'application/json'
  },
  maxContentLength: Infinity,
  maxBodyLength: Infinity
});

// Update baseURL with dynamic IP on initialization
getAPIURL().then(url => {
  apiClient.defaults.baseURL = url;
}).catch(() => {
  // Keep default if error
  console.warn('Could not load dynamic API URL, using default');
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Handle FormData properly for React Native
    if (config.data instanceof FormData) {
      // Remove Content-Type header - let the browser/React Native set it with boundary
      delete config.headers['Content-Type'];
      // Increase timeout for file uploads
      if (!config.timeout || config.timeout < 60000) {
        config.timeout = 60000; // 60 seconds for uploads
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storage.getRefreshToken();
        const apiUrl = await getAPIURL();
        const response = await axios.post(`${apiUrl}/auth/refresh`, {
          refresh_token: refreshToken
        });

        const { access_token, refresh_token } = response.data;
        await storage.setTokens(access_token, refresh_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        await storage.clearTokens();
        await storage.clearUser();
        // Trigger logout in your app
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

