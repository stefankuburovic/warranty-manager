const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Search
router.post('/', searchController.searchProducts);
router.get('/suggestions', searchController.getSearchSuggestions);

// History
router.get('/history', searchController.getSearchHistory);
router.delete('/history', searchController.clearSearchHistory);
router.get('/popular', searchController.getPopularSearches);

// Saved searches
router.post('/saved', searchController.saveSearch);
router.get('/saved', searchController.getSavedSearches);
router.put('/saved/:savedSearchId', searchController.updateSavedSearch);
router.delete('/saved/:savedSearchId', searchController.deleteSavedSearch);
router.post('/saved/:savedSearchId/use', searchController.useSavedSearch);

module.exports = router;

