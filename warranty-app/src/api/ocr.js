import apiClient from './client';

export const ocrApi = {
  // Scan receipt before saving product
  async scanReceipt(fileUri, fileType = 'image') {
    const formData = new FormData();
    
    // Extract filename from URI
    const uriParts = fileUri.split('/');
    const fileName = uriParts[uriParts.length - 1] || `receipt_${Date.now()}.${fileType === 'pdf' ? 'pdf' : 'jpg'}`;
    
    // Determine file type from URI or fileType parameter
    let mimeType = 'image/jpeg';
    if (fileType === 'pdf') {
      mimeType = 'application/pdf';
    } else if (fileName.toLowerCase().endsWith('.png')) {
      mimeType = 'image/png';
    } else if (fileName.toLowerCase().endsWith('.webp')) {
      mimeType = 'image/webp';
    }
    
    formData.append('receipt', {
      uri: fileUri,
      name: fileName,
      type: mimeType
    });

    const response = await apiClient.post('/ocr/scan', formData, {
      timeout: 120000 // 120 seconds for OCR processing (PDFs may take longer)
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

