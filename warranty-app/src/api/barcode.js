import client from './client';

export const barcodeApi = {
  // Lookup product by barcode
  lookupBarcode: async (barcode) => {
    const response = await client.get(`/barcode/lookup/${barcode}`);
    return response.data;
  },

  // Parse QR code data
  parseQRCode: async (qrData) => {
    const response = await client.post('/barcode/parse-qr', { qrData });
    return response.data;
  },

  // Save scan to history
  saveScanHistory: async (barcode, scanResult, productFound) => {
    const response = await client.post('/barcode/scan-history', {
      barcode,
      scan_result: scanResult,
      product_found: productFound
    });
    return response.data;
  },

  // Validate barcode format
  validateBarcode: async (barcode) => {
    const response = await client.post('/barcode/validate', { barcode });
    return response.data;
  }
};

