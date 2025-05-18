const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Allow null for unauthenticated users
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    default: 'Contact Form Submission', // Default if not provided
  },
  message: {
    type: String,
    required: true,
  },
  replied: {
    type: Boolean,
    default: false,
  },
  replyMessage: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  repliedAt: {
    type: Date,
  },
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);