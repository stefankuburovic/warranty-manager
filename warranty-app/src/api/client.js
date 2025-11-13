import axios from 'axios';
import { Alert } from 'react-native';
import { API_URL, getAPIURL } from '../constants/config';
import { storage } from '../utils/storage';
import i18n from '../i18n';

// Store reference to navigation for redirecting on auth errors
let navigationRef = null;
export const setNavigationRef = (ref) => {
  navigationRef = ref;
};

// Helper to navigate to login screen
const navigateToLogin = () => {
  if (navigationRef?.current) {
    try {
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error navigating to login:', error);
    }
  }
};

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
  console.log('✅ API URL initialized:', url);
}).catch((error) => {
  // Keep default if error
  console.warn('⚠️ Could not load dynamic API URL, using default:', API_URL);
  console.warn('Error:', error.message);
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request details in development
    if (__DEV__) {
      const url = config.baseURL || apiClient.defaults.baseURL || API_URL;
      console.log(`🌐 ${config.method?.toUpperCase()} ${url}${config.url}`);
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
    console.error('❌ Request interceptor error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Enhanced network error handling
    if (!error.response) {
      // Network error (no response from server)
      const baseURL = error.config?.baseURL || apiClient.defaults.baseURL || API_URL;
      const url = `${baseURL}${error.config?.url || ''}`;
      
      console.error('❌ Network Error:', {
        message: error.message,
        url: url,
        method: error.config?.method?.toUpperCase(),
        code: error.code,
        baseURL: baseURL
      });
      
      // Provide more helpful error message
      if (error.message === 'Network Error' || error.code === 'NETWORK_ERROR') {
        error.message = `Network Error: Unable to connect to ${baseURL}. Please check:\n1. Backend server is running\n2. IP address is correct\n3. Device and server are on the same network`;
      }
    } else {
      // Server responded with error status
      console.error(`❌ API Error ${error.response.status}:`, {
        url: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
        status: error.response.status,
        data: error.response.data
      });
    }

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
        
        // Show user-friendly error message (only in production, dev shows Expo banner)
        if (!__DEV__) {
          Alert.alert(
            i18n.t('auth.sessionExpired') || 'Session Expired',
            i18n.t('auth.sessionExpiredMessage') || 'Your session has expired. Please sign in again.',
            [
              {
                text: i18n.t('common.ok') || 'OK',
                onPress: navigateToLogin
              }
            ],
            { cancelable: false }
          );
          // Navigate after a short delay to ensure Alert is shown
          setTimeout(navigateToLogin, 100);
        } else {
          // In development, log the error (Expo banner will show)
          console.error('Token refresh failed:', refreshError);
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

