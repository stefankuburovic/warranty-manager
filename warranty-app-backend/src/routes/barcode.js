const express = require('express');
const router = express.Router();
const barcodeController = require('../controllers/barcodeController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Lookup product by barcode
router.get('/lookup/:barcode', barcodeController.lookupBarcode);

// Parse QR code data
router.post('/parse-qr', barcodeController.parseQRCode);

// Save scan to history
router.post('/scan-history', barcodeController.saveScanHistory);

// Validate barcode format
router.post('/validate', barcodeController.validateBarcode);

module.exports = router;

