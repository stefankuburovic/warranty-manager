const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Family management
router.post('/create', familyController.createFamily);
router.get('/', familyController.getFamily);
router.post('/join', familyController.joinFamily);
router.post('/leave', familyController.leaveFamily);
router.delete('/', familyController.deleteFamily);

// Member management
router.delete('/members/:member_id', familyController.removeMember);

// Product sharing
router.post('/products/:id/share', familyController.shareProduct);
router.delete('/products/:id/unshare', familyController.unshareProduct);
router.get('/shared-products', familyController.getSharedProducts);

module.exports = router;

