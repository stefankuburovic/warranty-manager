# OCR Receipt Scanning - Complete Implementation v1.1.0

## Overview
Implement optical character recognition (OCR) to automatically extract data from receipt images:
- Product names and descriptions
- Purchase price and currency
- Purchase date
- Store name and location
- Warranty information (if present)
- Tax/VAT information

We'll use **Google Cloud Vision API** (most accurate for receipts) with fallback to **Tesseract.js** (free, offline option).

---

## Part 1: Backend - OCR Service Setup

### 1.1 Install Dependencies

```bash
cd warranty-app-backend
npm install @google-cloud/vision tesseract.js date-fns
```

**Packages:**
- `@google-cloud/vision` - Google Cloud Vision API client
- `tesseract.js` - Free OCR alternative (offline)
- `date-fns` - Date parsing and manipulation

### 1.2 Google Cloud Vision Setup

1. **Enable Vision API**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Select your project (or create new one)
   - Enable "Cloud Vision API"
   - Go to "APIs & Services" → "Credentials"
   - Create Service Account
   - Download JSON key file as `google-vision-key.json`

2. **Set Up Credentials**
   ```bash
   # Place google-vision-key.json in backend root
   # Add to .gitignore
   ```

### 1.3 OCR Service (src/services/ocrService.js)

```javascript
const vision = require('@google-cloud/vision');
const Tesseract = require('tesseract.js');
const { parse, isValid } = require('date-fns');

class OCRService {
  constructor() {
    // Initialize Google Cloud Vision client
    this.visionClient = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_VISION_KEY_PATH || './google-vision-key.json'
    });
    
    this.useGoogleVision = !!process.env.GOOGLE_VISION_KEY_PATH;
  }

  // Main OCR function
  async extractReceiptData(imageBuffer) {
    try {
      let text = '';
      
      // Try Google Vision API first (if configured)
      if (this.useGoogleVision) {
        try {
          text = await this.extractTextWithGoogleVision(imageBuffer);
          console.log('✓ Using Google Cloud Vision API');
        } catch (error) {
          console.error('Google Vision failed, falling back to Tesseract:', error);
          text = await this.extractTextWithTesseract(imageBuffer);
        }
      } else {
        // Use Tesseract as fallback
        text = await this.extractTextWithTesseract(imageBuffer);
        console.log('✓ Using Tesseract OCR');
      }

      // Parse extracted text
      const extractedData = await this.parseReceiptText(text);
      
      return {
        success: true,
        raw_text: text,
        extracted_data: extractedData,
        confidence: extractedData.confidence
      };
    } catch (error) {
      console.error('OCR extraction error:', error);
      return {
        success: false,
        error: error.message,
        raw_text: null,
        extracted_data: null
      };
    }
  }

  // Google Cloud Vision API extraction
  async extractTextWithGoogleVision(imageBuffer) {
    const [result] = await this.visionClient.textDetection(imageBuffer);
    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      throw new Error('No text detected in image');
    }
    
    // First annotation contains full text
    return detections[0].description;
  }

  // Tesseract.js extraction
  async extractTextWithTesseract(imageBuffer) {
    const { data } = await Tesseract.recognize(imageBuffer, 'eng+srp', {
      logger: info => console.log(info)
    });
    
    return data.text;
  }

  // Parse extracted text into structured data
  async parseReceiptText(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    const extractedData = {
      store_name: this.extractStoreName(lines),
      purchase_date: this.extractDate(text),
      total_amount: this.extractTotalAmount(text),
      currency: this.extractCurrency(text),
      items: this.extractItems(lines),
      tax_amount: this.extractTaxAmount(text),
      store_address: this.extractAddress(lines),
      receipt_number: this.extractReceiptNumber(text),
      confidence: 0
    };

    // Calculate confidence score
    extractedData.confidence = this.calculateConfidence(extractedData);

    return extractedData;
  }

  // Extract store name (usually in first few lines)
  extractStoreName(lines) {
    // Common Serbian store chains
    const knownStores = [
      'TEHNOMANIJA', 'GIGATRON', 'EMMI', 'TEMPO', 'JYSK',
      'METRO', 'IDEA', 'MAXI', 'RODA', 'WIN WIN',
      'SPORTS VISION', 'BUZZ', 'PLANET SPORT', 'OFFICE SHOES'
    ];

    // Check first 5 lines for known stores
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].toUpperCase();
      for (const store of knownStores) {
        if (line.includes(store)) {
          return lines[i];
        }
      }
    }

    // If no known store, return first line that's not too short
    for (const line of lines.slice(0, 5)) {
      if (line.length > 3 && line.length < 50 && !line.match(/^\d+$/)) {
        return line;
      }
    }

    return null;
  }

  // Extract purchase date
  extractDate(text) {
    const datePatterns = [
      // DD.MM.YYYY or DD/MM/YYYY
      /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/,
      // DD.MM.YY or DD/MM/YY
      /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2})/,
      // YYYY-MM-DD
      /(\d{4})-(\d{1,2})-(\d{1,2})/
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        let day, month, year;
        
        if (pattern.toString().includes('4')) {
          // YYYY format
          if (match[1].length === 4) {
            [, year, month, day] = match;
          } else {
            [, day, month, year] = match;
          }
        } else {
          // YY format
          [, day, month, year] = match;
          year = `20${year}`;
        }

        const date = new Date(year, month - 1, day);
        if (isValid(date)) {
          return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
        }
      }
    }

    return null;
  }

  // Extract total amount
  extractTotalAmount(text) {
    // Patterns for total amount (Serbian receipts)
    const totalPatterns = [
      /UKUPNO[:\s]+(\d+[.,]\d{2})/i,
      /TOTAL[:\s]+(\d+[.,]\d{2})/i,
      /SUMA[:\s]+(\d+[.,]\d{2})/i,
      /ZA\s+UPLATU[:\s]+(\d+[.,]\d{2})/i,
      /AMOUNT[:\s]+(\d+[.,]\d{2})/i
    ];

    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Replace comma with dot for decimal
        return parseFloat(match[1].replace(',', '.'));
      }
    }

    // Find largest amount in text (likely the total)
    const amounts = text.match(/\d+[.,]\d{2}/g);
    if (amounts && amounts.length > 0) {
      const largestAmount = amounts
        .map(a => parseFloat(a.replace(',', '.')))
        .sort((a, b) => b - a)[0];
      return largestAmount;
    }

    return null;
  }

  // Extract currency
  extractCurrency(text) {
    // Serbian receipts commonly use RSD, EUR, or din
    const currencyPatterns = [
      { pattern: /RSD/i, currency: 'RSD' },
      { pattern: /EUR/i, currency: 'EUR' },
      { pattern: /€/i, currency: 'EUR' },
      { pattern: /DINARA/i, currency: 'RSD' },
      { pattern: /DIN[.\s]/i, currency: 'RSD' }
    ];

    for (const { pattern, currency } of currencyPatterns) {
      if (pattern.test(text)) {
        return currency;
      }
    }

    return 'RSD'; // Default to RSD for Serbia
  }

  // Extract individual items
  extractItems(lines) {
    const items = [];
    const itemPattern = /^(.+?)\s+(\d+[.,]\d{2})$/;

    for (const line of lines) {
      const match = line.match(itemPattern);
      if (match) {
        const [, name, price] = match;
        // Skip if line looks like a total or subtotal
        if (!name.match(/UKUPNO|TOTAL|SUMA|SUBTOTAL/i)) {
          items.push({
            name: name.trim(),
            price: parseFloat(price.replace(',', '.'))
          });
        }
      }
    }

    return items.length > 0 ? items : null;
  }

  // Extract tax amount
  extractTaxAmount(text) {
    const taxPatterns = [
      /PDV[:\s]+(\d+[.,]\d{2})/i,
      /VAT[:\s]+(\d+[.,]\d{2})/i,
      /TAX[:\s]+(\d+[.,]\d{2})/i,
      /POREZ[:\s]+(\d+[.,]\d{2})/i
    ];

    for (const pattern of taxPatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(match[1].replace(',', '.'));
      }
    }

    return null;
  }

  // Extract store address
  extractAddress(lines) {
    // Look for address indicators
    const addressIndicators = [
      'ULICA', 'BULEVAR', 'TRG', 'ADRESA', 'ADDRESS',
      'BEOGRAD', 'NOVI SAD', 'NIŠ', 'SRBIJA'
    ];

    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].toUpperCase();
      for (const indicator of addressIndicators) {
        if (line.includes(indicator)) {
          // Return this line and possibly the next one
          const address = lines[i];
          if (i + 1 < lines.length && lines[i + 1].length < 50) {
            return `${address}, ${lines[i + 1]}`;
          }
          return address;
        }
      }
    }

    return null;
  }

  // Extract receipt number
  extractReceiptNumber(text) {
    const receiptPatterns = [
      /RAČUN[:\s#]+(\d+)/i,
      /RECEIPT[:\s#]+(\d+)/i,
      /BR[.:\s]+(\d+)/i,
      /NO[.:\s]+(\d+)/i,
      /#(\d+)/
    ];

    for (const pattern of receiptPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  // Calculate confidence score
  calculateConfidence(data) {
    let score = 0;
    let maxScore = 0;

    // Store name (20 points)
    maxScore += 20;
    if (data.store_name) score += 20;

    // Date (25 points)
    maxScore += 25;
    if (data.purchase_date) score += 25;

    // Amount (25 points)
    maxScore += 25;
    if (data.total_amount) score += 25;

    // Currency (10 points)
    maxScore += 10;
    if (data.currency) score += 10;

    // Items (15 points)
    maxScore += 15;
    if (data.items && data.items.length > 0) score += 15;

    // Receipt number (5 points)
    maxScore += 5;
    if (data.receipt_number) score += 5;

    return Math.round((score / maxScore) * 100);
  }

  // Suggest product name from items
  suggestProductName(extractedData) {
    if (!extractedData.items || extractedData.items.length === 0) {
      return null;
    }

    // If only one item, that's likely the product
    if (extractedData.items.length === 1) {
      return extractedData.items[0].name;
    }

    // If multiple items, find the most expensive one
    const mostExpensive = extractedData.items
      .sort((a, b) => b.price - a.price)[0];
    
    return mostExpensive.name;
  }
}

module.exports = new OCRService();
```

### 1.4 OCR Controller (src/controllers/ocrController.js)

```javascript
const ocrService = require('../services/ocrService');
const { Document, Product } = require('../models');
const { getSignedUrl } = require('../config/storage');

// Process receipt image and extract data
exports.processReceipt = async (req, res) => {
  try {
    const { document_id } = req.params;

    // Get document
    const document = await Document.findOne({
      where: { document_id },
      include: [{
        model: Product,
        where: { user_id: req.user.user_id }
      }]
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if it's an image
    if (!document.mime_type.startsWith('image/')) {
      return res.status(400).json({ error: 'Document must be an image' });
    }

    // Download image from S3
    const s3 = require('../config/storage').s3;
    const s3Object = await s3.getObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: document.cloud_storage_url
    }).promise();

    // Extract data using OCR
    const ocrResult = await ocrService.extractReceiptData(s3Object.Body);

    if (!ocrResult.success) {
      return res.status(500).json({ 
        error: 'OCR processing failed',
        details: ocrResult.error
      });
    }

    // Save OCR data to document
    await document.update({
      ocr_data: ocrResult.extracted_data,
      ocr_raw_text: ocrResult.raw_text,
      ocr_processed_at: new Date()
    });

    res.json({
      message: 'Receipt processed successfully',
      extracted_data: ocrResult.extracted_data,
      confidence: ocrResult.confidence,
      suggestions: {
        product_name: ocrService.suggestProductName(ocrResult.extracted_data),
        purchase_price: ocrResult.extracted_data.total_amount,
        purchase_date: ocrResult.extracted_data.purchase_date,
        store_name: ocrResult.extracted_data.store_name
      }
    });
  } catch (error) {
    console.error('Process receipt error:', error);
    res.status(500).json({ error: 'Failed to process receipt' });
  }
};

// Process receipt from uploaded file (before saving product)
exports.processUploadedReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if it's an image
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' });
    }

    // Extract data using OCR
    const ocrResult = await ocrService.extractReceiptData(req.file.buffer);

    if (!ocrResult.success) {
      return res.status(500).json({ 
        error: 'OCR processing failed',
        details: ocrResult.error
      });
    }

    res.json({
      message: 'Receipt scanned successfully',
      extracted_data: ocrResult.extracted_data,
      confidence: ocrResult.confidence,
      suggestions: {
        product_name: ocrService.suggestProductName(ocrResult.extracted_data),
        purchase_price: ocrResult.extracted_data.total_amount,
        purchase_date: ocrResult.extracted_data.purchase_date,
        store_name: ocrResult.extracted_data.store_name,
        currency: ocrResult.extracted_data.currency
      },
      raw_text: ocrResult.raw_text
    });
  } catch (error) {
    console.error('Process uploaded receipt error:', error);
    res.status(500).json({ error: 'Failed to process receipt' });
  }
};

// Get OCR history for user
exports.getOCRHistory = async (req, res) => {
  try {
    const documents = await Document.findAll({
      where: {
        ocr_processed_at: { [require('sequelize').Op.ne]: null }
      },
      include: [{
        model: Product,
        where: { user_id: req.user.user_id },
        attributes: ['product_id', 'product_name']
      }],
      order: [['ocr_processed_at', 'DESC']],
      limit: 50
    });

    res.json({ documents });
  } catch (error) {
    console.error('Get OCR history error:', error);
    res.status(500).json({ error: 'Failed to get OCR history' });
  }
};
```

### 1.5 Update Document Model (src/models/Document.js)

Add OCR fields to Document model:

```javascript
const Document = sequelize.define('Document', {
  // ... existing fields ...
  
  ocr_data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  
  ocr_raw_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  ocr_processed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  // ... existing config ...
});
```

### 1.6 OCR Routes (src/routes/ocr.js)

```javascript
const express = require('express');
const router = express.Router();
const ocrController = require('../controllers/ocrController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for memory storage (temporary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// All routes require authentication
router.use(authenticateToken);

// Process existing document
router.post('/documents/:document_id/process', ocrController.processReceipt);

// Process uploaded receipt (before saving product)
router.post('/scan', upload.single('receipt'), ocrController.processUploadedReceipt);

// Get OCR history
router.get('/history', ocrController.getOCRHistory);

module.exports = router;
```

### 1.7 Update Main App (src/app.js)

```javascript
const ocrRoutes = require('./routes/ocr');

// Add after other routes
app.use('/api/v1/ocr', ocrRoutes);
```

### 1.8 Update Environment Variables

```env
# Google Cloud Vision (optional, falls back to Tesseract if not set)
GOOGLE_VISION_KEY_PATH=./google-vision-key.json
```

---

## Part 2: Mobile App - OCR Integration

### 2.1 OCR API (src/api/ocr.js)

```javascript
import apiClient from './client';

export const ocrApi = {
  // Scan receipt before saving product
  async scanReceipt(imageUri) {
    const formData = new FormData();
    
    const fileName = imageUri.split('/').pop();
    const fileType = 'image/jpeg';
    
    formData.append('receipt', {
      uri: imageUri,
      name: fileName,
      type: fileType
    });

    const response = await apiClient.post('/ocr/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // 60 seconds for OCR processing
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
```

### 2.2 OCR Scanner Screen (src/screens/OCRScannerScreen.js)

```javascript
import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Chip, ActivityIndicator, Appbar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { ocrApi } from '../api/ocr';

export default function OCRScannerScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
      exif: false
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setOcrResult(null);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setOcrResult(null);
    }
  };

  const scanReceipt = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    try {
      setIsProcessing(true);
      const result = await ocrApi.scanReceipt(image);
      setOcrResult(result);
      
      if (result.confidence < 50) {
        Alert.alert(
          'Low Confidence',
          'OCR confidence is low. Please verify the extracted data carefully.'
        );
      }
    } catch (error) {
      console.error('OCR scan error:', error);
      Alert.alert('Error', 'Failed to scan receipt. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const useExtractedData = () => {
    if (!ocrResult || !ocrResult.suggestions) {
      Alert.alert('Error', 'No data to use');
      return;
    }

    navigation.navigate('AddProduct', {
      ocrData: ocrResult.suggestions,
      receiptImage: image
    });
  };

  const retake = () => {
    setImage(null);
    setOcrResult(null);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Scan Receipt" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {!image ? (
          <View style={styles.emptyContainer}>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              Scan Your Receipt
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Take a photo or choose an existing image of your receipt
            </Text>

            <Button
              mode="contained"
              icon="camera"
              onPress={takePicture}
              style={styles.actionButton}
            >
              Take Photo
            </Button>

            <Button
              mode="outlined"
              icon="image"
              onPress={pickImage}
              style={styles.actionButton}
            >
              Choose from Gallery
            </Button>
          </View>
        ) : (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Image source={{ uri: image }} style={styles.image} />
                
                {!ocrResult && !isProcessing && (
                  <View style={styles.actions}>
                    <Button
                      mode="contained"
                      onPress={scanReceipt}
                      icon="text-recognition"
                      style={styles.scanButton}
                    >
                      Scan Receipt
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={retake}
                      style={styles.retakeButton}
                    >
                      Retake
                    </Button>
                  </View>
                )}
              </Card.Content>
            </Card>

            {isProcessing && (
              <Card style={styles.card}>
                <Card.Content style={styles.processingContainer}>
                  <ActivityIndicator size="large" />
                  <Text variant="titleMedium" style={styles.processingText}>
                    Scanning receipt...
                  </Text>
                  <Text variant="bodySmall" style={styles.processingSubtext}>
                    This may take a few seconds
                  </Text>
                </Card.Content>
              </Card>
            )}

            {ocrResult && (
              <>
                <Card style={styles.card}>
                  <Card.Content>
                    <View style={styles.resultHeader}>
                      <Text variant="titleLarge">Extracted Data</Text>
                      <Chip
                        mode="flat"
                        style={[
                          styles.confidenceChip,
                          {
                            backgroundColor: 
                              ocrResult.confidence >= 75 ? '#4caf5020' :
                              ocrResult.confidence >= 50 ? '#ff980020' :
                              '#f4433620'
                          }
                        ]}
                        textStyle={{
                          color:
                            ocrResult.confidence >= 75 ? '#4caf50' :
                            ocrResult.confidence >= 50 ? '#ff9800' :
                            '#f44336'
                        }}
                      >
                        {ocrResult.confidence}% Confidence
                      </Chip>
                    </View>

                    {ocrResult.suggestions.product_name && (
                      <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Product:</Text>
                        <Text style={styles.dataValue}>
                          {ocrResult.suggestions.product_name}
                        </Text>
                      </View>
                    )}

                    {ocrResult.suggestions.store_name && (
                      <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Store:</Text>
                        <Text style={styles.dataValue}>
                          {ocrResult.suggestions.store_name}
                        </Text>
                      </View>
                    )}

                    {ocrResult.suggestions.purchase_price && (
                      <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Price:</Text>
                        <Text style={styles.dataValue}>
                          {ocrResult.suggestions.purchase_price} {ocrResult.suggestions.currency}
                        </Text>
                      </View>
                    )}

                    {ocrResult.suggestions.purchase_date && (
                      <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Date:</Text>
                        <Text style={styles.dataValue}>
                          {new Date(ocrResult.suggestions.purchase_date).toLocaleDateString('sr-RS')}
                        </Text>
                      </View>
                    )}

                    <Button
                      mode="contained"
                      onPress={useExtractedData}
                      icon="check"
                      style={styles.useButton}
                    >
                      Use This Data
                    </Button>

                    <Button
                      mode="outlined"
                      onPress={retake}
                      style={styles.retakeButton}
                    >
                      Scan Another Receipt
                    </Button>
                  </Card.Content>
                </Card>

                {ocrResult.extracted_data?.items && ocrResult.extracted_data.items.length > 0 && (
                  <Card style={styles.card}>
                    <Card.Content>
                      <Text variant="titleMedium" style={styles.itemsTitle}>
                        Detected Items
                      </Text>
                      {ocrResult.extracted_data.items.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemPrice}>{item.price} RSD</Text>
                        </View>
                      ))}
                    </Card.Content>
                  </Card>
                )}

                {ocrResult.raw_text && (
                  <Card style={styles.card}>
                    <Card.Content>
                      <Text variant="titleMedium" style={styles.rawTextTitle}>
                        Raw OCR Text
                      </Text>
                      <Text variant="bodySmall" style={styles.rawText}>
                        {ocrResult.raw_text}
                      </Text>
                    </Card.Content>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  content: {
    flex: 1,
    padding: 16
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    marginBottom: 10,
    textAlign: 'center'
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 40
  },
  actionButton: {
    marginBottom: 16,
    width: '100%'
  },
  card: {
    marginBottom: 16,
    elevation: 2
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16
  },
  actions: {
    marginTop: 8
  },
  scanButton: {
    marginBottom: 12
  },
  retakeButton: {
    marginTop: 8
  },
  processingContainer: {
    alignItems: 'center',
    padding: 20
  },
  processingText: {
    marginTop: 16,
    marginBottom: 8
  },
  processingSubtext: {
    color: '#666'
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  confidenceChip: {
    height: 28
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  dataLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right'
  },
  useButton: {
    marginTop: 16
  },
  itemsTitle: {
    marginBottom: 12
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  itemName: {
    flex: 1,
    fontSize: 14
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500'
  },
  rawTextTitle: {
    marginBottom: 12
  },
  rawText: {
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    fontSize: 12,
    color: '#666'
  }
});
```

### 2.3 Update Add Product Screen - Accept OCR Data

Update AddProductScreen.js to accept OCR data:

```javascript
export default function AddProductScreen({ navigation, route }) {
  // Get OCR data from route params if available
  const ocrData = route.params?.ocrData;
  const receiptImage = route.params?.receiptImage;

  // State initialization with OCR data
  const [productName, setProductName] = useState(ocrData?.product_name || '');
  const [brand, setBrand] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(ocrData?.purchase_date || '');
  const [price, setPrice] = useState(ocrData?.purchase_price?.toString() || '');
  const [storeName, setStoreName] = useState(ocrData?.store_name || '');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [documents, setDocuments] = useState(receiptImage ? [{ uri: receiptImage }] : []);

  // Show OCR indicator if data was pre-filled
  useEffect(() => {
    if (ocrData) {
      Alert.alert(
        'Data Pre-filled',
        'We\'ve automatically filled some fields from your receipt. Please verify the information.',
        [{ text: 'OK' }]
      );
    }
  }, [ocrData]);

  // Rest of the component...
}
```

### 2.4 Update Home Screen - Add Scan Button

Add quick scan button to HomeScreen.js:

```javascript
<Appbar.Header>
  <Appbar.Content title="My Warranties" />
  <Appbar.Action 
    icon="text-recognition" 
    onPress={() => navigation.navigate('OCRScanner')}
  />
  <Appbar.Action 
    icon="bell" 
    onPress={() => navigation.navigate('NotificationSettings')}
  />
  <Appbar.Action 
    icon="chart-box" 
    onPress={() => navigation.navigate('Statistics')} 
  />
  <Appbar.Action icon="logout" onPress={signOut} />
</Appbar.Header>
```

### 2.5 Update App Navigator

```javascript
import OCRScannerScreen from '../screens/OCRScannerScreen';

// Add inside authenticated stack:
<Stack.Screen 
  name="OCRScanner" 
  component={OCRScannerScreen}
  options={{ headerShown: false }}
/>
```

---

## Part 3: Advanced Features & Improvements

### 3.1 Store Matching Service (src/services/storeMatchingService.js)

Automatically match extracted store names to existing stores:

```javascript
const { Store } = require('../models');
const { Op } = require('sequelize');

class StoreMatchingService {
  
  // Find best matching store
  async findMatchingStore(storeName) {
    if (!storeName) return null;

    const normalizedName = this.normalizeStoreName(storeName);

    // Try exact match first
    let store = await Store.findOne({
      where: {
        store_name: { [Op.iLike]: normalizedName }
      }
    });

    if (store) return store;

    // Try partial match on store chain
    const stores = await Store.findAll();
    
    for (const s of stores) {
      if (s.store_chain) {
        const normalizedChain = this.normalizeStoreName(s.store_chain);
        if (normalizedName.includes(normalizedChain) || 
            normalizedChain.includes(normalizedName)) {
          return s;
        }
      }
    }

    // Try fuzzy matching
    const bestMatch = this.fuzzyMatch(normalizedName, stores);
    if (bestMatch && bestMatch.score > 0.7) {
      return bestMatch.store;
    }

    return null;
  }

  normalizeStoreName(name) {
    return name
      .toUpperCase()
      .replace(/[^\w\s]/gi, '')
      .trim();
  }

  // Simple Levenshtein-based fuzzy matching
  fuzzyMatch(target, stores) {
    let bestMatch = null;
    let bestScore = 0;

    for (const store of stores) {
      const storeName = this.normalizeStoreName(store.store_name);
      const score = this.similarity(target, storeName);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = store;
      }
    }

    return bestMatch ? { store: bestMatch, score: bestScore } : null;
  }

  similarity(s1, s2) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

module.exports = new StoreMatchingService();
```

### 3.2 Enhanced OCR Controller with Store Matching

Update ocrController.js to include store matching:

```javascript
const storeMatchingService = require('../services/storeMatchingService');

// Add to processUploadedReceipt function:
exports.processUploadedReceipt = async (req, res) => {
  try {
    // ... existing OCR code ...

    // Find matching store
    let matchedStore = null;
    if (ocrResult.extracted_data.store_name) {
      matchedStore = await storeMatchingService.findMatchingStore(
        ocrResult.extracted_data.store_name
      );
    }

    res.json({
      message: 'Receipt scanned successfully',
      extracted_data: ocrResult.extracted_data,
      confidence: ocrResult.confidence,
      suggestions: {
        product_name: ocrService.suggestProductName(ocrResult.extracted_data),
        purchase_price: ocrResult.extracted_data.total_amount,
        purchase_date: ocrResult.extracted_data.purchase_date,
        store_name: ocrResult.extracted_data.store_name,
        store_id: matchedStore ? matchedStore.store_id : null,
        matched_store: matchedStore,
        currency: ocrResult.extracted_data.currency
      },
      raw_text: ocrResult.raw_text
    });
  } catch (error) {
    console.error('Process uploaded receipt error:', error);
    res.status(500).json({ error: 'Failed to process receipt' });
  }
};
```

### 3.3 Batch OCR Processing

Add ability to scan multiple receipts at once:

```javascript
// In ocrController.js
exports.processBatchReceipts = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];
    
    for (const file of req.files) {
      try {
        const ocrResult = await ocrService.extractReceiptData(file.buffer);
        
        results.push({
          filename: file.originalname,
          success: ocrResult.success,
          extracted_data: ocrResult.extracted_data,
          confidence: ocrResult.confidence
        });
      } catch (error) {
        results.push({
          filename: file.originalname,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Batch processing complete',
      total: req.files.length,
      successful: results.filter(r => r.success).length,
      results
    });
  } catch (error) {
    console.error('Batch processing error:', error);
    res.status(500).json({ error: 'Failed to process batch' });
  }
};

// Add route in ocr.js
router.post('/batch-scan', 
  upload.array('receipts', 10), 
  ocrController.processBatchReceipts
);
```

### 3.4 OCR Quality Improvement Tips

Add image preprocessing for better OCR accuracy:

```javascript
// In ocrService.js
const sharp = require('sharp');

async preprocessImage(imageBuffer) {
  try {
    // Enhance image for better OCR
    const processed = await sharp(imageBuffer)
      .greyscale() // Convert to grayscale
      .normalize() // Normalize contrast
      .sharpen() // Sharpen edges
      .toBuffer();
    
    return processed;
  } catch (error) {
    console.error('Image preprocessing error:', error);
    return imageBuffer; // Return original if preprocessing fails
  }
}

// Use in extractReceiptData:
async extractReceiptData(imageBuffer) {
  try {
    // Preprocess image
    const processedImage = await this.preprocessImage(imageBuffer);
    
    let text = '';
    
    if (this.useGoogleVision) {
      text = await this.extractTextWithGoogleVision(processedImage);
    } else {
      text = await this.extractTextWithTesseract(processedImage);
    }
    
    // ... rest of the code
  }
}
```

---

## Part 4: Testing & Optimization

### 4.1 Test OCR Accuracy

Create test script (test-ocr.js):

```javascript
const ocrService = require('./src/services/ocrService');
const fs = require('fs');

async function testOCR() {
  const testImages = [
    './test-receipts/receipt1.jpg',
    './test-receipts/receipt2.jpg',
    './test-receipts/receipt3.jpg'
  ];

  for (const imagePath of testImages) {
    console.log(`\n\nTesting: ${imagePath}`);
    console.log('='.repeat(50));
    
    const imageBuffer = fs.readFileSync(imagePath);
    const result = await ocrService.extractReceiptData(imageBuffer);
    
    console.log('Confidence:', result.confidence);
    console.log('Extracted Data:', JSON.stringify(result.extracted_data, null, 2));
    console.log('\nRaw Text:');
    console.log(result.raw_text);
  }
}

testOCR().catch(console.error);
```

### 4.2 Performance Optimization

```javascript
// Add caching for frequently scanned receipts
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

async extractReceiptData(imageBuffer) {
  // Generate hash of image
  const crypto = require('crypto');
  const imageHash = crypto
    .createHash('md5')
    .update(imageBuffer)
    .digest('hex');
  
  // Check cache
  const cached = cache.get(imageHash);
  if (cached) {
    console.log('Using cached OCR result');
    return cached;
  }
  
  // Process image
  const result = await this.processImage(imageBuffer);
  
  // Cache result
  cache.set(imageHash, result);
  
  return result;
}
```

### 4.3 Mobile - Offline Mode

Add offline OCR capability using on-device ML:

```javascript
// Install: npm install react-native-ml-kit
import MLKit from 'react-native-ml-kit';

const scanReceiptOffline = async (imageUri) => {
  try {
    const result = await MLKit.textRecognize(imageUri);
    const text = result.text;
    
    // Parse locally (simplified)
    const extractedData = parseTextLocally(text);
    
    return {
      success: true,
      extracted_data: extractedData,
      offline: true
    };
  } catch (error) {
    console.error('Offline OCR error:', error);
    throw error;
  }
};
```

---

## Part 5: Documentation & User Guide

### 5.1 Update README.md

Add OCR section:

```markdown
## OCR Receipt Scanning

Warranty Manager can automatically extract information from receipt photos:

### Supported Data
- Store name and location
- Purchase date
- Product name
- Price and currency
- Tax/VAT information
- Receipt number

### How to Use
1. Tap the scan icon on the home screen
2. Take a photo of your receipt
3. Wait for processing (5-10 seconds)
4. Review and edit extracted data
5. Save the product

### Tips for Best Results
- Ensure good lighting
- Keep receipt flat and straight
- Capture entire receipt in frame
- Avoid shadows and glare
- Use high-resolution camera

### Supported Languages
- English
- Serbian (Latin and Cyrillic)
```

### 5.2 API Documentation (docs/OCR_API.md)

```markdown
# OCR API Documentation

## Endpoints

### POST /api/v1/ocr/scan
Scan uploaded receipt image and extract data.

**Request:**
- Content-Type: multipart/form-data
- Body: receipt (image file)

**Response:**
```json
{
  "message": "Receipt scanned successfully",
  "extracted_data": {
    "store_name": "TEHNOMANIJA",
    "purchase_date": "2024-11-10",
    "total_amount": 89999.00,
    "currency": "RSD",
    "items": [...],
    "confidence": 85
  },
  "suggestions": {
    "product_name": "Samsung Galaxy S23",
    "purchase_price": 89999.00,
    "purchase_date": "2024-11-10",
    "store_name": "TEHNOMANIJA"
  }
}
```

### POST /api/v1/ocr/documents/:id/process
Process existing document.

### POST /api/v1/ocr/batch-scan
Scan multiple receipts at once (max 10).

### GET /api/v1/ocr/history
Get OCR processing history.
```

---

## ✅ What's Complete in v1.1.0:

1. ✅ **Google Cloud Vision Integration** - High accuracy OCR
2. ✅ **Tesseract Fallback** - Free offline alternative
3. ✅ **Smart Data Extraction** - Store, date, price, items
4. ✅ **Confidence Scoring** - 0-100% accuracy indicator
5. ✅ **Store Matching** - Auto-match to existing stores
6. ✅ **Mobile Scanner Screen** - User-friendly interface
7. ✅ **Pre-fill Product Form** - Auto-populate from OCR
8. ✅ **Multi-item Detection** - Extract all items from receipt
9. ✅ **Date Parsing** - Multiple date format support
10. ✅ **Currency Detection** - RSD, EUR support
11. ✅ **Image Preprocessing** - Enhanced OCR accuracy
12. ✅ **Batch Processing** - Scan multiple receipts
13. ✅ **OCR History** - Track all scans

---

## 🚀 Usage Example:

**User Flow:**
1. User taps "Scan Receipt" on home screen
2. Takes photo of receipt
3. App uploads to backend
4. Backend processes with Google Vision/Tesseract
5. Extracts: Store="TEHNOMANIJA", Price=89999 RSD, Date=2024-11-10
6. Matches store to existing database entry
7. Returns suggestions with 85% confidence
8. User reviews data
9. Taps "Use This Data"
10. Product form pre-filled
11. User verifies/edits if needed
12. Saves product with receipt attached

---

## 📊 Comparison: Google Vision vs Tesseract

| Feature | Google Vision | Tesseract |
|---------|--------------|-----------|
| Accuracy | 95%+ | 70-85% |
| Speed | 2-5 sec | 5-10 sec |
| Cost | $1.50/1000 | Free |
| Offline | ❌ | ✅ |
| Languages | 100+ | 100+ |
| Receipt Quality | Excellent | Good |

**Recommendation:** Use Google Vision for production, Tesseract for development/testing.

---

## 🎯 Next Steps for v1.2.0:

- 🌐 Multi-language UI (Serbian/English)
- 📤 Export to PDF/CSV  
- 👨‍👩‍👧 Family sharing
- 📊 Advanced analytics with charts
- 🌙 Dark mode
- 📱 Barcode scanning

**Ready to implement any of these features?**