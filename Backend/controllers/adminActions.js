const User = require('../models/user');
const Claim = require("../models/claim"); // Import the Claim model
const Contract = require("../models/Contract"); // <- make sure you have this model!
const bcrypt = require('bcrypt');

const createUser = async (req, res) => {
    try {
        const { name, lastname, email, password, profilePic = '', role = 'user' } = req.body;
    
        // Basic validation
        if (!name || !email || !password) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
    
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ error: 'Email already registered' });
        }
    
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
    
        // Create new user
        const newUser = new User({
          name,
          lastname,
          email,
          password: hashedPassword,
          profilePic,
          role,
        });
    
        await newUser.save();
    
        res.status(201).json({ message: 'User created successfully', user: newUser });
    
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
      }
    };

// Fetch all users (without admin) + their contracts
const getAllUsersWithContracts = async (req, res) => {
    try {
      const users = await User.find({ role: { $ne: 'admin' } })
        .select('-password')
        .populate('contracts');
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch users with contracts' });
    }
  };
  

// Fetch only users who have at least one contract
const getUsersWithContractsOnly = async (req, res) => {
    try {
      const users = await User.find({
        role: { $ne: 'admin' },
        contracts: { $exists: true, $not: { $size: 0 } }
      })
        .select('-password')
        .populate('contracts');
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch users with contracts' });
    }
  };
  
const getAllUsers = async (req, res) => {
    try {
      // Fetch all users except those with the role "admin"
      const users = await User.find({ role: { $ne: 'admin' } }, '-password'); // Exclude admin and password
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  };
  const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-password'); // Exclude password field
        if (!user) return res.status(404).json({ error: "User not found" });
        
        res.json(user); // Return the user details
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
};

const updateUser = async (req, res) => {
    try {
        const { name, lastname, email, role } = req.body;
        const userId = req.params.id;

        // Prevent admin from updating themselves
        if (userId === req.user.id) {
            return res.status(403).json({ error: "Admin cannot update their own account" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, lastname, email, role },
            { new: true, runValidators: true }
        );

        if (!updatedUser) return res.status(404).json({ error: "User not found" });

        res.json({ message: "User updated successfully", user: updatedUser });
    } catch (err) {
        res.status(500).json({ error: "Failed to update user" });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent admin from deleting themselves
        if (userId === req.user.id) {
            return res.status(403).json({ error: "Admin cannot delete their own account" });
        }

        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) return res.status(404).json({ error: "User not found" });

        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete user" });
    }
};




module.exports = { createUser,getAllUsers, updateUser, deleteUser, getUserById,getAllUsersWithContracts,getUsersWithContractsOnly};