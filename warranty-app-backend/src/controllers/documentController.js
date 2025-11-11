const { Document, Product } = require('../models');
const { getSignedUrl, deleteFile, uploadToS3, s3 } = require('../config/storage');
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
        const s3Object = await s3.getObject({
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
