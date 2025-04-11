const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); 
              
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    lastname: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePic: { type: String, default: '/uploads/default-avatar.png' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

// userSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) return next(); // Only hash if password is modified
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next(); // Proceed to save the user
// });

module.exports = mongoose.model('User', userSchema);