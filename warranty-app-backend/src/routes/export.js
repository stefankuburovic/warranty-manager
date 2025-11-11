const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Export all products (must be before :id route)
router.get('/products/all/pdf', exportController.exportAllProducts);

// Export filtered products (must be before :id route)
router.get('/products/filtered/pdf', exportController.exportFiltered);

// Export single product (must be last to avoid matching "all" or "filtered")
router.get('/products/:id/pdf', exportController.exportProduct);

module.exports = router;

