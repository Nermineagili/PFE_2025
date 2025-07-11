const jwt = require('jsonwebtoken');
const User = require('../models/user');
const mongoose = require('mongoose');

// Verify JWT token
exports.authenticateToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    console.log('authenticateToken - Authorization Header:', authHeader);

    const token = authHeader && authHeader.split(' ')[1];
    console.log('authenticateToken - Extracted Token:', token);

    if (!token) return res.status(401).json({ error: "Access Denied. No token provided." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('authenticateToken - Decoded Token:', decoded);
        req.user = decoded;
        console.log('authenticateToken - req.user set to:', req.user);
        next();
    } catch (err) {
        console.error('authenticateToken - Token Verification Error:', err.message);
        res.status(403).json({ error: "Invalid Token" });
    }
};

// ... (rest of the file remains the same)

// Check if the user is an admin
exports.checkAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
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
// In authMiddleware.js
// In authMiddleware.js
const timeout = require('timers/promises').setTimeout;

exports.checkSupervisor = async (req, res, next) => {
    try {
        console.log(`checkSupervisor - Verifying user ${req.user._id} at ${new Date().toISOString()}`);
        const user = await Promise.race([
            User.findById(req.user._id),
            timeout(10000).then(() => { throw new Error('User find timed out'); })
        ]);
        console.log(`checkSupervisor - User found: ${user ? user.role : 'null'} at ${new Date().toISOString()}`);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.role !== 'superviseur') {
            return res.status(403).json({ error: "Supervisor access required" });
        }

        console.log(`checkSupervisor - User ${req.user._id} is supervisor, proceeding at ${new Date().toISOString()}`);
        next();
    } catch (err) {
        console.error(`checkSupervisor - Error: ${err.message} at ${new Date().toISOString()}`);
        res.status(500).json({ error: "Authorization error", details: err.message });
    }
};

exports.validateObjectId = (...paramNames) => {
    return (req, res, next) => {
        console.log(`validateObjectId - Validating params ${paramNames} for ${req.path} at ${new Date().toISOString()}`);
        if (req.params) {
            for (const param of paramNames) {
                if (req.params[param] && !mongoose.Types.ObjectId.isValid(req.params[param])) {
                    console.log(`validateObjectId - Invalid ${param}: ${req.params[param]} at ${new Date().toISOString()}`);
                    return res.status(400).json({ error: `Invalid ${param} in URL` });
                }
            }
        }
        console.log(`validateObjectId - Validation passed for ${req.path} at ${new Date().toISOString()}`);
        next();
    };
};

// Check if user is admin or supervisor
exports.checkAdminOrSupervisor = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (!['admin', 'superviseur'].includes(user.role)) {
            return res.status(403).json({ error: 'Access restricted to admin and supervisor roles' });
        }
        req.user.role = user.role;
        next();
    } catch (err) {
        console.error('Authorization Error:', err);
        res.status(500).json({ error: 'Server error during authorization' });
    }
};