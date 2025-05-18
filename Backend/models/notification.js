const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Admin or Supervisor receiving the notification
  type: { type: String, required: true, enum: ['password_reset_request', 'contact_message'] }, // Notification type
  message: { type: String, required: true }, // E.g., "New message from John Doe"
  relatedId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // User who sent the message
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);