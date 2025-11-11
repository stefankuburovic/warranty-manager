const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// CRUD operations
router.post('/', productController.createProduct);
router.get('/', productController.getProducts);
router.get('/expiring', productController.getExpiringProducts);
router.get('/expired', productController.getExpiredProducts);
router.get('/stats', productController.getProductStats);
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
