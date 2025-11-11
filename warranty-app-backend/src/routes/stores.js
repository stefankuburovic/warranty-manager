const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', storeController.getStores);
router.get('/:id', storeController.getStore);
router.post('/', storeController.createStore);

module.exports = router;
