# Document Upload with Cloud Storage - Complete Implementation

## Overview
We'll implement document upload using **AWS S3** for cloud storage. This includes:
- Image and PDF upload
- Thumbnail generation for images
- Secure signed URLs for viewing
- Multiple documents per product
- Primary document marking

---

## Part 1: Backend Setup - AWS S3 Configuration

### 1.1 Install Dependencies

```bash
cd warranty-app-backend
npm install aws-sdk multer multer-s3 sharp uuid
```

**Packages:**
- `aws-sdk` - AWS SDK for S3 operations
- `multer` - Middleware for handling file uploads
- `multer-s3` - S3 storage engine for Multer
- `sharp` - Image processing for thumbnails
- `uuid` - Generate unique file names

### 1.2 AWS S3 Configuration (src/config/storage.js)

```javascript
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf'
];

// File filter
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'), false);
  }
};

// Configure multer with S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'private', // Files are private
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
        userId: req.user.user_id.toString()
      });
    },
    key: (req, file, cb) => {
      const userId = req.user.user_id;
      const uniqueId = uuidv4();
      const extension = path.extname(file.originalname);
      const fileName = `users/${userId}/documents/${uniqueId}${extension}`;
      cb(null, fileName);
    }
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Generate signed URL for viewing files
const getSignedUrl = (key, expiresIn = 3600) => {
  return s3.getSignedUrl('getObject', {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Expires: expiresIn // URL valid for 1 hour
  });
};

// Delete file from S3
const deleteFile = async (key) => {
  try {
    await s3.deleteObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    }).promise();
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    return false;
  }
};

// Upload file to S3 (for thumbnails)
const uploadToS3 = async (buffer, key, mimetype) => {
  try {
    await s3.putObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'private'
    }).promise();
    return true;
  } catch (error) {
    console.error('S3 upload error:', error);
    return false;
  }
};

module.exports = {
  s3,
  upload,
  getSignedUrl,
  deleteFile,
  uploadToS3
};
```

### 1.3 Image Processing Utility (src/utils/imageProcessor.js)

```javascript
const sharp = require('sharp');

// Generate thumbnail from image
const generateThumbnail = async (imageBuffer, maxWidth = 300, maxHeight = 300) => {
  try {
    const thumbnail = await sharp(imageBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    return thumbnail;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    throw error;
  }
};

// Optimize image before upload
const optimizeImage = async (imageBuffer, quality = 85) => {
  try {
    const optimized = await sharp(imageBuffer)
      .resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality })
      .toBuffer();
    
    return optimized;
  } catch (error) {
    console.error('Image optimization error:', error);
    throw error;
  }
};

module.exports = {
  generateThumbnail,
  optimizeImage
};
```

### 1.4 Document Controller (src/controllers/documentController.js)

```javascript
const { Document, Product } = require('../models');
const { getSignedUrl, deleteFile, uploadToS3 } = require('../config/storage');
const { generateThumbnail } = require('../utils/imageProcessor');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Upload document
exports.uploadDocument = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { document_type, is_primary } = req.body;

    // Verify product belongs to user
    const product = await Product.findOne({
      where: {
        product_id: product_id,
        user_id: req.user.user_id
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const fileKey = file.key;
    const isImage = file.mimetype.startsWith('image/');

    let thumbnailKey = null;

    // Generate thumbnail for images
    if (isImage) {
      try {
        // Download the uploaded image from S3
        const s3Object = await require('../config/storage').s3.getObject({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey
        }).promise();

        // Generate thumbnail
        const thumbnailBuffer = await generateThumbnail(s3Object.Body);
        
        // Upload thumbnail to S3
        thumbnailKey = `users/${req.user.user_id}/thumbnails/${uuidv4()}.jpg`;
        await uploadToS3(thumbnailBuffer, thumbnailKey, 'image/jpeg');
      } catch (error) {
        console.error('Thumbnail generation error:', error);
        // Continue without thumbnail if it fails
      }
    }

    // If marking as primary, unmark all other documents for this product
    if (is_primary === 'true' || is_primary === true) {
      await Document.update(
        { is_primary: false },
        { where: { product_id: product_id } }
      );
    }

    // Create document record
    const document = await Document.create({
      product_id: product_id,
      document_type: document_type || 'receipt',
      cloud_storage_url: fileKey,
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      thumbnail_url: thumbnailKey,
      is_primary: is_primary === 'true' || is_primary === true
    });

    // Generate signed URLs
    const signedUrl = getSignedUrl(fileKey);
    const thumbnailSignedUrl = thumbnailKey ? getSignedUrl(thumbnailKey) : null;

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        ...document.toJSON(),
        cloud_storage_url: signedUrl,
        thumbnail_url: thumbnailSignedUrl
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
};

// Get documents for a product
exports.getProductDocuments = async (req, res) => {
  try {
    const { product_id } = req.params;

    // Verify product belongs to user
    const product = await Product.findOne({
      where: {
        product_id: product_id,
        user_id: req.user.user_id
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const documents = await Document.findAll({
      where: { product_id: product_id },
      order: [['is_primary', 'DESC'], ['upload_date', 'DESC']]
    });

    // Generate signed URLs for all documents
    const documentsWithUrls = documents.map(doc => {
      const docData = doc.toJSON();
      return {
        ...docData,
        cloud_storage_url: getSignedUrl(docData.cloud_storage_url),
        thumbnail_url: docData.thumbnail_url ? getSignedUrl(docData.thumbnail_url) : null
      };
    });

    res.json({ documents: documentsWithUrls });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

// Get single document
exports.getDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findOne({
      where: { document_id: id },
      include: [{
        model: Product,
        where: { user_id: req.user.user_id },
        attributes: ['product_id', 'product_name']
      }]
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const docData = document.toJSON();
    res.json({
      document: {
        ...docData,
        cloud_storage_url: getSignedUrl(docData.cloud_storage_url),
        thumbnail_url: docData.thumbnail_url ? getSignedUrl(docData.thumbnail_url) : null
      }
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findOne({
      where: { document_id: id },
      include: [{
        model: Product,
        where: { user_id: req.user.user_id }
      }]
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete files from S3
    await deleteFile(document.cloud_storage_url);
    if (document.thumbnail_url) {
      await deleteFile(document.thumbnail_url);
    }

    // Delete database record
    await document.destroy();

    res.json({ 
      message: 'Document deleted successfully',
      document_id: id
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

// Mark document as primary
exports.markAsPrimary = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findOne({
      where: { document_id: id },
      include: [{
        model: Product,
        where: { user_id: req.user.user_id }
      }]
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Unmark all documents for this product
    await Document.update(
      { is_primary: false },
      { where: { product_id: document.product_id } }
    );

    // Mark this document as primary
    await document.update({ is_primary: true });

    res.json({
      message: 'Document marked as primary',
      document
    });
  } catch (error) {
    console.error('Mark as primary error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
};
```

### 1.5 Document Routes (src/routes/documents.js)

```javascript
const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../config/storage');

// All routes require authentication
router.use(authenticateToken);

// Upload document for a product
router.post(
  '/products/:product_id/documents',
  upload.single('file'),
  documentController.uploadDocument
);

// Get all documents for a product
router.get('/products/:product_id/documents', documentController.getProductDocuments);

// Get single document
router.get('/:id', documentController.getDocument);

// Delete document
router.delete('/:id', documentController.deleteDocument);

// Mark document as primary
router.put('/:id/primary', documentController.markAsPrimary);

module.exports = router;
```

### 1.6 Update Main App (src/app.js)

```javascript
const documentRoutes = require('./routes/documents');

// Add after other routes
app.use('/api/v1/documents', documentRoutes);
```

### 1.7 Update Environment Variables (.env)

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=eu-central-1
AWS_BUCKET_NAME=warranty-app-documents
```

### 1.8 AWS S3 Bucket Setup

**Create S3 Bucket via AWS Console:**

1. Go to AWS S3 Console
2. Click "Create bucket"
3. Bucket name: `warranty-app-documents` (must be globally unique)
4. Region: Choose closest to Serbia (eu-central-1 - Frankfurt)
5. Block all public access: ✅ (files will use signed URLs)
6. Bucket versioning: Disabled (optional: enable for backup)
7. Create bucket

**Create IAM User with S3 Access:**

1. Go to IAM Console → Users → Add User
2. User name: `warranty-app-uploader`
3. Access type: Programmatic access
4. Attach policy: `AmazonS3FullAccess` (or create custom policy)
5. Save Access Key ID and Secret Access Key
6. Add to `.env` file

**Custom IAM Policy (Recommended - More Secure):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::warranty-app-documents/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::warranty-app-documents"
    }
  ]
}
```

---

## Part 2: Mobile App - Document Upload UI

### 2.1 Documents API (src/api/documents.js)

```javascript
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
```

### 2.2 Updated Add Product Screen with Document Upload

```javascript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Menu, IconButton, Chip } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { productsApi } from '../api/products';
import { documentsApi } from '../api/documents';
import { categoriesApi } from '../api/categories';
import { storesApi } from '../api/stores';

export default function AddProductScreen({ navigation }) {
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [price, setPrice] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [storeMenuVisible, setStoreMenuVisible] = useState(false);

  useEffect(() => {
    loadCategoriesAndStores();
    requestPermissions();
    
    const today = new Date().toISOString().split('T')[0];
    setPurchaseDate(today);
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required to upload receipts');
    }
  };

  const loadCategoriesAndStores = async () => {
    try {
      const [categoriesData, storesData] = await Promise.all([
        categoriesApi.getCategories(),
        storesApi.getStores()
      ]);
      setCategories(categoriesData.categories || []);
      setStores(storesData.stores || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      addDocument({
        uri: result.assets[0].uri,
        fileName: result.assets[0].fileName || `photo_${Date.now()}.jpg`,
        type: result.assets[0].type || 'image/jpeg'
      });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      addDocument({
        uri: result.assets[0].uri,
        fileName: `receipt_${Date.now()}.jpg`,
        type: 'image/jpeg'
      });
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true
    });

    if (result.type === 'success') {
      addDocument({
        uri: result.uri,
        fileName: result.name,
        type: result.mimeType || 'application/pdf'
      });
    }
  };

  const addDocument = (file) => {
    setDocuments([...documents, file]);
  };

  const removeDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!productName.trim()) {
      Alert.alert('Error', 'Please enter product name');
      return;
    }

    if (!purchaseDate) {
      Alert.alert('Error', 'Please enter purchase date');
      return;
    }

    setIsLoading(true);
    
    try {
      // Step 1: Create product
      const productData = {
        product_name: productName.trim(),
        brand: brand.trim() || null,
        purchase_date: purchaseDate,
        purchase_price: price ? parseFloat(price) : null,
        currency: 'RSD',
        warranty_duration_months: parseInt(warrantyMonths) || 12,
        category_id: selectedCategory,
        store_id: selectedStore
      };

      const result = await productsApi.createProduct(productData);
      const newProductId = result.product.product_id;

      // Step 2: Upload documents if any
      if (documents.length > 0) {
        setIsUploading(true);
        
        for (let i = 0; i < documents.length; i++) {
          try {
            await documentsApi.uploadDocument(
              newProductId,
              documents[i],
              'receipt',
              i === 0 // First document is primary
            );
          } catch (error) {
            console.error(`Error uploading document ${i + 1}:`, error);
            // Continue with other uploads even if one fails
          }
        }
      }

      Alert.alert('Success', 'Product added successfully!', [
        { 
          text: 'OK', 
          onPress: () => navigation.goBack() 
        }
      ]);
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product. Please try again.');
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const renderDocument = (doc, index) => {
    const isPDF = doc.type === 'application/pdf';
    
    return (
      <View key={index} style={styles.documentItem}>
        {isPDF ? (
          <View style={styles.pdfPreview}>
            <Text style={styles.pdfIcon}>📄</Text>
          </View>
        ) : (
          <Image source={{ uri: doc.uri }} style={styles.documentPreview} />
        )}
        <View style={styles.documentInfo}>
          <Text style={styles.documentName} numberOfLines={1}>
            {doc.fileName}
          </Text>
          {index === 0 && (
            <Chip style={styles.primaryChip} compact>Primary</Chip>
          )}
        </View>
        <IconButton
          icon="close"
          size={20}
          onPress={() => removeDocument(index)}
        />
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <TextInput
          label="Product Name *"
          value={productName}
          onChangeText={setProductName}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Brand"
          value={brand}
          onChangeText={setBrand}
          mode="outlined"
          style={styles.input}
        />

        <Menu
          visible={categoryMenuVisible}
          onDismiss={() => setCategoryMenuVisible(false)}
          anchor={
            <TouchableOpacity onPress={() => setCategoryMenuVisible(true)}>
              <TextInput
                label="Category"
                value={categories.find(c => c.category_id === selectedCategory)?.category_name || ''}
                mode="outlined"
                style={styles.input}
                editable={false}
                right={<TextInput.Icon icon="chevron-down" />}
              />
            </TouchableOpacity>
          }
        >
          {categories.map((category) => (
            <Menu.Item
              key={category.category_id}
              onPress={() => {
                setSelectedCategory(category.category_id);
                setCategoryMenuVisible(false);
              }}
              title={category.category_name}
            />
          ))}
        </Menu>

        <Menu
          visible={storeMenuVisible}
          onDismiss={() => setStoreMenuVisible(false)}
          anchor={
            <TouchableOpacity onPress={() => setStoreMenuVisible(true)}>
              <TextInput
                label="Store"
                value={stores.find(s => s.store_id === selectedStore)?.store_name || ''}
                mode="outlined"
                style={styles.input}
                editable={false}
                right={<TextInput.Icon icon="chevron-down" />}
              />
            </TouchableOpacity>
          }
        >
          {stores.map((store) => (
            <Menu.Item
              key={store.store_id}
              onPress={() => {
                setSelectedStore(store.store_id);
                setStoreMenuVisible(false);
              }}
              title={store.store_name}
            />
          ))}
        </Menu>

        <TextInput
          label="Purchase Date (YYYY-MM-DD) *"
          value={purchaseDate}
          onChangeText={setPurchaseDate}
          mode="outlined"
          placeholder="2024-11-10"
          style={styles.input}
        />

        <TextInput
          label="Price (RSD)"
          value={price}
          onChangeText={setPrice}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />

        <TextInput
          label="Warranty Duration (months)"
          value={warrantyMonths}
          onChangeText={setWarrantyMonths}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Documents ({documents.length})
        </Text>

        {documents.map((doc, index) => renderDocument(doc, index))}

        <View style={styles.documentButtons}>
          <Button 
            mode="outlined" 
            onPress={takePhoto}
            icon="camera"
            style={styles.documentButton}
          >
            Camera
          </Button>
          <Button 
            mode="outlined" 
            onPress={pickImage}
            icon="image"
            style={styles.documentButton}
          >
            Gallery
          </Button>
          <Button 
            mode="outlined" 
            onPress={pickDocument}
            icon="file"
            style={styles.documentButton}
          >
            PDF
          </Button>
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isLoading || isUploading}
          disabled={isLoading || isUploading}
          style={styles.submitButton}
        >
          {isUploading ? 'Uploading...' : 'Save Product'}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  form: {
    padding: 16
  },
  input: {
    marginBottom: 16
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 16
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8
  },
  documentPreview: {
    width: 60,
    height: 60,
    borderRadius: 8
  },
  pdfPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  pdfIcon: {
    fontSize: 30
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12
  },
  documentName: {
    fontSize: 14,
    marginBottom: 4
  },
  primaryChip: {
    alignSelf: 'flex-start',
    height: 24,
    backgroundColor: '#4caf5020'
  },
  documentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  documentButton: {
    flex: 1,
    marginHorizontal: 4
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 8
  }
});
```

### 2.3 Install Required Mobile Dependencies

```bash
cd warranty-app
npx expo install expo-document-picker
```

### 2.4 Documents Management Screen (src/screens/DocumentsScreen.js)

```javascript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, Alert, TouchableOpacity, Linking } from 'react-native';
import { Text, Appbar, Card, IconButton, FAB, Dialog, Portal, Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { documentsApi } from '../api/documents';

export default function DocumentsScreen({ navigation, route }) {
  const { productId, productName } = route.params;
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogVisible, setUploadDialogVisible] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [productId]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await documentsApi.getProductDocuments(productId);
      setDocuments(data.documents);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (file, documentType = 'receipt') => {
    try {
      setIsUploading(true);
      setUploadDialogVisible(false);

      const isPrimary = documents.length === 0; // First document is primary
      await documentsApi.uploadDocument(productId, file, documentType, isPrimary);
      
      Alert.alert('Success', 'Document uploaded successfully');
      loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadDocument({
        uri: result.assets[0].uri,
        fileName: `receipt_${Date.now()}.jpg`,
        type: 'image/jpeg'
      });
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadDocument({
        uri: result.assets[0].uri,
        fileName: result.assets[0].fileName || `photo_${Date.now()}.jpg`,
        type: result.assets[0].type || 'image/jpeg'
      });
    }
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true
    });

    if (result.type === 'success') {
      uploadDocument({
        uri: result.uri,
        fileName: result.name,
        type: result.mimeType || 'application/pdf'
      });
    }
  };

  const handleDeleteDocument = (documentId) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await documentsApi.deleteDocument(documentId);
              Alert.alert('Success', 'Document deleted');
              loadDocuments();
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document');
            }
          }
        }
      ]
    );
  };

  const handleMarkAsPrimary = async (documentId) => {
    try {
      await documentsApi.markAsPrimary(documentId);
      Alert.alert('Success', 'Document marked as primary');
      loadDocuments();
    } catch (error) {
      console.error('Error marking as primary:', error);
      Alert.alert('Error', 'Failed to update document');
    }
  };

  const handleViewDocument = (url) => {
    Linking.openURL(url);
  };

  const renderDocument = ({ item }) => {
    const isPDF = item.mime_type === 'application/pdf';
    const uploadDate = new Date(item.upload_date).toLocaleDateString('sr-RS');

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.documentHeader}>
            <View style={styles.documentInfo}>
              <Text variant="titleMedium">{item.file_name}</Text>
              <Text variant="bodySmall" style={styles.documentMeta}>
                {item.document_type} • {uploadDate}
              </Text>
              {item.is_primary && (
                <Text variant="bodySmall" style={styles.primaryBadge}>
                  ⭐ Primary Document
                </Text>
              )}
            </View>
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteDocument(item.document_id)}
            />
          </View>

          <TouchableOpacity 
            onPress={() => handleViewDocument(item.cloud_storage_url)}
            style={styles.previewContainer}
          >
            {isPDF ? (
              <View style={styles.pdfPlaceholder}>
                <Text style={styles.pdfIcon}>📄</Text>
                <Text>Tap to view PDF</Text>
              </View>
            ) : (
              <Image 
                source={{ uri: item.thumbnail_url || item.cloud_storage_url }} 
                style={styles.preview}
                resizeMode="cover"
              />
            )}
          </TouchableOpacity>

          <View style={styles.actions}>
            <Button 
              mode="outlined" 
              onPress={() => handleViewDocument(item.cloud_storage_url)}
              icon="eye"
              style={styles.actionButton}
            >
              View
            </Button>
            {!item.is_primary && (
              <Button 
                mode="outlined" 
                onPress={() => handleMarkAsPrimary(item.document_id)}
                icon="star"
                style={styles.actionButton}
              >
                Set Primary
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Documents" subtitle={productName} />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading documents...</Text>
        </View>
      ) : documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No documents yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Add receipts, warranty cards, or manuals
          </Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.document_id.toString()}
          renderItem={renderDocument}
          contentContainerStyle={styles.list}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setUploadDialogVisible(true)}
        loading={isUploading}
      />

      <Portal>
        <Dialog visible={uploadDialogVisible} onDismiss={() => setUploadDialogVisible(false)}>
          <Dialog.Title>Upload Document</Dialog.Title>
          <Dialog.Content>
            <Button 
              mode="contained" 
              onPress={handleTakePhoto}
              icon="camera"
              style={styles.dialogButton}
            >
              Take Photo
            </Button>
            <Button 
              mode="contained" 
              onPress={handlePickImage}
              icon="image"
              style={styles.dialogButton}
            >
              Choose from Gallery
            </Button>
            <Button 
              mode="contained" 
              onPress={handlePickDocument}
              icon="file-pdf-box"
              style={styles.dialogButton}
            >
              Choose PDF
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setUploadDialogVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
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
    color: '#666'
  },
  list: {
    padding: 16
  },
  card: {
    marginBottom: 16,
    elevation: 2
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  documentInfo: {
    flex: 1
  },
  documentMeta: {
    color: '#666',
    marginTop: 4,
    textTransform: 'capitalize'
  },
  primaryBadge: {
    color: '#ff9800',
    marginTop: 4
  },
  previewContainer: {
    marginVertical: 12
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 8
  },
  pdfPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  pdfIcon: {
    fontSize: 48,
    marginBottom: 8
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0
  },
  dialogButton: {
    marginBottom: 12
  }
});
```

### 2.5 Update Product Detail Screen to Show Documents

Add this section to ProductDetailScreen.js after the Store Information Card:

```javascript
// Add import at top
import { documentsApi } from '../api/documents';

// Add to existing code in ProductDetailScreen.js, in the ScrollView after Store card:

{/* Documents Card - Updated */}
{product.Documents && product.Documents.length > 0 && (
  <Card style={styles.card}>
    <Card.Content>
      <View style={styles.cardHeaderRow}>
        <Text variant="titleMedium" style={styles.cardTitle}>
          Documents ({product.Documents.length})
        </Text>
        <Button 
          mode="text" 
          onPress={() => navigation.navigate('Documents', { 
            productId: product.product_id,
            productName: product.product_name 
          })}
        >
          Manage
        </Button>
      </View>
      
      {product.Documents.slice(0, 3).map((doc) => (
        <TouchableOpacity
          key={doc.document_id}
          style={styles.documentItem}
          onPress={() => Linking.openURL(doc.cloud_storage_url)}
        >
          {doc.thumbnail_url ? (
            <Image 
              source={{ uri: doc.thumbnail_url }} 
              style={styles.thumbnail}
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Text style={styles.pdfIcon}>📄</Text>
            </View>
          )}
          <View style={styles.documentInfo}>
            <Text variant="bodyMedium" numberOfLines={1}>
              {doc.file_name}
            </Text>
            <Text variant="bodySmall" style={styles.documentType}>
              {doc.document_type}
            </Text>
            {doc.is_primary && (
              <Chip style={styles.primaryChip} compact>Primary</Chip>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {product.Documents.length > 3 && (
        <Button 
          mode="outlined" 
          onPress={() => navigation.navigate('Documents', { 
            productId: product.product_id,
            productName: product.product_name 
          })}
          style={styles.viewAllButton}
        >
          View All {product.Documents.length} Documents
        </Button>
      )}
    </Card.Content>
  </Card>
)}

{/* Add to styles object: */}
cardHeaderRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12
},
thumbnailPlaceholder: {
  width: 60,
  height: 60,
  borderRadius: 8,
  backgroundColor: '#f5f5f5',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#ddd'
},
pdfIcon: {
  fontSize: 24
},
viewAllButton: {
  marginTop: 12
}
```

### 2.6 Update App Navigator

```javascript
import DocumentsScreen from '../screens/DocumentsScreen';

// Add inside authenticated stack:
<Stack.Screen 
  name="Documents" 
  component={DocumentsScreen}
  options={{ headerShown: false }}
/>
```

---

## Part 3: Testing & Usage

### 3.1 Test Backend API with Postman

**Upload Document:**
```bash
# Using curl
curl -X POST http://localhost:3000/api/v1/documents/products/1/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/receipt.jpg" \
  -F "document_type=receipt" \
  -F "is_primary=true"
```

**Get Documents:**
```bash
curl -X GET http://localhost:3000/api/v1/documents/products/1/documents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Delete Document:**
```bash
curl -X DELETE http://localhost:3000/api/v1/documents/5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3.2 AWS S3 Folder Structure

After uploading, your S3 bucket will look like:
```
warranty-app-documents/
├── users/
│   ├── 1/
│   │   ├── documents/
│   │   │   ├── uuid1.jpg
│   │   │   ├── uuid2.pdf
│   │   │   └── uuid3.jpg
│   │   └── thumbnails/
│   │       ├── uuid1-thumb.jpg
│   │       └── uuid3-thumb.jpg
│   ├── 2/
│   │   ├── documents/
│   │   └── thumbnails/
```

### 3.3 Mobile App Testing Flow

1. **Add Product with Documents:**
   - Open app → Add Product
   - Fill product details
   - Tap "Camera" to take receipt photo
   - Or "Gallery" to choose existing photo
   - Or "PDF" to upload PDF warranty
   - Submit - product and documents upload

2. **View Product Documents:**
   - Open product details
   - Scroll to Documents section
   - See thumbnails and document count
   - Tap "Manage" to open Documents screen

3. **Manage Documents:**
   - View all documents for product
   - Tap document to view full size/PDF
   - Mark any document as primary
   - Delete unwanted documents
   - Add more documents via FAB button

---

## Part 4: Alternative - Using Cloudinary (Simpler Option)

If you prefer Cloudinary over AWS S3:

### 4.1 Install Cloudinary SDK

```bash
npm install cloudinary multer
```

### 4.2 Cloudinary Configuration (src/config/cloudinary.js)

```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'warranty-app',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
    transformation: [{ width: 2000, height: 2000, crop: 'limit' }]
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = { cloudinary, upload };
```

### 4.3 Environment Variables for Cloudinary

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Advantages of Cloudinary:**
- ✅ Automatic thumbnail generation
- ✅ Image optimization built-in
- ✅ Free tier: 25GB storage, 25GB bandwidth
- ✅ Easier setup than AWS S3
- ✅ Built-in CDN

**Advantages of AWS S3:**
- ✅ More control over storage
- ✅ Better for large scale
- ✅ Cheaper at scale
- ✅ Can integrate with other AWS services

---

## Part 5: Security Best Practices

### 5.1 File Validation

Add to document controller:

```javascript
const validateFile = (file) => {
  // Check file size
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File too large. Max size is 10MB');
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type');
  }

  return true;
};
```

### 5.2 Rate Limiting

Add to protect upload endpoint:

```javascript
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per 15 minutes
  message: 'Too many uploads, please try again later'
});

// Use in routes
router.post('/products/:product_id/documents', 
  authenticateToken, 
  uploadLimiter,
  upload.single('file'),
  documentController.uploadDocument
);
```

### 5.3 Virus Scanning (Production)

For production, integrate ClamAV or AWS Macie:

```javascript
const ClamScan = require('clamscan');

const scanFile = async (filePath) => {
  const clamscan = await new ClamScan().init();
  const { isInfected, viruses } = await clamscan.isInfected(filePath);
  
  if (isInfected) {
    throw new Error(`File infected: ${viruses.join(', ')}`);
  }
  
  return true;
};
```

---

## Part 6: Optimization Tips

### 6.1 Image Compression on Mobile

Add to AddProductScreen:

```javascript
import * as ImageManipulator from 'expo-image-manipulator';

const compressImage = async (uri) => {
  const manipResult = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1920 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return manipResult.uri;
};

// Use before upload
const compressedUri = await compressImage(result.assets[0].uri);
```

### 6.2 Progress Indicator

Add upload progress:

```javascript
const uploadWithProgress = async (productId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post(`/documents/products/${productId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      setUploadProgress(percentCompleted);
    }
  });
};
```

### 6.3 Batch Upload

For multiple documents:

```javascript
const uploadMultipleDocuments = async (productId, files) => {
  const uploads = files.map((file, index) => 
    documentsApi.uploadDocument(
      productId, 
      file, 
      'receipt', 
      index === 0
    )
  );
  
  return Promise.all(uploads);
};
```

---

## ✅ What's Complete:

1. ✅ **AWS S3 Integration** - Full cloud storage setup
2. ✅ **Image Upload** - Camera, gallery, and file picker
3. ✅ **PDF Support** - Upload and view PDF documents
4. ✅ **Thumbnail Generation** - Automatic thumbnails for images
5. ✅ **Signed URLs** - Secure file access with expiring URLs
6. ✅ **Multiple Documents** - Support for multiple files per product
7. ✅ **Primary Document** - Mark main receipt/warranty
8. ✅ **Document Management** - View, delete, set primary
9. ✅ **Mobile UI** - Complete upload and management interface
10. ✅ **Security** - File validation, private storage, signed URLs

---

## 🚀 Next Steps:

Now you can implement:

1. **OCR Receipt Scanning** - Auto-extract data from receipts
2. **Push Notifications** - Warranty expiry reminders
3. **Export/Backup** - Export products to PDF/CSV
4. **Offline Mode** - Cache products locally
5. **Sharing** - Share warranty info with family

**Which feature would you like next?**