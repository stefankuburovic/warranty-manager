import apiClient from './client';
import * as FileSystem from 'expo-file-system';

export const documentsApi = {
  // Upload document
  async uploadDocument(productId, file, documentType = 'receipt', isPrimary = false) {
    try {
      const formData = new FormData();
      
      // Prepare file for upload - React Native FormData format
      let fileUri = file.uri;
      
      // Ensure file URI is properly formatted for React Native
      // React Native FormData expects file:// URIs
      if (!fileUri.startsWith('file://') && !fileUri.startsWith('http')) {
        if (fileUri.startsWith('/')) {
          fileUri = `file://${fileUri}`;
        } else {
          fileUri = `file:///${fileUri}`;
        }
      }
      
      // Verify file exists (for local files)
      if (fileUri.startsWith('file://')) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          if (!fileInfo.exists) {
            throw new Error(`File does not exist at: ${fileUri}`);
          }
          console.log('✓ File verified:', {
            exists: fileInfo.exists,
            size: fileInfo.size,
            uri: fileUri.substring(0, 60) + '...'
          });
        } catch (fileError) {
          console.warn('⚠️ Could not verify file:', fileError);
          // Continue anyway - might be a network URL or other format
        }
      }
      
      const fileName = file.fileName || fileUri.split('/').pop() || 'image.jpg';
      const fileType = file.type || 'image/jpeg';
      
      console.log('📤 Uploading document:', {
        productId,
        fileName,
        fileType,
        uri: fileUri.substring(0, 60) + '...'
      });
      
      // React Native FormData requires this specific format
      // Note: In React Native, FormData handles file:// URIs automatically
      // The file object must have uri, name, and type properties
      const fileObject = {
        uri: fileUri,
        name: fileName,
        type: fileType
      };
      
      // Append file - React Native FormData will handle the file:// URI
      formData.append('file', fileObject);
      
      // Append other fields as strings
      formData.append('document_type', String(documentType));
      formData.append('is_primary', String(isPrimary));

      // Get the API URL to ensure we're using the correct endpoint
      const { getAPIURL } = await import('../constants/config');
      const apiUrl = await getAPIURL();
      const fullUrl = `${apiUrl}/documents/products/${productId}/documents`;
      
      console.log('🌐 Upload URL:', fullUrl);
      console.log('📋 FormData entries:', {
        hasFile: !!fileObject.uri,
        fileUri: fileObject.uri?.substring(0, 50) + '...',
        documentType,
        isPrimary
      });

      // Don't set Content-Type header - let axios handle it automatically
      // The interceptor in client.js will remove it for FormData
      const response = await apiClient.post(
        `/documents/products/${productId}/documents`,
        formData,
        {
          timeout: 120000, // 120 seconds for uploads (increased for large files)
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              console.log(`📊 Upload progress: ${percentCompleted}% (${Math.round(progressEvent.loaded / 1024)}KB / ${Math.round(progressEvent.total / 1024)}KB)`);
            }
          }
        }
      );
      
      console.log('✅ Document uploaded successfully');
      return response.data;
    } catch (error) {
      // Enhanced error logging
      const errorDetails = {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : null,
        request: error.request ? {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout,
          baseURL: error.config?.baseURL
        } : null
      };
      
      console.error('❌ Upload error details:', JSON.stringify(errorDetails, null, 2));
      
      // Provide user-friendly error message
      if (error.message === 'Network Error') {
        throw new Error('Network connection failed. Please check your internet connection and ensure the server is running.');
      } else if (error.response) {
        throw new Error(error.response.data?.error || `Upload failed: ${error.response.status} ${error.response.statusText}`);
      } else {
        throw error;
      }
    }
  },

  // Get documents for a product
  async getProductDocuments(productId) {
    const response = await apiClient.get(`/documents/products/${productId}/documents`);
    return response.data;
  },

  // Get single document
  async getDocument(documentId) {
    const response = await apiClient.get(`/documents/${documentId}`);
    return response.data;
  },

  // Delete document
  async deleteDocument(documentId) {
    const response = await apiClient.delete(`/documents/${documentId}`);
    return response.data;
  },

  // Mark as primary
  async markAsPrimary(documentId) {
    const response = await apiClient.put(`/documents/${documentId}/primary`);
    return response.data;
  }
};

