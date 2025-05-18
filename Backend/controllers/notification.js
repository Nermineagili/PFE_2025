const Notification = require('../models/notification');
const User = require('../models/user');

// Create a single notification for a user
const createNotification = async (userId, type, message, relatedId = null) => {
  try {
    console.log(`Creating notification for userId: ${userId}, type: ${type}, message: ${message}, relatedId: ${relatedId}`);
    const notification = new Notification({
      userId,
      type,
      message,
      relatedId,
      isRead: false,
      createdAt: new Date(),
    });
    await notification.save();
    console.log(`Notification saved: ${notification._id}`);
    return notification;
  } catch (error) {
    console.error(`Error creating notification for userId ${userId}:`, error.message);
    throw error;
  }
};

// Create notifications for all users with a specific role
const createNotificationForRole = async (role, type, message, relatedId = null) => {
  try {
    console.log(`Fetching users with role: ${role}`);
    const users = await User.find({ role }).select('_id');
    console.log(`Found ${users.length} users with role ${role}:`, users.map(u => u._id.toString()));
    if (!users.length) {
      console.warn(`No users found with role: ${role}`);
      return [];
    }
    const notifications = await Promise.all(
      users.map(user =>
        createNotification(user._id, type, message, relatedId)
      )
    );
    console.log(`Created ${notifications.length} notifications for role ${role}`);
    return notifications;
  } catch (error) {
    console.error(`Error creating notifications for role ${role}:`, error.message);
    throw error;
  }
};

// Get notifications for the authenticated user
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`Fetching notifications for userId: ${userId}`);
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .populate('relatedId', 'name email');
    console.log(`Found ${notifications.length} notifications for userId ${userId}`);
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
  }
};

// Get unread notification count for the authenticated user
const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`Counting unread notifications for userId: ${userId}`);
    const count = await Notification.countDocuments({ userId, isRead: false });
    console.log(`Unread count for userId ${userId}: ${count}`);
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error.message);
    res.status(500).json({ error: 'Failed to fetch unread count', details: error.message });
  }
};

// Mark a notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const notification = await Notification.findOne({
      _id: req.params.notificationId,
      userId,
    });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found or not owned by user' });
    }
    notification.isRead = true;
    await notification.save();
    console.log(`Marked notification ${notification._id} as read for userId ${userId}`);
    res.status(200).json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error.message);
    res.status(500).json({ error: 'Failed to mark notification as read', details: error.message });
  }
};

// Mark all notifications as read for the authenticated user
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`Marking all notifications as read for userId: ${userId}`);
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    console.log(`All notifications marked as read for userId ${userId}`);
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error.message);
    res.status(500).json({ error: 'Failed to mark all notifications as read', details: error.message });
  }
};

module.exports = {
}

module.exports = {
  createNotification,
  createNotificationForRole,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};