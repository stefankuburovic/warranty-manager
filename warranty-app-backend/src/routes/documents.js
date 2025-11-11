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
