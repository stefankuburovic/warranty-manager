import { getLocalIP, setLocalIP, getAPIURL } from '../constants/config';

/**
 * IP Helper Utilities
 * 
 * These functions help manage the local IP address for API connections
 */

/**
 * Get the current stored IP address
 * @returns {Promise<string>} The IP address
 * 
 * @example
 * const ip = await getCurrentIP();
 * console.log('Current IP:', ip);
 */
export const getCurrentIP = getLocalIP;

/**
 * Update the IP address
 * @param {string} ip - The new IP address (e.g., '192.168.0.27')
 * @returns {Promise<void>}
 * 
 * @example
 * await updateIP('192.168.0.27');
 */
export const updateIP = setLocalIP;

/**
 * Get the full API URL
 * @returns {Promise<string>} The full API URL
 * 
 * @example
 * const url = await getAPIURL();
 * console.log('API URL:', url); // http://192.168.0.27:3000/api/v1
 */
export { getAPIURL };

/**
 * Test if the API server is reachable
 * @param {string} ip - Optional IP address to test (uses stored IP if not provided)
 * @returns {Promise<boolean>} True if server is reachable
 * 
 * @example
 * const isReachable = await testConnection();
 * if (isReachable) {
 *   console.log('Server is online!');
 * }
 */
export const testConnection = async (ip = null) => {
  try {
    const testIP = ip || await getLocalIP();
    const response = await fetch(`http://${testIP}:3000/health`, {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
};

/**
 * Auto-detect and set the IP address
 * Note: This requires the backend to be running and accessible
 * @returns {Promise<string|null>} The detected IP or null if detection failed
 * 
 * @example
 * const detectedIP = await autoDetectIP();
 * if (detectedIP) {
 *   await updateIP(detectedIP);
 * }
 */
export const autoDetectIP = async () => {
  // Common local IP ranges to try
  const commonRanges = [
    '192.168.0',
    '192.168.1',
    '10.0.0',
    '172.16.0'
  ];

  for (const range of commonRanges) {
    for (let i = 1; i <= 255; i++) {
      const testIP = `${range}.${i}`;
      try {
        const response = await fetch(`http://${testIP}:3000/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(1000) // 1 second timeout per IP
        });
        if (response.ok) {
          return testIP;
        }
      } catch (error) {
        // Continue to next IP
        continue;
      }
    }
  }
  return null;
};

