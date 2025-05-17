const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lastname: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: '/uploads/default-avatar.png' },
  role: { type: String, enum: ['user', 'admin', 'superviseur'], default: 'user' }, 
  contracts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contract' }],
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  originalResetToken: { type: String }, // Add this new field
  /////
  userResetToken: { type: String },
  userResetExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
    settings: {
    language: { type: String, default: 'Français' },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
  },
});

module.exports = mongoose.model('User', userSchema);
