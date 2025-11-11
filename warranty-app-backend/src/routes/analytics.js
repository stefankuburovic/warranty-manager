const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Analytics endpoints
router.get('/', analyticsController.getAnalytics);
router.get('/category/:category_id', analyticsController.getCategoryAnalytics);
router.get('/comparison', analyticsController.getSpendingComparison);

module.exports = router;

