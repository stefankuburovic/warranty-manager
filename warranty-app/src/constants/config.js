import AsyncStorage from '@react-native-async-storage/async-storage';

const IP_STORAGE_KEY = '@api_server_ip';
//192.168.55.94
const DEFAULT_IP = '192.168.55.94'; // Fallback IP if not set
const API_PORT = 3000;

/**
 * Get the local IP address from storage or use default
 * @returns {Promise<string>} The IP address
 */
export const getLocalIP = async () => {
  try {
    const storedIP = await AsyncStorage.getItem(IP_STORAGE_KEY);
    if (storedIP) {
      return storedIP;
    }
    return DEFAULT_IP;
  } catch (error) {
    console.error('Error getting local IP:', error);
    return DEFAULT_IP;
  }
};

/**
 * Set the local IP address in storage
 * @param {string} ip - The IP address to store
 */
export const setLocalIP = async (ip) => {
  try {
    // Validate IP format (basic validation)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      throw new Error('Invalid IP address format');
    }
    await AsyncStorage.setItem(IP_STORAGE_KEY, ip);
    console.log('Local IP saved:', ip);
  } catch (error) {
    console.error('Error saving local IP:', error);
    throw error;
  }
};

/**
 * Get the API URL based on environment and stored IP
 * @returns {Promise<string>} The API URL
 */
export const getAPIURL = async () => {
  if (__DEV__) {
    const ip = await getLocalIP();
    return `http://${ip}:${API_PORT}/api/v1`;
  }
  return 'https://api.warranty-app.com/v1';
};

/**
 * Synchronous API URL getter (uses default IP if not yet loaded)
 * For use in non-async contexts, use the async getAPIURL() when possible
 */
export const API_URL = __DEV__ 
  ? `http://${DEFAULT_IP}:${API_PORT}/api/v1`
  : 'https://api.warranty-app.com/v1';

// Initialize API URL on app start
let cachedAPIURL = API_URL;
getAPIURL().then(url => {
  cachedAPIURL = url;
}).catch(() => {
  // Keep default if error
});

/**
 * Get the current API URL (cached version for synchronous use)
 * @returns {string} The API URL
 */
export const getCachedAPIURL = () => cachedAPIURL;

export const GOOGLE_WEB_CLIENT_ID = '1011307825941-h7psi33eqq5d6k42vohpv2fveiae53fj.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '1011307825941-pjv80ajm1mapm6m00u1r87qf5e8ff4g1.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID = '1011307825941-q13qb5nqne52lthms8pa1fsjhmceim40.apps.googleusercontent.com';

