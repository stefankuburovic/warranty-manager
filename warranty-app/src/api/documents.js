import apiClient from './client';

export const documentsApi = {
  // Upload document
  async uploadDocument(productId, file, documentType = 'receipt', isPrimary = false) {
    const formData = new FormData();
    
    // Prepare file for upload
    const fileUri = file.uri;
    const fileName = file.fileName || fileUri.split('/').pop();
    const fileType = file.type || 'image/jpeg';
    
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: fileType
    });
    
    formData.append('document_type', documentType);
    formData.append('is_primary', isPrimary.toString());

    const response = await apiClient.post(
      `/documents/products/${productId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 seconds for uploads
      }
    );
    
    return response.data;
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

