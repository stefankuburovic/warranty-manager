import React, { createContext, useState, useEffect, useContext } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Alert } from 'react-native';
import i18n from '../i18n';
import { authApi } from '../api/auth';
import { storage } from '../utils/storage';
import notificationService from '../services/notificationService';
import { notificationsApi } from '../api/notifications';
import { 
  GOOGLE_WEB_CLIENT_ID, 
  GOOGLE_IOS_CLIENT_ID, 
  GOOGLE_ANDROID_CLIENT_ID 
} from '../constants/config';

// Complete auth session on web
WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'warrantyapp'
  });

  // Debug: Log the redirect URI being used
  useEffect(() => {
    console.log('🔍 OAuth Redirect URI:', redirectUri);
    console.log('🔍 Web Client ID:', GOOGLE_WEB_CLIENT_ID ? 'Set' : 'Missing');
  }, []);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    redirectUri: redirectUri,
  });

  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, []);

  // Handle Google Sign-In response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    } else if (response?.type === 'error') {
      console.error('Auth error:', response.error);
      setIsLoading(false);
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('auth.loginFailed')
      );
    } else if (response?.type === 'cancel') {
      console.log('User cancelled authentication');
      setIsLoading(false);
    }
  }, [response]);

  // Register FCM token after login (non-blocking, fire-and-forget)
  const registerNotifications = () => {
    // Return immediately - don't block auth flow
    // Run in background - don't block auth flow
    setTimeout(() => {
      // Wrap in try-catch to ensure no errors propagate
      (async () => {
        try {
          const token = await Promise.race([
            notificationService.registerForPushNotifications(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Notification registration timeout')), 10000)
            )
          ]);
          
          if (token) {
            // Register token with backend (also with timeout)
            await Promise.race([
              notificationsApi.registerToken(token),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Backend registration timeout')), 5000)
              )
            ]);
            console.log('✅ FCM token registered with backend');
          }
        } catch (error) {
          // Silently fail - notifications are optional and should never break login
          console.warn('⚠️ Notification registration failed (non-critical):', error.message);
        }
      })();
    }, 500); // Small delay to not block auth flow
  };

  const checkAuth = async () => {
    try {
      const token = await storage.getAccessToken();
      const savedUser = await storage.getUser();

      if (token && savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
        // Register notifications if user is already logged in (non-blocking)
        registerNotifications();
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (idToken) => {
    try {
      setIsLoading(true);
      const data = await authApi.loginWithGoogle(idToken);
      
      await storage.setTokens(data.access_token, data.refresh_token);
      await storage.setUser(data.user);
      
      setUser(data.user);
      setIsAuthenticated(true);

      // Register for notifications after successful login (non-blocking, fire-and-forget)
      registerNotifications();
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('auth.loginFailed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = () => {
    promptAsync();
  };

  // Username/Password Sign In
  const signInWithCredentials = async (username, password) => {
    try {
      setIsLoading(true);
      const data = await authApi.login(username, password);
      
      await storage.setTokens(data.access_token, data.refresh_token);
      await storage.setUser(data.user);
      
      setUser(data.user);
      setIsAuthenticated(true);

      // Register for notifications after successful login (non-blocking, fire-and-forget)
      registerNotifications();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (userData) => {
    try {
      setIsLoading(true);
      const data = await authApi.register(userData);
      
      await storage.setTokens(data.access_token, data.refresh_token);
      await storage.setUser(data.user);
      
      setUser(data.user);
      setIsAuthenticated(true);

      // Register for notifications after successful registration (non-blocking, fire-and-forget)
      registerNotifications();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Remove FCM token from backend
      await notificationsApi.removeToken();
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
    
    await storage.clearTokens();
    await storage.clearUser();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        signIn,
        signInWithCredentials,
        register,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

