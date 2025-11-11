const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Registration and login
router.post('/register', authController.register);
router.post('/login', authController.login);

// Google OAuth
router.post('/google', authController.googleAuth);

// Token refresh
router.post('/refresh', authController.refreshToken);

// Password management
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', authenticateToken, authController.changePassword);

// Profile
router.get('/me', authenticateToken, authController.getProfile);

module.exports = router;

