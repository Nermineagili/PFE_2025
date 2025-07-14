const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const crypto = require('crypto');
const { createNotificationForRole } = require('./notification');
const nodemailer = require('nodemailer');
const JWT_SECRET = process.env.JWT_SECRET;

// Email configuration check
if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error('[Auth] WARNING: Email configuration is missing! Password reset functionality will not work properly.');
  console.error('[Auth] SMTP_HOST:', process.env.SMTP_HOST);
  console.error('[Auth] SMTP_PORT:', process.env.SMTP_PORT);
  console.error('[Auth] SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not set');
  console.error('[Auth] SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Not set');
}

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter
transporter.verify((error) => {
  if (error) {
    console.error('[Auth] ❌ SMTP Connection Error:', error);
    console.error('[Auth] SMTP Settings:', {
      host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525')
    });
  } else {
    console.log('[Auth] ✅ SMTP Server is ready to send emails');
  }
});

// Email sending helper
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || `"Insurance Portal" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('[Auth] Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('[Auth] Email sending error:', error);
    return false;
  }
};

// User Registration
const register = async (req, res) => {
  try {
    const { name, lastname, email, password, profilePic = '', role = 'user' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      name,
      lastname,
      email,
      password: hashedPassword,
      profilePic,
      role
    });
    
    await newUser.save();
    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// User Login
const login = async (req, res) => {
  console.log(`login - Request received at ${new Date().toISOString()} with body:`, req.body);
  try {
      const { email, password } = req.body;
      if (!email || !password) {
          console.log(`login - Missing email or password at ${new Date().toISOString()}`);
          return res.status(400).json({ error: "Email and password are required" });
      }

      console.log(`login - Finding user ${email} at ${new Date().toISOString()}`);
      const user = await User.findOne({ email }).lean(); // Use lean() for performance
      if (!user) {
          console.log(`login - User ${email} not found at ${new Date().toISOString()}`);
          return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log(`login - Comparing passwords for ${email} at ${new Date().toISOString()}`);
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
          console.log(`login - Password mismatch for ${email} at ${new Date().toISOString()}`);
          return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log(`login - Generating token for ${user._id} at ${new Date().toISOString()}`);
      const payload = {
          _id: user._id,
          email: user.email,
          fullname: `${user.name} ${user.lastname}`,
          role: user.role,
          profilePic: user.profilePic,
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

      console.log(`login - Login successful, token generated at ${new Date().toISOString()}:`, token);
      res.status(200).json({ success: true, user: payload, token });
  } catch (error) {
      console.error(`login - Error: ${error.message} at ${new Date().toISOString()}`, error.stack);
      res.status(500).json({ error: "Login failed", details: error.message });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('[Auth] Password reset request for:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('[Auth] User not found:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    console.log('[Auth] Reset token saved for user:', user._id);

    // Send reset email directly to user
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const emailContent = `
      <p>Cliquez sur le lien suivant pour réinitialiser votre mot de passe : <a href="${resetLink}">${resetLink}</a></p>
      <p>Ce lien expire dans 1 heure.</p>
    `;
    const emailSent = await sendEmail(user.email, 'Réinitialisation de votre mot de passe', emailContent);
    console.log('[Auth] Reset email sent:', emailSent);

    res.status(200).json({
      message: 'Email de réinitialisation envoyé.',
      emailSent
    });
  } catch (error) {
    console.error('[Auth] Error processing password reset request:', error.message);
    res.status(500).json({ error: 'Failed to process request', details: error.message });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const user = await User.findOne({
      resetPasswordToken: crypto.createHash('sha256').update(token).digest('hex'),
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Password reset token is invalid or has expired" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const emailContent = `
      <h2>Password Reset Successful</h2>
      <p>Hello ${user.name},</p>
      <p>Your password has been successfully reset.</p>
    `;
    await sendEmail(user.email, 'Password Reset Complete', emailContent);

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error('[Auth] Reset password error:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Remove unused functions
// const approveResetRequest, validateResetToken, and getPendingResetRequests are no longer needed

module.exports = { 
  register, 
  login, 
  forgotPassword, 
  resetPassword
};