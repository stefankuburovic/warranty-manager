import Constants from 'expo-constants';

/**
 * Check if the app is running in Expo Go
 * @returns {boolean} True if running in Expo Go, false otherwise
 */
export const isExpoGo = () => {
  // Check execution environment
  // In Expo Go: executionEnvironment === 'storeClient'
  // In development build: executionEnvironment === 'standalone' or 'bare'
  if (Constants.executionEnvironment === 'storeClient') {
    return true;
  }

  // Additional check: Expo Go has a specific appOwnership
  if (Constants.appOwnership === 'expo') {
    return true;
  }

  // Check if running in Expo Go by checking for expo-barcode-scanner availability
  // This is a runtime check - if the module doesn't exist, we're likely in Expo Go
  try {
    // Try to require the module - if it fails, we might be in Expo Go
    // But this is not reliable, so we'll use the executionEnvironment check above
    return false;
  } catch (error) {
    return true;
  }
};

/**
 * Check if barcode scanning is available
 * @returns {boolean} True if barcode scanning is available, false otherwise
 * Note: expo-camera's barcode scanning works in Expo Go, so this always returns true
 */
export const isBarcodeScanningAvailable = () => {
  // return !isExpoGo();
  // expo-camera's barcode scanning works in Expo Go
  return true;
};

