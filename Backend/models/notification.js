const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['password_reset_request', 'contact_message'],
  },
  message: {
    type: String,
    required: true,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'type',
    required: false,
  },
  relatedModel: {
    type: String,
    enum: ['User', 'ContactMessage'],
    required: function() { return !!this.relatedId; },
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

notificationSchema.path('type').validate(function(value) {
  const model = value === 'password_reset_request' ? 'User' : 'ContactMessage';
  this.relatedModel = this.relatedId ? model : undefined;
  return true;
}, 'Invalid notification type');

module.exports = mongoose.model('Notification', notificationSchema);