const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Token management
router.post('/register-token', notificationController.registerToken);
router.post('/remove-token', notificationController.removeToken);

// Settings
router.get('/settings', notificationController.getSettings);
router.post('/toggle', notificationController.toggleNotifications);

// Preferences
router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);

// Product schedules
router.get('/schedule/:productId', notificationController.getProductSchedule);
router.put('/schedule/:productId', notificationController.updateProductSchedule);

// Snooze/Unsnooze
router.post('/snooze', notificationController.snoozeNotification);
router.post('/unsnooze', notificationController.unsnoozeNotification);

// History
router.get('/history', notificationController.getNotificationHistory);

// Queue status
router.get('/queue', notificationController.getQueueStatus);

// Testing (dev only)
router.post('/test', notificationController.sendTestNotification);
router.post('/test/email', notificationController.testEmail);
router.post('/test/sms', notificationController.testSMS);
router.post('/trigger-check', notificationController.triggerWarrantyCheck);
router.post('/process-queue', notificationController.processQueue);

module.exports = router;
