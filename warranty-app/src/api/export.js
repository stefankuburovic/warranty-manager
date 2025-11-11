import apiClient from './client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export const exportApi = {
  // Export single product as PDF
  async exportProduct(productId) {
    try {
      console.log('📄 Requesting PDF export for product:', productId);
      const response = await apiClient.get(`/export/products/${productId}/pdf`, {
        responseType: 'arraybuffer',
        timeout: 120000 // 120 seconds for PDF generation
      });
      
      if (!response.data || response.data.byteLength === 0) {
        throw new Error('PDF data is empty');
      }
      
      console.log('✅ PDF received, size:', response.data.byteLength, 'bytes');
      return response.data;
    } catch (error) {
      console.error('❌ Export product error:', error);
      
      // Handle error response that might be JSON instead of arraybuffer
      if (error.response && error.response.data) {
        try {
          // Try to parse as text first (might be JSON error)
          const textDecoder = new TextDecoder();
          const errorText = textDecoder.decode(error.response.data);
          const errorJson = JSON.parse(errorText);
          console.error('Error details:', errorJson);
          throw new Error(errorJson.message || errorJson.error || 'Failed to generate PDF');
        } catch (parseError) {
          // If parsing fails, it's likely binary data (unexpected)
          console.error('Could not parse error response');
        }
      }
      
      if (error.message === 'Network Error') {
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      
      throw error;
    }
  },

  // Export all products as PDF
  async exportAllProducts() {
    try {
      console.log('📄 Requesting PDF export for all products');
      const response = await apiClient.get('/export/products/all/pdf', {
        responseType: 'arraybuffer',
        timeout: 120000 // 120 seconds for PDF generation
      });
      
      if (!response.data || response.data.byteLength === 0) {
        throw new Error('PDF data is empty');
      }
      
      console.log('✅ PDF received, size:', response.data.byteLength, 'bytes');
      return response.data;
    } catch (error) {
      console.error('❌ Export all error:', error);
      
      if (error.response && error.response.data) {
        try {
          const textDecoder = new TextDecoder();
          const errorText = textDecoder.decode(error.response.data);
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || errorJson.error || 'Failed to generate PDF');
        } catch (parseError) {
          // Ignore parse errors
        }
      }
      
      if (error.message === 'Network Error') {
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      
      throw error;
    }
  },

  // Export filtered products
  async exportFiltered(filters) {
    try {
      console.log('📄 Requesting PDF export for filtered products:', filters);
      const response = await apiClient.get('/export/products/filtered/pdf', {
        params: filters,
        responseType: 'arraybuffer',
        timeout: 120000 // 120 seconds for PDF generation
      });
      
      if (!response.data || response.data.byteLength === 0) {
        throw new Error('PDF data is empty');
      }
      
      console.log('✅ PDF received, size:', response.data.byteLength, 'bytes');
      return response.data;
    } catch (error) {
      console.error('❌ Export filtered error:', error);
      
      if (error.response && error.response.data) {
        try {
          const textDecoder = new TextDecoder();
          const errorText = textDecoder.decode(error.response.data);
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || errorJson.error || 'Failed to generate PDF');
        } catch (parseError) {
          // Ignore parse errors
        }
      }
      
      if (error.message === 'Network Error') {
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      
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
      
      // Write file using legacy API (supports base64 encoding)
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

