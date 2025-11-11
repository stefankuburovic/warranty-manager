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

