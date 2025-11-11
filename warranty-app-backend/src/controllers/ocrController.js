const ocrService = require('../services/ocrService');
const { Document, Product } = require('../models');
const { s3 } = require('../config/storage');
const { Op } = require('sequelize');

// Process receipt image and extract data
exports.processReceipt = async (req, res) => {
  try {
    const { document_id } = req.params;

    // Get document
    const document = await Document.findOne({
      where: { document_id },
      include: [{
        model: Product,
        where: { user_id: req.user.user_id },
        required: true
      }]
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if it's an image
    if (!document.mime_type || !document.mime_type.startsWith('image/')) {
      return res.status(400).json({ error: 'Document must be an image' });
    }

    // Download image from S3
    try {
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
    } catch (s3Error) {
      console.error('S3 error:', s3Error);
      return res.status(500).json({ error: 'Failed to retrieve document from storage' });
    }
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
    if (!req.file.mimetype || !req.file.mimetype.startsWith('image/')) {
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
        ocr_processed_at: { [Op.ne]: null }
      },
      include: [{
        model: Product,
        where: { user_id: req.user.user_id },
        attributes: ['product_id', 'product_name'],
        required: true
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

