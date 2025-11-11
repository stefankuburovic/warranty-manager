# PDF Export with Receipt Images - v1.3.0

## Overview
Generate professional PDF reports containing warranty information and receipt images. Users can export individual products or all warranties at once.

**Features:**
- Single product PDF export
- All warranties PDF export (bulk)
- Embedded receipt images
- Multi-language support (EN/SR)
- Professional formatting
- Shareable via email/messaging
- Print-friendly layout

---

## Part 1: Backend - PDF Generation

### 1.1 Install Dependencies

```bash
cd warranty-app-backend
npm install pdfkit sharp
```

**Packages:**
- `pdfkit` - PDF generation library
- `sharp` - Image processing (already installed)

### 1.2 PDF Service (src/services/pdfService.js)

```javascript
const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const { getSignedUrl } = require('../config/storage');

class PDFService {
  
  // Generate PDF for single product
  async generateProductPDF(product, user) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 50,
          info: {
            Title: `Warranty - ${product.product_name}`,
            Author: 'Warranty Manager',
            Subject: 'Product Warranty Information'
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        await this.addHeader(doc, user);
        
        // Product Information
        await this.addProductInfo(doc, product);
        
        // Warranty Status
        await this.addWarrantyStatus(doc, product);
        
        // Store Information
        if (product.Store) {
          await this.addStoreInfo(doc, product.Store);
        }
        
        // Receipt Image
        if (product.Documents && product.Documents.length > 0) {
          await this.addReceiptImage(doc, product.Documents[0]);
        }
        
        // Footer
        this.addFooter(doc);
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate PDF for multiple products
  async generateBulkPDF(products, user) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 50,
          info: {
            Title: 'Warranty Report',
            Author: 'Warranty Manager',
            Subject: 'All Warranties'
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Cover Page
        await this.addCoverPage(doc, user, products.length);
        
        // Table of Contents
        doc.addPage();
        await this.addTableOfContents(doc, products);
        
        // Individual Product Pages
        for (let i = 0; i < products.length; i++) {
          doc.addPage();
          await this.addHeader(doc, user);
          await this.addProductInfo(doc, products[i]);
          await this.addWarrantyStatus(doc, products[i]);
          
          if (products[i].Store) {
            await this.addStoreInfo(doc, products[i].Store);
          }
          
          if (products[i].Documents && products[i].Documents.length > 0) {
            await this.addReceiptImage(doc, products[i].Documents[0]);
          }
        }
        
        // Summary Page
        doc.addPage();
        await this.addSummaryPage(doc, products);
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Add header with logo and user info
  async addHeader(doc, user) {
    const y = 50;
    
    // App Title
    doc.fontSize(20)
       .fillColor('#6200ee')
       .text('Warranty Manager', 50, y, { align: 'left' });
    
    // User Info
    doc.fontSize(10)
       .fillColor('#666')
       .text(user.full_name, 400, y, { align: 'right' })
       .text(user.email, 400, y + 15, { align: 'right' });
    
    // Date
    doc.fontSize(9)
       .text(`Generated: ${new Date().toLocaleDateString('en-US')}`, 400, y + 30, { align: 'right' });
    
    // Line separator
    doc.moveTo(50, y + 50)
       .lineTo(545, y + 50)
       .strokeColor('#e0e0e0')
       .stroke();
    
    doc.moveDown(3);
  }

  // Add product information section
  async addProductInfo(doc, product) {
    const y = doc.y + 20;
    
    // Product Name (Title)
    doc.fontSize(18)
       .fillColor('#000')
       .text(product.product_name, 50, y);
    
    doc.moveDown(0.5);
    
    // Brand
    if (product.brand) {
      doc.fontSize(14)
         .fillColor('#666')
         .text(product.brand);
    }
    
    doc.moveDown(1.5);
    
    // Details Grid
    const startY = doc.y;
    const leftCol = 50;
    const rightCol = 300;
    let currentY = startY;
    
    doc.fontSize(10).fillColor('#666');
    
    // Purchase Date
    doc.text('Purchase Date:', leftCol, currentY);
    doc.fillColor('#000')
       .text(new Date(product.purchase_date).toLocaleDateString('en-US'), leftCol + 120, currentY);
    currentY += 20;
    
    // Purchase Price
    if (product.purchase_price) {
      doc.fillColor('#666')
         .text('Purchase Price:', leftCol, currentY);
      doc.fillColor('#000')
         .text(`${product.purchase_price} ${product.currency}`, leftCol + 120, currentY);
      currentY += 20;
    }
    
    // Category
    if (product.Category) {
      doc.fillColor('#666')
         .text('Category:', leftCol, currentY);
      doc.fillColor('#000')
         .text(product.Category.category_name, leftCol + 120, currentY);
      currentY += 20;
    }
    
    // Model Number
    if (product.model_number) {
      doc.fillColor('#666')
         .text('Model Number:', leftCol, currentY);
      doc.fillColor('#000')
         .text(product.model_number, leftCol + 120, currentY);
      currentY += 20;
    }
    
    // Serial Number
    if (product.serial_number) {
      doc.fillColor('#666')
         .text('Serial Number:', leftCol, currentY);
      doc.fillColor('#000')
         .text(product.serial_number, leftCol + 120, currentY);
      currentY += 20;
    }
    
    doc.y = currentY + 10;
  }

  // Add warranty status section
  async addWarrantyStatus(doc, product) {
    const y = doc.y + 10;
    
    // Section Title
    doc.fontSize(14)
       .fillColor('#000')
       .text('Warranty Information', 50, y);
    
    doc.moveDown(1);
    
    const startY = doc.y;
    const today = new Date();
    const warrantyEnd = new Date(product.warranty_end_date);
    const daysRemaining = Math.ceil((warrantyEnd - today) / (1000 * 60 * 60 * 24));
    const isExpired = daysRemaining < 0;
    
    // Warranty Duration
    doc.fontSize(10)
       .fillColor('#666')
       .text('Warranty Duration:', 50, startY);
    doc.fillColor('#000')
       .text(`${product.warranty_duration_months} months`, 170, startY);
    
    // Warranty End Date
    doc.fillColor('#666')
       .text('Warranty Expires:', 50, startY + 20);
    doc.fillColor('#000')
       .text(warrantyEnd.toLocaleDateString('en-US'), 170, startY + 20);
    
    // Status Badge
    const statusY = startY + 45;
    const statusColor = isExpired ? '#f44336' : daysRemaining <= 30 ? '#ff9800' : '#4caf50';
    const statusText = isExpired ? 'EXPIRED' : daysRemaining <= 30 ? 'EXPIRING SOON' : 'ACTIVE';
    
    doc.roundedRect(50, statusY, 120, 30, 5)
       .fillAndStroke(statusColor, statusColor);
    
    doc.fontSize(12)
       .fillColor('#fff')
       .text(statusText, 50, statusY + 8, { width: 120, align: 'center' });
    
    if (!isExpired) {
      doc.fontSize(10)
         .fillColor('#666')
         .text(`${daysRemaining} days remaining`, 180, statusY + 10);
    }
    
    doc.y = statusY + 50;
  }

  // Add store information section
  async addStoreInfo(doc, store) {
    const y = doc.y + 10;
    
    // Section Title
    doc.fontSize(14)
       .fillColor('#000')
       .text('Store Information', 50, y);
    
    doc.moveDown(1);
    
    const startY = doc.y;
    
    doc.fontSize(10);
    
    // Store Name
    doc.fillColor('#666').text('Store:', 50, startY);
    doc.fillColor('#000').text(store.store_name, 170, startY);
    
    // Store Chain
    if (store.store_chain) {
      doc.fillColor('#666').text('Chain:', 50, startY + 20);
      doc.fillColor('#000').text(store.store_chain, 170, startY + 20);
    }
    
    // City
    if (store.city) {
      doc.fillColor('#666').text('City:', 50, startY + 40);
      doc.fillColor('#000').text(store.city, 170, startY + 40);
    }
    
    // Address
    if (store.address) {
      doc.fillColor('#666').text('Address:', 50, startY + 60);
      doc.fillColor('#000').text(store.address, 170, startY + 60, { width: 300 });
    }
    
    doc.y = startY + 90;
  }

  // Add receipt image
  async addReceiptImage(doc, document) {
    try {
      const y = doc.y + 20;
      
      // Check if we have enough space, otherwise add new page
      if (y > 650) {
        doc.addPage();
        doc.y = 50;
      }
      
      // Section Title
      doc.fontSize(14)
         .fillColor('#000')
         .text('Receipt Image', 50, doc.y);
      
      doc.moveDown(1);
      
      // Download image from S3
      const s3 = require('../config/storage').s3;
      const s3Object = await s3.getObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: document.cloud_storage_url
      }).promise();
      
      // Process image - resize to fit page
      const processedImage = await sharp(s3Object.Body)
        .resize(495, 400, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      // Add image to PDF
      const imageY = doc.y;
      doc.image(processedImage, 50, imageY, { 
        fit: [495, 400],
        align: 'center'
      });
      
      // Update y position
      doc.y = imageY + 410;
      
    } catch (error) {
      console.error('Error adding receipt image:', error);
      // Continue without image if error
      doc.fontSize(10)
         .fillColor('#999')
         .text('Receipt image not available', 50, doc.y + 20);
      doc.moveDown(2);
    }
  }

  // Add cover page
  async addCoverPage(doc, user, productCount) {
    // Title
    doc.fontSize(30)
       .fillColor('#6200ee')
       .text('Warranty Report', 50, 200, { align: 'center' });
    
    doc.moveDown(2);
    
    // User Info
    doc.fontSize(16)
       .fillColor('#000')
       .text(user.full_name, { align: 'center' });
    
    doc.fontSize(12)
       .fillColor('#666')
       .text(user.email, { align: 'center' });
    
    doc.moveDown(3);
    
    // Summary Box
    const boxY = doc.y;
    doc.roundedRect(150, boxY, 295, 100, 10)
       .fillAndStroke('#f5f5f5', '#e0e0e0');
    
    doc.fontSize(14)
       .fillColor('#000')
       .text(`Total Products: ${productCount}`, 150, boxY + 20, { width: 295, align: 'center' });
    
    doc.fontSize(12)
       .fillColor('#666')
       .text(`Generated: ${new Date().toLocaleDateString('en-US', { 
         year: 'numeric', 
         month: 'long', 
         day: 'numeric' 
       })}`, 150, boxY + 50, { width: 295, align: 'center' });
    
    // Footer
    doc.fontSize(10)
       .fillColor('#999')
       .text('Warranty Manager', 50, 750, { align: 'center' })
       .text('Keep track of all your warranties', { align: 'center' });
  }

  // Add table of contents
  async addTableOfContents(doc, products) {
    doc.fontSize(20)
       .fillColor('#000')
       .text('Table of Contents', 50, 100);
    
    doc.moveDown(2);
    
    doc.fontSize(10);
    
    products.forEach((product, index) => {
      const y = doc.y;
      const pageNum = index + 4; // Adjust based on cover + TOC pages
      
      doc.fillColor('#000')
         .text(`${index + 1}. ${product.product_name}`, 50, y);
      
      doc.fillColor('#666')
         .text(`Page ${pageNum}`, 500, y, { align: 'right' });
      
      if (product.brand) {
        doc.fontSize(9)
           .fillColor('#999')
           .text(product.brand, 70, y + 12);
      }
      
      doc.moveDown(1.5);
      doc.fontSize(10);
    });
  }

  // Add summary page
  async addSummaryPage(doc, products) {
    doc.fontSize(20)
       .fillColor('#000')
       .text('Summary', 50, 100);
    
    doc.moveDown(2);
    
    // Calculate statistics
    const totalProducts = products.length;
    const activeWarranties = products.filter(p => 
      new Date(p.warranty_end_date) >= new Date()
    ).length;
    const expiredWarranties = totalProducts - activeWarranties;
    const totalSpent = products.reduce((sum, p) => sum + (p.purchase_price || 0), 0);
    
    // Statistics Grid
    doc.fontSize(12);
    let y = doc.y;
    
    doc.fillColor('#666').text('Total Products:', 50, y);
    doc.fillColor('#000').text(totalProducts.toString(), 200, y);
    y += 30;
    
    doc.fillColor('#666').text('Active Warranties:', 50, y);
    doc.fillColor('#4caf50').text(activeWarranties.toString(), 200, y);
    y += 30;
    
    doc.fillColor('#666').text('Expired Warranties:', 50, y);
    doc.fillColor('#f44336').text(expiredWarranties.toString(), 200, y);
    y += 30;
    
    doc.fillColor('#666').text('Total Spent:', 50, y);
    doc.fillColor('#000').text(`${totalSpent.toLocaleString()} RSD`, 200, y);
    
    doc.moveDown(4);
    
    // Products by Category
    doc.fontSize(14)
       .fillColor('#000')
       .text('Products by Category', 50, doc.y);
    
    doc.moveDown(1);
    
    const categoryCount = {};
    products.forEach(p => {
      if (p.Category) {
        const name = p.Category.category_name;
        categoryCount[name] = (categoryCount[name] || 0) + 1;
      }
    });
    
    doc.fontSize(10);
    Object.entries(categoryCount).forEach(([category, count]) => {
      doc.fillColor('#666').text(`${category}:`, 50, doc.y);
      doc.fillColor('#000').text(`${count} item${count > 1 ? 's' : ''}`, 200, doc.y);
      doc.moveDown(0.8);
    });
  }

  // Add footer to each page
  addFooter(doc) {
    const pages = doc.bufferedPageRange();
    
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Page number
      doc.fontSize(9)
         .fillColor('#999')
         .text(
           `Page ${i + 1} of ${pages.count}`,
           50,
           doc.page.height - 50,
           { align: 'center' }
         );
      
      // App name
      doc.text(
        'Generated by Warranty Manager',
        50,
        doc.page.height - 35,
        { align: 'center' }
      );
    }
  }
}

module.exports = new PDFService();
```

### 1.3 Export Controller (src/controllers/exportController.js)

```javascript
const pdfService = require('../services/pdfService');
const { Product, Store, Category, Document } = require('../models');

// Export single product as PDF
exports.exportProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Get product with all relations
    const product = await Product.findOne({
      where: {
        product_id: id,
        user_id: req.user.user_id
      },
      include: [
        { model: Store },
        { model: Category },
        { 
          model: Document,
          where: { is_primary: true },
          required: false
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Generate PDF
    const pdfBuffer = await pdfService.generateProductPDF(product, req.user);

    // Set headers for PDF download
    const filename = `warranty-${product.product_name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export product error:', error);
    res.status(500).json({ error: 'Failed to export product' });
  }
};

// Export all products as PDF
exports.exportAllProducts = async (req, res) => {
  try {
    // Get all products for user
    const products = await Product.findAll({
      where: {
        user_id: req.user.user_id,
        is_active: true
      },
      include: [
        { model: Store },
        { model: Category },
        { 
          model: Document,
          where: { is_primary: true },
          required: false
        }
      ],
      order: [['purchase_date', 'DESC']]
    });

    if (products.length === 0) {
      return res.status(404).json({ error: 'No products to export' });
    }

    // Generate bulk PDF
    const pdfBuffer = await pdfService.generateBulkPDF(products, req.user);

    // Set headers for PDF download
    const filename = `warranty-report-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export all products error:', error);
    res.status(500).json({ error: 'Failed to export products' });
  }
};

// Export filtered products
exports.exportFiltered = async (req, res) => {
  try {
    const { category, status, store_id } = req.query;
    const where = { user_id: req.user.user_id, is_active: true };

    if (category) {
      where.category_id = category;
    }

    if (store_id) {
      where.store_id = store_id;
    }

    if (status === 'active') {
      where.warranty_end_date = { [require('sequelize').Op.gte]: new Date() };
    } else if (status === 'expired') {
      where.warranty_end_date = { [require('sequelize').Op.lt]: new Date() };
    }

    const products = await Product.findAll({
      where,
      include: [
        { model: Store },
        { model: Category },
        { 
          model: Document,
          where: { is_primary: true },
          required: false
        }
      ],
      order: [['purchase_date', 'DESC']]
    });

    if (products.length === 0) {
      return res.status(404).json({ error: 'No products match the filter' });
    }

    const pdfBuffer = await pdfService.generateBulkPDF(products, req.user);

    const filename = `warranty-${status || 'filtered'}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export filtered error:', error);
    res.status(500).json({ error: 'Failed to export filtered products' });
  }
};
```

### 1.4 Export Routes (src/routes/export.js)

```javascript
const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Export single product
router.get('/products/:id/pdf', exportController.exportProduct);

// Export all products
router.get('/products/all/pdf', exportController.exportAllProducts);

// Export filtered products
router.get('/products/filtered/pdf', exportController.exportFiltered);

module.exports = router;
```

### 1.5 Update Main App (src/app.js)

```javascript
const exportRoutes = require('./routes/export');

// Add after other routes
app.use('/api/v1/export', exportRoutes);
```

---

## Part 2: Mobile App - Export Feature

### 2.1 Export API (src/api/export.js)

```javascript
import apiClient from './client';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const exportApi = {
  // Export single product as PDF
  async exportProduct(productId) {
    try {
      const response = await apiClient.get(`/export/products/${productId}/pdf`, {
        responseType: 'blob'
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
        responseType: 'blob'
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
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('Export filtered error:', error);
      throw error;
    }
  },

  // Download and share PDF
  async downloadAndSharePDF(blob, filename) {
    try {
      // Create file URI
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1];
          resolve(base64data);
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(blob);
      const base64data = await base64Promise;
      
      // Write file
      await FileSystem.writeAsStringAsync(fileUri, base64data, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      // Share file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Warranty PDF'
      });
      
      return true;
    } catch (error) {
      console.error('Download and share error:', error);
      throw error;
    }
  }
};
```

### 2.2 Install Required Dependencies

```bash
cd mobile
npx expo install expo-file-system expo-sharing
```

### 2.3 Update Product Detail Screen - Add Export Button

Add export functionality to ProductDetailScreen.js:

```javascript
import { exportApi } from '../api/export';
import { useTranslation } from 'react-i18next';

export default function ProductDetailScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // ... existing code ...

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      Alert.alert(
        t('export.exportProduct'),
        t('export.exportConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('export.export'),
            onPress: async () => {
              try {
                const blob = await exportApi.exportProduct(productId);
                const filename = `warranty-${product.product_name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
                
                await exportApi.downloadAndSharePDF(blob, filename);
                
                Alert.alert(t('common.success'), t('export.exportSuccess'));
              } catch (error) {
                console.error('Export error:', error);
                Alert.alert(t('common.error'), t('export.exportFailed'));
              } finally {
                setIsExporting(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={product?.product_name || ''} />
        <Appbar.Action icon="file-pdf-box" onPress={handleExport} />
        <Appbar.Action icon="pencil" onPress={handleEdit} />
        <Appbar.Action icon="delete" onPress={handleDelete} />
      </Appbar.Header>

      {/* Rest of the component... */}
      
      {/* Export Button in content */}
      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="outlined"
            icon="file-pdf-box"
            onPress={handleExport}
            loading={isExporting}
            disabled={isExporting}
          >
            {t('export.exportAsPDF')}
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}
```

### 2.4 Export Screen (src/screens/ExportScreen.js)

Create a dedicated export screen:

```javascript
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Appbar, Card, RadioButton, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { exportApi } from '../api/export';

export default function ExportScreen({ navigation }) {
  const { t } = useTranslation();
  const [exportType, setExportType] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      let blob, filename;
      
      if (exportType === 'all') {
        blob = await exportApi.exportAllProducts();
        filename = `warranty-report-${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (exportType === 'filtered') {
        const filters = {};
        if (filterStatus !== 'all') {
          filters.status = filterStatus;
        }
        blob = await exportApi.exportFiltered(filters);
        filename = `warranty-${filterStatus}-${new Date().toISOString().split('T')[0]}.pdf`;
      }
      
      await exportApi.downloadAndSharePDF(blob, filename);
      
      Alert.alert(
        t('common.success'),
        t('export.exportSuccess')
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        t('common.error'),
        t('export.exportFailed')
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('export.title')} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              {t('export.selectExportType')}
            </Text>

            <RadioButton.Group onValueChange={setExportType} value={exportType}>
              <RadioButton.Item
                label={t('export.allProducts')}
                value="all"
                style={styles.radioItem}
              />
              <Text variant="bodySmall" style={styles.radioDescription}>
                {t('export.allProductsDescription')}
              </Text>

              <RadioButton.Item
                label={t('export.filtered')}
                value="filtered"
                style={styles.radioItem}
              />
              <Text variant="bodySmall" style={styles.radioDescription}>
                {t('export.filteredDescription')}
              </Text>
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {exportType === 'filtered' && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {t('filter.filterBy')}
              </Text>

              <Text variant="bodyMedium" style={styles.filterLabel}>
                {t('filter.status')}
              </Text>

              <View style={styles.chipContainer}>
                <Chip
                  selected={filterStatus === 'all'}
                  onPress={() => setFilterStatus('all')}
                  style={styles.chip}
                >
                  {t('filter.all')}
                </Chip>
                <Chip
                  selected={filterStatus === 'active'}
                  onPress={() => setFilterStatus('active')}
                  style={styles.chip}
                >
                  {t('filter.active')}
                </Chip>
                <Chip
                  selected={filterStatus === 'expired'}
                  onPress={() => setFilterStatus('expired')}
                  style={styles.chip}
                >
                  {t('filter.expired')}
                </Chip>
              </View>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {t('export.whatIsIncluded')}
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Text style={styles.bullet}>✓</Text>
                <Text style={styles.featureText}>
                  {t('export.feature1')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.bullet}>✓</Text>
                <Text style={styles.featureText}>
                  {t('export.feature2')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.bullet}>✓</Text>
                <Text style={styles.featureText}>
                  {t('export.feature3')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.bullet}>✓</Text>
                <Text style={styles.featureText}>
                  {t('export.feature4')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.bullet}>✓</Text>
                <Text style={styles.featureText}>
                  {t('export.feature5')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          icon="file-pdf-box"
          onPress={handleExport}
          loading={isExporting}
          disabled={isExporting}
          style={styles.exportButton}
        >
          {t('export.generatePDF')}
        </Button>
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
  card: {
    marginBottom: 16,
    elevation: 2
  },
  cardTitle: {
    marginBottom: 16,
    fontWeight: 'bold'
  },
  radioItem: {
    paddingVertical: 4
  },
  radioDescription: {
    color: '#666',
    marginLeft: 48,
    marginBottom: 12,
    marginTop: -8
  },
  filterLabel: {
    marginBottom: 12,
    color: '#666'
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    marginRight: 8,
    marginBottom: 8
  },
  featureList: {
    marginTop: 8
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start'
  },
  bullet: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
    marginTop: 2
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20
  },
  exportButton: {
    marginTop: 8,
    marginBottom: 24,
    paddingVertical: 8
  }
});
```

### 2.5 Update Home Screen - Add Export Option

Add export action to HomeScreen.js:

```javascript
<Appbar.Header>
  <Appbar.Content title={t('home.title')} />
  <Appbar.Action 
    icon="file-export" 
    onPress={() => navigation.navigate('Export')}
  />
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
  <Appbar.Action icon="cog" onPress={() => navigation.navigate('Settings')} />
</Appbar.Header>
```

### 2.6 Update App Navigator

```javascript
import ExportScreen from '../screens/ExportScreen';

// Add inside authenticated stack:
<Stack.Screen 
  name="Export" 
  component={ExportScreen}
  options={{ headerShown: false }}
/>
```

### 2.7 Add Translation Keys

Add to all language files (en.json, sr-Latn.json, sr-Cyrl.json):

**English (en.json):**
```json
"export": {
  "title": "Export",
  "exportProduct": "Export Product",
  "exportAsPDF": "Export as PDF",
  "export": "Export",
  "exportConfirm": "Generate PDF with warranty details and receipt image?",
  "exportSuccess": "PDF generated successfully! You can now share or save it.",
  "exportFailed": "Failed to generate PDF. Please try again.",
  "selectExportType": "Select Export Type",
  "allProducts": "All Products",
  "allProductsDescription": "Export complete warranty report with all your products",
  "filtered": "Filtered Products",
  "filteredDescription": "Export only products matching specific criteria",
  "whatIsIncluded": "What's Included in PDF",
  "feature1": "Product details and warranty information",
  "feature2": "Receipt images embedded in PDF",
  "feature3": "Store and purchase information",
  "feature4": "Warranty status and expiry dates",
  "feature5": "Professional formatting for printing",
  "generatePDF": "Generate PDF"
}
```

**Serbian Latin (sr-Latn.json):**
```json
"export": {
  "title": "Izvoz",
  "exportProduct": "Izvezi proizvod",
  "exportAsPDF": "Izvezi kao PDF",
  "export": "Izvezi",
  "exportConfirm": "Generisati PDF sa detaljima garancije i slikom računa?",
  "exportSuccess": "PDF je uspešno generisan! Sada možete da ga podelite ili sačuvate.",
  "exportFailed": "Generisanje PDF-a nije uspelo. Pokušajte ponovo.",
  "selectExportType": "Izaberite tip izvoza",
  "allProducts": "Svi proizvodi",
  "allProductsDescription": "Izvezite kompletan izveštaj o garancijama sa svim proizvodima",
  "filtered": "Filtrirani proizvodi",
  "filteredDescription": "Izvezite samo proizvode koji odgovaraju određenim kriterijumima",
  "whatIsIncluded": "Šta je uključeno u PDF",
  "feature1": "Detalji proizvoda i informacije o garanciji",
  "feature2": "Slike računa ugrađene u PDF",
  "feature3": "Informacije o prodavnici i kupovini",
  "feature4": "Status garancije i datumi isteka",
  "feature5": "Profesionalno formatiranje za štampanje",
  "generatePDF": "Generiši PDF"
}
```

**Serbian Cyrillic (sr-Cyrl.json):**
```json
"export": {
  "title": "Извоз",
  "exportProduct": "Извези производ",
  "exportAsPDF": "Извези као PDF",
  "export": "Извези",
  "exportConfirm": "Генерисати PDF са детаљима гаранције и сликом рачуна?",
  "exportSuccess": "PDF је успешно генерисан! Сада можете да га поделите или сачувате.",
  "exportFailed": "Генерисање PDF-а није успело. Покушајте поново.",
  "selectExportType": "Изаберите тип извоза",
  "allProducts": "Сви производи",
  "allProductsDescription": "Извезите комплетан извештај о гаранцијама са свим производима",
  "filtered": "Филтрирани производи",
  "filteredDescription": "Извезите само производе који одговарају одређеним критеријумима",
  "whatIsIncluded": "Шта је укључено у PDF",
  "feature1": "Детаљи производа и информације о гаранцији",
  "feature2": "Слике рачуна уграђене у PDF",
  "feature3": "Информације о продавници и куповини",
  "feature4": "Статус гаранције и датуми истека",
  "feature5": "Професионално форматирање за штампање",
  "generatePDF": "Генериши PDF"
}
```

---

## Part 3: Advanced Features

### 3.1 Email Export Feature

Add email functionality:

```javascript
// In exportController.js
const nodemailer = require('nodemailer');

exports.emailProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address required' });
    }

    const product = await Product.findOne({
      where: { product_id: id, user_id: req.user.user_id },
      include: [{ model: Store }, { model: Category }, { model: Document }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Generate PDF
    const pdfBuffer = await pdfService.generateProductPDF(product, req.user);

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Warranty - ${product.product_name}`,
      text: `Attached is your warranty information for ${product.product_name}.`,
      html: `
        <h2>Warranty Information</h2>
        <p>Attached is your warranty information for <strong>${product.product_name}</strong>.</p>
        <p>Generated by Warranty Manager</p>
      `,
      attachments: [
        {
          filename: `warranty-${product.product_name}.pdf`,
          content: pdfBuffer
        }
      ]
    });

    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email export error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};
```

### 3.2 Custom PDF Templates

Allow users to choose PDF templates:

```javascript
// Add template parameter to PDF generation
async generateProductPDF(product, user, template = 'default') {
  const templates = {
    default: this.defaultTemplate,
    minimal: this.minimalTemplate,
    detailed: this.detailedTemplate
  };
  
  return templates[template](product, user);
}

// Minimal template - single page, compact
async minimalTemplate(product, user) {
  const doc = new PDFDocument({ size: 'A4', margin: 30 });
  
  // Compact header
  doc.fontSize(16).text(product.product_name, 30, 30);
  doc.fontSize(10).text(`Warranty expires: ${product.warranty_end_date}`, 30, 50);
  
  // Receipt image only
  if (product.Documents?.[0]) {
    await this.addReceiptImage(doc, product.Documents[0]);
  }
  
  return doc;
}

// Detailed template - multiple pages with extra info
async detailedTemplate(product, user) {
  // Include purchase history, usage tips, warranty terms, etc.
}
```

### 3.3 Batch Download (ZIP)

Allow downloading multiple PDFs as ZIP:

```bash
npm install archiver
```

```javascript
const archiver = require('archiver');

exports.exportAllAsZip = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { user_id: req.user.user_id, is_active: true },
      include: [{ model: Store }, { model: Category }, { model: Document }]
    });

    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="warranties.zip"');
    
    archive.pipe(res);

    // Add each product as separate PDF
    for (const product of products) {
      const pdfBuffer = await pdfService.generateProductPDF(product, req.user);
      const filename = `${product.product_name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      archive.append(pdfBuffer, { name: filename });
    }

    await archive.finalize();
  } catch (error) {
    console.error('ZIP export error:', error);
    res.status(500).json({ error: 'Failed to create ZIP archive' });
  }
};
```

---

## Part 4: Testing & Documentation

### 4.1 Test PDF Generation

Create test endpoint:

```javascript
// src/routes/export.js
if (process.env.NODE_ENV === 'development') {
  router.get('/test-pdf', authenticateToken, async (req, res) => {
    try {
      const product = await Product.findOne({
        where: { user_id: req.user.user_id },
        include: [{ model: Store }, { model: Category }, { model: Document }]
      });

      if (!product) {
        return res.status(404).json({ error: 'No products found' });
      }

      const pdfBuffer = await pdfService.generateProductPDF(product, req.user);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Test PDF error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}
```

### 4.2 Mobile Testing

Test sharing functionality:

```javascript
// Test export flow
const testExport = async () => {
  try {
    console.log('Starting export test...');
    
    const blob = await exportApi.exportAllProducts();
    console.log('PDF generated, size:', blob.size);
    
    await exportApi.downloadAndSharePDF(blob, 'test-export.pdf');
    console.log('Share dialog opened');
    
  } catch (error) {
    console.error('Export test failed:', error);
  }
};
```

### 4.3 Update README.md

```markdown
## PDF Export Feature

### Single Product Export
1. Open product details
2. Tap PDF icon in header
3. Choose share option (email, save, print)

### Bulk Export
1. Go to Home → Export
2. Select "All Products" or "Filtered"
3. Choose filters if needed
4. Tap "Generate PDF"
5. Share or save the report

### What's Included
- Product details (name, brand, model)
- Purchase information (date, price, store)
- Warranty status and expiry date
- Receipt images (embedded)
- Professional formatting

### PDF Features
- Print-ready A4 format
- High-quality receipt images
- Color-coded warranty status
- Cover page with summary (bulk export)
- Table of contents (bulk export)
- Page numbers and headers
```

---

## ✅ What's Complete in v1.3.0:

1. ✅ **Single Product PDF** - Export individual warranty with receipt
2. ✅ **Bulk PDF Export** - Export all warranties in one document
3. ✅ **Filtered Export** - Export by status, category, or store
4. ✅ **Receipt Images** - Embedded high-quality images
5. ✅ **Professional Layout** - Clean, print-ready design
6. ✅ **Cover Page** - Summary statistics (bulk export)
7. ✅ **Table of Contents** - Easy navigation (bulk export)
8. ✅ **Color-Coded Status** - Visual warranty indicators
9. ✅ **Multi-language** - English and Serbian support
10. ✅ **Share Functionality** - Email, messaging, cloud storage
11. ✅ **Mobile Integration** - Native share sheet
12. ✅ **Image Processing** - Automatic resize and optimization

---

## 📊 PDF Layout Preview:

### Single Product PDF:
```
Page 1:
┌─────────────────────────────┐
│ Header (Logo + User Info)   │
├─────────────────────────────┤
│ Product Name (Large)         │
│ Brand                        │
├─────────────────────────────┤
│ Purchase Details:            │
│ - Date: 11/10/2024          │
│ - Price: 89,999 RSD         │
│ - Store: Tehnomanija        │
├─────────────────────────────┤
│ Warranty Status: [ACTIVE]   │
│ Expires: 11/10/2026         │
│ 730 days remaining          │
├─────────────────────────────┤
│ Store Information:           │
│ - Name: Tehnomanija         │
│ - City: Belgrade            │
├─────────────────────────────┤
│ Receipt Image:              │
│ [Receipt Photo]             │
│                             │
│                             │
├─────────────────────────────┤
│ Footer (Page 1 of 1)        │
└─────────────────────────────┘
```

### Bulk PDF:
```
Page 1: Cover Page
- Title: "Warranty Report"
- User name and email
- Total products count
- Generation date

Page 2: Table of Contents
- Product 1 ............ Page 3
- Product 2 ............ Page 4
- Product 3 ............ Page 5

Page 3-N: Individual Products
- Each product on separate page
- Full details + receipt image

Last Page: Summary
- Total products: 15
- Active: 12
- Expired: 3
- Total spent: 450,000 RSD
- By category breakdown
```

---

## 🎯 Use Cases:

### For Users:
- **Insurance Claims** - Submit warranty proof
- **Returns/Exchanges** - Show receipt and warranty
- **Record Keeping** - Archive all warranties
- **Tax Documentation** - Annual expense reports
- **Reselling** - Provide warranty info to buyers

### For Businesses:
- **Fleet Management** - Track equipment warranties
- **Office Equipment** - Centralized warranty records
- **Asset Management** - Company-wide reporting

---

## 🚀 Next Steps for v1.4.0:

Ready to implement:
1. **👨‍👩‍👧 Family Sharing** - Share warranties with household members
2. **📊 Advanced Analytics** - Visual charts and spending trends
3. **🌙 Dark Mode** - Beautiful dark theme throughout app
4. **📷 Barcode Scanning** - Quick product lookup via barcode
5. **☁️ Cloud Backup** - Automatic backup to cloud storage

**Which feature would you like next?** 🎯