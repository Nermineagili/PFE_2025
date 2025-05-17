const jwt = require('jsonwebtoken');
const User = require('../models/user');
const mongoose = require('mongoose');

// Verify JWT token
exports.authenticateToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    console.log('Authorization Header:', authHeader); // Log the header

    const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"
    console.log('Extracted Token:', token); // Log the extracted token

    if (!token) {
        return res.status(401).json({ error: "Access Denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded Token:', decoded); // Log the decoded token
        req.user = decoded; // Store decoded user data in request
        next();
    } catch (err) {
        console.error('Token Verification Error:', err); // Log the error
        res.status(403).json({ error: "Invalid Token" });
    }
};

// Check if the user is an admin
exports.checkAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id); // Use req.user._id instead of req.user.id
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.role !== 'admin') {
            return res.status(403).json({ error: "Admin access required" });
        }

        next();
    } catch (err) {
        res.status(500).json({ error: "Authorization error" });
    }
};
// Check if the user is a supervisor
exports.checkSupervisor = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.role !== 'superviseur') {
            return res.status(403).json({ error: "Supervisor access required" });
        }

        next();
    } catch (err) {
        res.status(500).json({ error: "Authorization error" });
    }
};


// Middleware to validate ObjectId, checking both URL parameters and body
exports.validateObjectId = (req, res, next) => {
    // Validate for URL parameter (if applicable)
    if (req.params.userId && !mongoose.Types.ObjectId.isValid(req.params.userId)) {
        return res.status(400).json({ error: "Invalid user ID in URL" });
    }
    
    // Validate for body (if applicable)
    if (req.body.userId && !mongoose.Types.ObjectId.isValid(req.body.userId)) {
        return res.status(400).json({ error: "Invalid user ID in body" });
    }
    
    next();
};
exports.checkAdminOrSupervisor = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (!['admin', 'superviseur'].includes(user.role)) {
            return res.status(403).json({ error: 'Access restricted to admin and supervisor roles' });
        }
        req.user.role = user.role; // Store role for potential use
        next();
    } catch (err) {
        console.error('Authorization Error:', err);
        res.status(500).json({ error: 'Server error during authorization' });
    }
};