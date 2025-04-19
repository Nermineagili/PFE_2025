// models/ContactMessage.js
const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  replied: { type: Boolean, default: false },
  replyMessage: { type: String, default: '' },
  repliedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
