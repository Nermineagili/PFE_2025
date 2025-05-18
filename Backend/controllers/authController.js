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
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }
    
    const payload = {
      _id: user._id,
      email: user.email,
      fullname: `${user.name} ${user.lastname}`,
      role: user.role,
      profilePic: user.profilePic,
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ user: payload, token });
    
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: "Internal Server Error" });
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
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.originalResetToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    console.log('[Auth] Reset token saved for user:', user._id);
    
    const resetApprovalUrl = `${process.env.FRONTEND_URL}/adminhome/reset-approval/${resetToken}/${user._id}`;
    const adminMessage = `Password reset request from ${user.name} ${user.lastname} (${user.email}). Approve here: ${resetApprovalUrl}`;
    let adminNotified = false;
    let emailSent = false;
    try {
      const admins = await User.find({ role: 'admin' }).select('email _id');
      console.log('[Auth] Found admins:', admins.length, admins.map(a => ({ email: a.email, id: a._id })));
      if (admins.length) {
        // Send email to admins
        emailSent = await sendEmail(
          admins.map(admin => admin.email),
          'Password Reset Approval Needed',
          adminMessage
        );
        console.log('[Auth] Admin email sent:', emailSent);
        
        // Create notifications for all admins
        try {
          await createNotificationForRole(
            'admin',
            'password_reset_request',
            `Password reset request from ${user.name} ${user.lastname} (${user.email})`,
            user._id
          );
          adminNotified = true;
        } catch (notifError) {
          console.error('[Auth] Failed to create notifications:', notifError.message);
        }
      } else {
        console.log('[Auth] No admins found to notify');
      }
    } catch (queryError) {
      console.error('[Auth] Error querying admins or sending email:', queryError.message);
    }
    
    const userMessage = `Hello ${user.name},\n\nYour password reset request has been submitted and is pending admin approval. You'll receive a reset link upon approval.`;
    const userNotified = await sendEmail(email, 'Password Reset Request Submitted', userMessage);
    console.log('[Auth] User notified:', userNotified);
    
    res.status(200).json({
      message: 'Password reset request submitted for admin approval',
      adminNotified,
      userNotified,
      emailSent
    });
  } catch (error) {
    console.error('[Auth] Error processing password reset request:', error.message);
    res.status(500).json({ error: 'Failed to process request', details: error.message });
  }
};

// Approve Reset Request
const approveResetRequest = async (req, res) => {
  try {
    const { token, userId } = req.params;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.resetPasswordToken || user.resetPasswordExpires < Date.now() || token !== user.originalResetToken) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const userResetToken = crypto.randomBytes(32).toString('hex');
    user.userResetToken = await bcrypt.hash(userResetToken, 10);
    user.userResetExpires = Date.now() + 3600000;
    user.markModified('userResetToken');
    user.markModified('userResetExpires');
    
    await user.save();

    const updatedUser = await User.findById(userId);
    if (!updatedUser.userResetToken) {
      throw new Error("Failed to save userResetToken");
    }

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${userResetToken}`;
    await sendEmail(
      user.email,
      'Password Reset Instructions',
      `Your reset link: ${resetLink}`
    );

    return res.status(200).json({ 
      message: "Password reset approved",
      resetLink,
      userResetToken
    });
  } catch (error) {
    console.error('[Auth] Approve reset error:', error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// Validate Reset Token
const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    console.log('[Auth] Validating token:', token);

    const users = await User.find({
      userResetToken: { $exists: true },
      userResetExpires: { $gt: Date.now() }
    });

    console.log('[Auth] Found users with active tokens:', users.length);
    for (const user of users) {
      console.log('[Auth] Comparing with user:', user.email);
      const isMatch = await bcrypt.compare(token, user.userResetToken);
      if (isMatch) {
        console.log('[Auth] Token matched for user:', user.email);
        return res.status(200).json({ 
          message: "Token is valid", 
          userId: user._id 
        });
      }
    }

    console.log('[Auth] No matching token found');
    return res.status(400).json({ 
      error: "Password reset token is invalid or has expired",
      details: "No matching active token found"
    });
  } catch (error) {
    console.error('[Auth] Token validation error:', error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const users = await User.find({
      userResetToken: { $exists: true },
      userResetExpires: { $gt: Date.now() }
    });

    let validUser = null;
    for (const user of users) {
      const isMatch = await bcrypt.compare(token, user.userResetToken);
      if (isMatch) {
        validUser = user;
        break;
      }
    }

    if (!validUser) {
      return res.status(400).json({ error: "Password reset token is invalid or has expired" });
    }

    const salt = await bcrypt.genSalt(10);
    validUser.password = await bcrypt.hash(password, salt);
    validUser.resetPasswordToken = undefined;
    validUser.originalResetToken = undefined;
    validUser.resetPasswordExpires = undefined;
    validUser.userResetToken = undefined;
    validUser.userResetExpires = undefined;
    
    await validUser.save();
    
    const emailContent = `
      <h2>Password Reset Successful</h2>
      <p>Hello ${validUser.name},</p>
      <p>Your password has been successfully reset.</p>
    `;
    
    await sendEmail(validUser.email, 'Password Reset Complete', emailContent);
    
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error('[Auth] Reset password error:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get Pending Reset Requests
const getPendingResetRequests = async (req, res) => {
  try {
    const users = await User.find({
      resetPasswordToken: { $exists: true },
      resetPasswordExpires: { $gt: Date.now() }
    }).select('name email originalResetToken resetPasswordExpires createdAt');

    res.json(users.map(user => ({
      _id: user._id,
      userId: user._id,
      name: user.name,
      email: user.email,
      token: user.originalResetToken,
      requestedAt: user.resetPasswordExpires - 3600000
    })));
  } catch (error) {
    console.error('[Auth] Error fetching reset requests:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { 
  register, 
  login, 
  forgotPassword, 
  approveResetRequest, 
  validateResetToken, 
  resetPassword,
  getPendingResetRequests
};