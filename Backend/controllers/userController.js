const User = require('../models/user');
const cloudinary = require('../cloudinary');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Use bcrypt for password hashing

exports.uploadProfilePic = async (req, res) => {
    try {
        // Check if the file exists in req.file
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image provided"
            });
        }

        // Check if userId exists in the request body
        if (!req.body.userId) {
            return res.status(400).json({
                success: false,
                message: "No userId provided"
            });
        }

        // Upload the image to Cloudinary
        const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
            folder: 'insurance_app',
        });

        // Log to see if the userId and uploaded image are valid
        console.log('Uploaded image URL:', uploadedImage.secure_url);
        console.log('User ID from body:', req.body.userId);

        // Find the user by userId
        const user = await User.findById(req.body.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Update the user document with the new profile picture URL
        user.profilePic = uploadedImage.secure_url;
        await user.save();  // Save the updated user

        // Return only the profilePic in the response
        res.status(200).json({
            success: true,
            message: "Image uploaded successfully",
            data: { profilePic: user.profilePic }  // Return only the profilePic URL
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({
            success: false,
            message: "Error during upload",
        });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }
    
        const user = await User.findById(userId);
        
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
    
        res.json({
          success: true,
          message: 'User fetched successfully',
          data: user,
        });
      } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    };
// Update User Information
exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const updatedUser = await User.findByIdAndUpdate(userId, req.body, { new: true, runValidators: true });

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser,
        });

    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

//changePassword function 
exports.changePassword = async (req, res) => {
    try {
      const { userId } = req.params; // Assuming user ID is passed as a URL parameter
      const { oldPassword, newPassword } = req.body;
  
      // Find the user by ID
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      // Check if the old password is correct
      const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isOldPasswordValid) {
        return res.status(401).json({ error: "Invalid old password" });
      }
  
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
  
      // Update the password
      user.password = hashedPassword;
      await user.save();
  
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };



