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

