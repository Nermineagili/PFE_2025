const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require('../controllers/notification');
const { authenticateToken, checkAdminOrSupervisor } = require('../middleware/authMiddleware');

// Routes for admin and supervisor roles
router.get('/', authenticateToken, checkAdminOrSupervisor, getUserNotifications);
router.get('/unread-count', authenticateToken, checkAdminOrSupervisor, getUnreadNotificationCount);
router.put('/:notificationId/read', authenticateToken, checkAdminOrSupervisor, markNotificationAsRead);
router.put('/mark-all-read', authenticateToken, checkAdminOrSupervisor, markAllNotificationsAsRead);

module.exports = router;