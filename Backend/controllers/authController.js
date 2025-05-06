const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const JWT_SECRET = process.env.JWT_SECRET;


// Email configuration check
if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error('WARNING: Email configuration is missing! Password reset functionality will not work properly.');
  console.error('SMTP_HOST:', process.env.SMTP_HOST);
  console.error('SMTP_PORT:', process.env.SMTP_PORT);
  console.error('SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not set');
  console.error('SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Not set');
}

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  secure: false, // MUST be false for Mailtrap
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    // Necessary for Mailtrap in development
    rejectUnauthorized: false
  }
});

// Add this verification right after creating transporter
transporter.verify((error) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error);
    console.error('SMTP Settings:', {
      host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525')
    });
  } else {
    console.log('✅ SMTP Server is ready to send emails');
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
    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
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
    console.error(error);
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
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: "No account found with that email" });
    }

    // Generate tokens
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    
    user.resetPasswordToken = hashedToken;
    user.originalResetToken = resetToken; // Store the original token for admin approval
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Find admin users
    const adminUsers = await User.find({ role: 'admin' }).select('email');
    if (adminUsers.length === 0) {
      return res.status(500).json({ error: "No admin users found to approve request" });
    }

    // Create admin approval link
    const adminApprovalLink = `${process.env.ADMIN_URL || 'http://localhost:3000/adminhome'}/reset-approval/${resetToken}/${user._id}`;

    // Send emails to admins
    const adminEmails = adminUsers.map(admin => admin.email);
    const adminEmailContent = `
      <h2>Password Reset Request Approval Needed</h2>
      <p>A password reset has been requested for user: <strong>${user.name} ${user.lastname}</strong> (${user.email}).</p>
      <p>To approve this request, please click the link below:</p>
      <p><a href="${adminApprovalLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Approve Password Reset</a></p>
      <p>Or copy this URL: ${adminApprovalLink}</p>
      <p>This request will expire in 1 hour.</p>
      <p>If you did not initiate this request, please ignore this email.</p>
    `;
    
    const adminEmailSent = await sendEmail(
      adminEmails,
      'Password Reset Request Approval Needed',
      adminEmailContent
    );

    // Send confirmation email to user
    const userEmailContent = `
      <h2>Password Reset Request Submitted</h2>
      <p>Hello ${user.name},</p>
      <p>We've received your request to reset your password. An administrator will need to approve this request.</p>
      <p>You'll receive another email with reset instructions once your request has been approved.</p>
      <p>If you did not request a password reset, please contact support immediately.</p>
    `;
    
    const userEmailSent = await sendEmail(
      user.email,
      'Password Reset Request Submitted',
      userEmailContent
    );

    res.status(200).json({ 
      message: "Password reset request submitted for admin approval",
      adminNotified: adminEmailSent,
      userNotified: userEmailSent
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Approve Reset Request
const approveResetRequest = async (req, res) => {
  try {
    const { token, userId } = req.params;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    // Verify token and expiry
    if (!user.resetPasswordToken || user.resetPasswordExpires < Date.now() || token !== user.originalResetToken) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Generate new token
    const userResetToken = crypto.randomBytes(32).toString('hex');
    
    // Update user - USE MARKMODIFIED FOR SCHEMA CHANGES
    user.userResetToken = await bcrypt.hash(userResetToken, 10);
    user.userResetExpires = Date.now() + 3600000;
    user.markModified('userResetToken'); // Critical for schema changes
    user.markModified('userResetExpires');
    
    await user.save();

    // Verify save worked
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
      userResetToken // Sending back for debugging
    });

  } catch (error) {
    console.error('Approve reset error:', error);
    return res.status(500).json({ 
      error: "Internal Server Error",
      details: error.message
    });
  }
};

// Validate Reset Token
// Validate Reset Token - FIXED VERSION
const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    // Debug: Log the incoming token
    console.log(`[DEBUG] Validating token: ${token}`);

    // Find ALL users with active reset tokens
    const users = await User.find({
      userResetToken: { $exists: true },
      userResetExpires: { $gt: Date.now() }
    });

    // Debug: Log how many users were found
    console.log(`[DEBUG] Found ${users.length} users with active tokens`);

    // Compare token with each user's hashed token
    for (const user of users) {
      // Debug: Log comparison attempt
      console.log(`[DEBUG] Comparing with user ${user.email}`);
      
      const isMatch = await bcrypt.compare(token, user.userResetToken);
      if (isMatch) {
        // Debug: Log successful match
        console.log(`[DEBUG] Token matched for user ${user.email}`);
        return res.status(200).json({ 
          message: "Token is valid", 
          userId: user._id 
        });
      }
    }

    // Debug: Log failure
    console.log('[DEBUG] No matching token found');
    return res.status(400).json({ 
      error: "Password reset token is invalid or has expired",
      details: "No matching active token found"
    });

  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json({ 
      error: "Internal Server Error",
      details: error.message
    });
  }
};

// Reset Password - FIXED VERSION
const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Find ALL potential users first (more efficient)
    const users = await User.find({
      userResetToken: { $exists: true },
      userResetExpires: { $gt: Date.now() }
    });

    // Find the specific user with matching token
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

    // Update password
    const salt = await bcrypt.genSalt(10);
    validUser.password = await bcrypt.hash(password, salt);
    
    // Clear ALL reset tokens (security best practice)
    validUser.resetPasswordToken = undefined;
    validUser.originalResetToken = undefined;
    validUser.resetPasswordExpires = undefined;
    validUser.userResetToken = undefined;
    validUser.userResetExpires = undefined;
    
    await validUser.save();
    
    // Send confirmation email
    const emailContent = `
      <h2>Password Reset Successful</h2>
      <p>Hello ${validUser.name},</p>
      <p>Your password has been successfully reset.</p>
    `;
    
    await sendEmail(validUser.email, 'Password Reset Complete', emailContent);
    
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error('Reset password error:', error);
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
    console.error('Error fetching reset requests:', error);
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