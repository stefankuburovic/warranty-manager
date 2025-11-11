import apiClient from './client';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const exportApi = {
  // Export single product as PDF
  async exportProduct(productId) {
    try {
      const response = await apiClient.get(`/export/products/${productId}/pdf`, {
        responseType: 'arraybuffer'
      });
      
      return response.data;
    } catch (error) {
      console.error('Export product error:', error);
      throw error;
    }
  },

  // Export all products as PDF
  async exportAllProducts() {
    try {
      const response = await apiClient.get('/export/products/all/pdf', {
        responseType: 'arraybuffer'
      });
      
      return response.data;
    } catch (error) {
      console.error('Export all error:', error);
      throw error;
    }
  },

  // Export filtered products
  async exportFiltered(filters) {
    try {
      const response = await apiClient.get('/export/products/filtered/pdf', {
        params: filters,
        responseType: 'arraybuffer'
      });
      
      return response.data;
    } catch (error) {
      console.error('Export filtered error:', error);
      throw error;
    }
  },

  // Download and share PDF
  async downloadAndSharePDF(arrayBuffer, filename) {
    try {
      // Validate arrayBuffer
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('PDF data is empty or invalid');
      }

      // Create file URI
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      // Convert ArrayBuffer to base64 (React Native compatible)
      const bytes = new Uint8Array(arrayBuffer);
      // Use chunked approach to avoid stack overflow with large arrays
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk);
      }
      
      // Use base64 encoding compatible with React Native
      let base64String;
      if (typeof btoa !== 'undefined') {
        base64String = btoa(binary);
      } else {
        // Fallback: manual base64 encoding for React Native
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let i = 0;
        while (i < binary.length) {
          const a = binary.charCodeAt(i++);
          const b = i < binary.length ? binary.charCodeAt(i++) : 0;
          const c = i < binary.length ? binary.charCodeAt(i++) : 0;
          
          const bitmap = (a << 16) | (b << 8) | c;
          result += chars.charAt((bitmap >> 18) & 63);
          result += chars.charAt((bitmap >> 12) & 63);
          result += i - 2 < binary.length ? chars.charAt((bitmap >> 6) & 63) : '=';
          result += i - 1 < binary.length ? chars.charAt(bitmap & 63) : '=';
        }
        base64String = result;
      }
      
      // Write file - handle EncodingType properly
      const encodingType = FileSystem.EncodingType?.Base64 || 'base64';
      await FileSystem.writeAsStringAsync(fileUri, base64String, {
        encoding: encodingType
      });
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share file
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Warranty PDF'
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
      
      return true;
    } catch (error) {
      console.error('Download and share error:', error);
      throw error;
    }
  }
};

