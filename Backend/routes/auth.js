const express = require('express');
const path = require('path');
const router = express.Router();
const {authenticateToken, checkAdmin} = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

// Routes for authentication
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password/:token', authController.validateResetToken);
router.post('/reset-password', authController.resetPassword);

// Admin routes
router.get('/pending-reset-requests', authenticateToken, checkAdmin, authController.getPendingResetRequests);
// Note: We're removing the authenticateToken middleware from this route so it can be accessed directly from email links
router.get('/approve-reset/:token/:userId', authController.approveResetRequest);

module.exports = router;