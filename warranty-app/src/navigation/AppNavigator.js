import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import AddProductScreen from '../screens/AddProductScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import EditProductScreen from '../screens/EditProductScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import NotificationPreferencesScreen from '../screens/NotificationPreferencesScreen';
import NotificationHistoryScreen from '../screens/NotificationHistoryScreen';
import OCRScannerScreen from '../screens/OCRScannerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ThemeSettingsScreen from '../screens/ThemeSettingsScreen';
import ExportScreen from '../screens/ExportScreen';
import FamilyScreen from '../screens/FamilyScreen';
import SharedProductsScreen from '../screens/SharedProductsScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import ScanResultScreen from '../screens/ScanResultScreen';
import SearchScreen from '../screens/SearchScreen';
import FilterScreen from '../screens/FilterScreen';
import MapScreen from '../screens/MapScreen';
import ServiceCenterScreen from '../screens/ServiceCenterScreen';

const Stack = createStackNavigator();

const AppNavigator = forwardRef((props, ref) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigationRef = useRef();

  useImperativeHandle(ref, () => navigationRef.current);

  if (isLoading) {
    const loadingStyles = createLoadingStyles(theme);
    return (
      <View style={loadingStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={loadingStyles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ForgotPassword" 
              component={ForgotPasswordScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen 
              name="AddProduct" 
              component={AddProductScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ProductDetail" 
              component={ProductDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="EditProduct" 
              component={EditProductScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Statistics" 
              component={StatisticsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Documents" 
              component={DocumentsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="NotificationSettings" 
              component={NotificationSettingsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="NotificationPreferences" 
              component={NotificationPreferencesScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="NotificationHistory" 
              component={NotificationHistoryScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="OCRScanner" 
              component={OCRScannerScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ThemeSettings" 
              component={ThemeSettingsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Export" 
              component={ExportScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Family" 
              component={FamilyScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="SharedProducts" 
              component={SharedProductsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="BarcodeScanner" 
              component={BarcodeScannerScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ScanResult" 
              component={ScanResultScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Search" 
              component={SearchScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="SearchFilters" 
              component={FilterScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Map" 
              component={MapScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ServiceCenters" 
              component={ServiceCenterScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
});

AppNavigator.displayName = 'AppNavigator';

const createLoadingStyles = (theme) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary
  }
});

export default AppNavigator;
