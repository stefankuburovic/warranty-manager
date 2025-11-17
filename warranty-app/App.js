import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';
import notificationService from './src/services/notificationService';
import { setNavigationRef } from './src/api/client';
import './src/i18n'; // Import i18n configuration

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { theme, isDark } = useTheme();
  const navigationRef = useRef();

  useEffect(() => {
    // Set navigation ref for API client to handle auth errors
    // Use a small delay to ensure navigationRef.current is set
    const timer = setTimeout(() => {
      if (navigationRef.current) {
        setNavigationRef(navigationRef);
      }
    }, 100);
    
    if (isAuthenticated && navigationRef.current) {
      notificationService.setupNotificationListeners(navigationRef.current);
    }

    return () => {
      clearTimeout(timer);
      notificationService.removeNotificationListeners();
      setNavigationRef(null);
    };
  }, [isAuthenticated]);

  // Handle unhandled promise rejections in production
  useEffect(() => {
    if (!__DEV__) {
      const errorHandler = (error, isFatal) => {
        console.error('Unhandled error:', error);
        // In production, you might want to log to a crash reporting service
        // For now, we'll just log it
      };

      // Set up global error handler
      const originalHandler = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        errorHandler(error, isFatal);
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });

      return () => {
        ErrorUtils.setGlobalHandler(originalHandler);
      };
    }
  }, []);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.statusBar}
      />
      <AppNavigator ref={navigationRef} />
    </>
  );
}

function AppWithTheme() {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);

  useEffect(() => {
    // Wait for i18n to initialize
    const timer = setTimeout(() => {
      setIsI18nInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!isI18nInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <ThemeContent />
    </ThemeProvider>
  );
}

function ThemeContent() {
  const { theme } = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <ToastProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ToastProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default AppWithTheme;
