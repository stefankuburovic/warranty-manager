import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import notificationService from './src/services/notificationService';
import './src/i18n'; // Import i18n configuration

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { theme, isDark } = useTheme();
  const navigationRef = useRef();

  useEffect(() => {
    if (isAuthenticated && navigationRef.current) {
      notificationService.setupNotificationListeners(navigationRef.current);
    }

    return () => {
      notificationService.removeNotificationListeners();
    };
  }, [isAuthenticated]);

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
    <PaperProvider theme={theme}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </PaperProvider>
  );
}

export default AppWithTheme;
