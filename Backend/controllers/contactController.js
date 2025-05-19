const nodemailer = require('nodemailer');
require('dotenv').config();
const ContactMessage = require('../models/ContactMessage');
const Notification = require('../models/notification');
const User = require('../models/user');
const { createNotificationForRole } = require('./notification');

// Centralized SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false }
});

transporter.verify((error) => {
  if (error) {
    console.error('[Contact] ❌ SMTP Connection Error:', error.message);
  } else {
    console.log('[Contact] ✅ SMTP Server is ready for contact emails');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html = null) => {
  try {
    const mailOptions = {
      from: `"YOMI Insurance" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('[Contact] Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Contact] Email sending error:', error.message);
    return false;
  }
};

// Send contact message (No authentication required)
const sendContactEmail = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    console.log('[Contact] Request body:', { name, email, subject, message });

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    // Use default subject if not provided
    const messageSubject = subject || 'Contact Form Submission';

    // Save message to DB
    const newMessage = new ContactMessage({
      name,
      email,
      subject: messageSubject,
      message,
      createdAt: new Date(),
    });
    await newMessage.save();
    console.log('[Contact] Contact message saved:', newMessage._id);

    // Log messages in the database
    const messages = await ContactMessage.find({});
    console.log('[Contact] Messages in the database:', messages);

    // Fetch supervisor emails
    const supervisors = await User.find({ role: 'superviseur' }).select('email');
    const supervisorEmails = supervisors.map(s => s.email);
    console.log('[Contact] Supervisor emails:', supervisorEmails);

    if (!supervisorEmails.length) {
      console.warn('[Contact] No supervisors found to receive message');
    } else {
      const emailText = `Name: ${name}\nEmail: ${email}\nSubject: ${messageSubject}\nMessage: ${message}`;
      const supervisorEmailSent = await sendEmail(
        supervisorEmails,
        `New Contact Message: ${messageSubject}`,
        emailText
      );
      console.log('[Contact] Supervisor email sent:', supervisorEmailSent);
    }

    // Create notification for supervisors
    try {
      await createNotificationForRole(
        'superviseur',
        'contact_message',
        `New message from ${name} (${email}): ${messageSubject}`,
        newMessage._id,
        'ContactMessage'
      );
      console.log('[Contact] Supervisor notification created for message:', newMessage._id);
    } catch (notifError) {
      console.error('[Contact] Failed to create supervisor notifications:', notifError.message);
    }

    // Send confirmation to user
    const userEmailText = `Hello ${name},\n\nYour message has been received by our team. Subject: ${messageSubject}\nWe'll respond as soon as possible.`;
    const userEmailSent = await sendEmail(email, 'Message Confirmation', userEmailText);

    res.status(201).json({
      message: 'Message sent and saved successfully',
      data: newMessage,
      userNotified: userEmailSent
    });
  } catch (error) {
    console.error('[Contact] Error sending contact message:', error.message);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
};

// Reply to user (Supervisor or Admin, requires authentication)
const replyToUser = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      console.log('[Contact] Error: req.user is undefined or missing _id in replyToUser');
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { to, subject, message, notificationId } = req.body;
    console.log('[Contact] Reply request:', { to, subject, message, notificationId });

    if (!['superviseur', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: Supervisor or Admin role required' });
    }

    // Validate required fields
    if (!to) return res.status(400).json({ error: 'Recipient email (to) is required' });
    if (!subject) return res.status(400).json({ error: 'Subject is required' });
    if (!message) return res.status(400).json({ error: 'Message is required' });
    if (!notificationId) return res.status(400).json({ error: 'Notification ID is required' });

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: `Notification not found for ID: ${notificationId}` });
    }
    if (notification.type !== 'contact_message') {
      return res.status(400).json({ error: 'Notification is not a contact message' });
    }
    if (!notification.relatedId) {
      return res.status(400).json({ error: 'Notification is missing relatedId' });
    }

    const contactMessage = await ContactMessage.findById(notification.relatedId);
    if (!contactMessage) {
      return res.status(404).json({ error: `Contact message not found for ID: ${notification.relatedId}` });
    }

    const emailText = `Regarding your message (Subject: ${contactMessage.subject}):\n\n${message}\n\nThank you for reaching out!`;
    const emailSent = await sendEmail(to, `Re: ${subject}`, emailText);

    await ContactMessage.findByIdAndUpdate(notification.relatedId, {
      replied: true,
      replyMessage: message,
      repliedAt: new Date(),
    });

    res.status(200).json({
      message: 'Reply sent successfully',
      emailSent
    });
  } catch (error) {
    console.error('[Contact] Error replying to user:', error.message);
    res.status(500).json({ error: 'Failed to send reply', details: error.message });
  }
};

// Delete contact message and notification (Supervisor or Admin, requires authentication)
const deleteContactMessage = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      console.log('[Contact] Error: req.user is undefined or missing _id in deleteContactMessage');
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { notificationId, contactMessageId } = req.body;
    console.log('[Contact] Delete request:', { notificationId, contactMessageId });

    if (!['superviseur', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: Supervisor or Admin role required' });
    }

    // Validate required fields
    if (!notificationId) return res.status(400).json({ error: 'Notification ID is required' });
    if (!contactMessageId) return res.status(400).json({ error: 'Contact message ID is required' });

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: `Notification not found for ID: ${notificationId}` });
    }
    if (notification.type !== 'contact_message') {
      return res.status(400).json({ error: 'Notification is not a contact message' });
    }
    if (!notification.isRead) {
      return res.status(400).json({ error: 'Cannot delete: Message has not been replied to' });
    }
    if (notification.relatedId.toString() !== contactMessageId) {
      return res.status(400).json({ error: 'Notification does not match the contact message ID' });
    }

    const contactMessage = await ContactMessage.findById(contactMessageId);
    if (!contactMessage) {
      return res.status(404).json({ error: `Contact message not found for ID: ${contactMessageId}` });
    }
    if (!contactMessage.replied) {
      return res.status(400).json({ error: 'Cannot delete: Contact message has not been replied to' });
    }

    // Delete both documents
    await ContactMessage.findByIdAndDelete(contactMessageId);
    await Notification.findByIdAndDelete(notificationId);
    console.log('[Contact] Deleted contact message and notification:', { contactMessageId, notificationId });

    res.status(200).json({ message: 'Contact message and notification deleted successfully' });
  } catch (error) {
    console.error('[Contact] Error deleting contact message:', error.message);
    res.status(500).json({ error: 'Failed to delete message', details: error.message });
  }
};

module.exports = { sendContactEmail, replyToUser, deleteContactMessage };