const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Store locations
router.get('/stores', locationController.getStoresWithLocations);
router.get('/analytics', locationController.getLocationAnalytics);

// Service centers
router.get('/service-centers', locationController.getServiceCenters);
router.get('/service-centers/product/:productId', locationController.getServiceCentersForProduct);

// Geocoding
router.post('/geocode', locationController.geocodeAddress);
router.get('/reverse-geocode', locationController.reverseGeocode);

module.exports = router;

