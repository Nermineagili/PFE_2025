const User = require('../models/user');
const Claim = require("../models/claim");
const Contract = require("../models/Contract");
const bcrypt = require('bcrypt');

const createUser = async (req, res) => {
    try {
        const { name, lastname, email, password, profilePic = '', role = 'user' } = req.body;
    
        if (!name || !email || !password) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
    
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ error: 'Email already registered' });
        }
    
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
    
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
      const users = await User.find({ role: { $ne: 'admin' } }, '-password');
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
};

const getUserById = async (req, res) => {
    console.log(`[getUserById] Request received for ID: ${req.params.id}`);
    try {
        const userId = req.params.id;
        console.log(`[getUserById] Querying database for ID: ${userId}`);
        const user = await User.findById(userId).select('-password');
        if (!user) {
            console.log(`[getUserById] User not found for ID: ${userId}`);
            return res.status(404).json({ error: "User not found" });
        }
        console.log(`[getUserById] User found: ${JSON.stringify(user)}`);
        res.json(user);
    } catch (err) {
        console.error(`[getUserById] Error: ${err.message}`, err.stack);
        res.status(500).json({ error: "Failed to fetch user" });
    }
};

const updateUser = async (req, res) => {
    try {
        const { name, lastname, email, role } = req.body;
        const userId = req.params.id;

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

const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({ error: "Search query is required" });
        }

        const users = await User.find({
            role: { $ne: 'admin' },
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { lastname: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        })
        .select('-password')
        .populate('contracts');

        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Failed to search users" });
    }
};

module.exports = { 
    createUser,
    getAllUsers, 
    updateUser, 
    deleteUser, 
    getUserById,
    getAllUsersWithContracts,
    getUsersWithContractsOnly,
    searchUsers 
};