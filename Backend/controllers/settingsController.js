const User = require('../models/user');
const mongoose = require('mongoose');

exports.getSettings = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }
    
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check if user has the required role
    if (!['admin', 'superviseur'].includes(user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access restricted to admin and supervisor roles' 
      });
    }
    
    // Return the settings object with fallback values if any property is missing
    const settings = {
      language: user.settings?.language || 'Français',
      emailNotifications: user.settings?.emailNotifications !== undefined ? user.settings.emailNotifications : true,
      pushNotifications: user.settings?.pushNotifications !== undefined ? user.settings.pushNotifications : true
    };
    
    console.log('Returning settings:', settings);
    
    res.json({
      success: true,
      message: 'Settings fetched successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }
    
    // Get settings from request body
    const { language, emailNotifications, pushNotifications } = req.body;
    
    console.log('Received settings update:', { language, emailNotifications, pushNotifications });
    
    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check if user has the required role
    if (!['admin', 'superviseur'].includes(user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access restricted to admin and supervisor roles' 
      });
    }
    
    // Initialize settings object if it doesn't exist
    if (!user.settings) {
      user.settings = {};
    }
    
    // Update settings with new values, maintaining defaults if values aren't provided
    user.settings = {
      language: language || user.settings.language || 'Français',
      emailNotifications: emailNotifications !== undefined ? emailNotifications : user.settings.emailNotifications !== undefined ? user.settings.emailNotifications : true,
      pushNotifications: pushNotifications !== undefined ? pushNotifications : user.settings.pushNotifications !== undefined ? user.settings.pushNotifications : true
    };
    
    console.log('Saving settings:', user.settings);
    
    // Save user with updated settings
    await user.save();
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: user.settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
};