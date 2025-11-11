import apiClient from './client';

export const ocrApi = {
  // Scan receipt before saving product
  async scanReceipt(imageUri) {
    const formData = new FormData();
    
    // Extract filename from URI
    const uriParts = imageUri.split('/');
    const fileName = uriParts[uriParts.length - 1] || `receipt_${Date.now()}.jpg`;
    
    // Determine file type from URI or default to jpeg
    let fileType = 'image/jpeg';
    if (fileName.toLowerCase().endsWith('.png')) {
      fileType = 'image/png';
    } else if (fileName.toLowerCase().endsWith('.webp')) {
      fileType = 'image/webp';
    }
    
    formData.append('receipt', {
      uri: imageUri,
      name: fileName,
      type: fileType
    });

    const response = await apiClient.post('/ocr/scan', formData, {
      timeout: 100000 // 10 seconds for OCR processing
    });
    
    return response.data;
  },

  // Process existing document
  async processDocument(documentId) {
    const response = await apiClient.post(`/ocr/documents/${documentId}/process`);
    return response.data;
  },

  // Get OCR history
  async getHistory() {
    const response = await apiClient.get('/ocr/history');
    return response.data;
  }
};

