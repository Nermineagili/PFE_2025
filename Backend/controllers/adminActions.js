const User = require('../models/user');
const Claim = require("../models/claim"); // Import the Claim model

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

// Get all claims (Admin only)
const getAllClaims = async (req, res) => {
    try {
        const claims = await Claim.find().populate("userId", "name email"); // Get claims with user details
        res.json(claims);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch claims" });
    }
};

// Get claim by ID (Admin only)
const getClaimById = async (req, res) => {
    try {
        const claim = await Claim.findById(req.params.id).populate("userId", "name email");
        if (!claim) return res.status(404).json({ error: "Claim not found" });
        
        res.json(claim);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch claim" });
    }
};

// Update claim status (Admin only)
const updateClaimStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["pending", "approved", "rejected"].includes(status)) {
            return res.status(400).json({ error: "Invalid status value" });
        }

        const updatedClaim = await Claim.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!updatedClaim) return res.status(404).json({ error: "Claim not found" });

        res.json({ message: "Claim status updated successfully", claim: updatedClaim });
    } catch (err) {
        res.status(500).json({ error: "Failed to update claim status" });
    }
};

// Delete a claim (Admin only)
const deleteClaim = async (req, res) => {
    try {
        const deletedClaim = await Claim.findByIdAndDelete(req.params.id);
        if (!deletedClaim) return res.status(404).json({ error: "Claim not found" });

        res.json({ message: "Claim deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete claim" });
    }
};



module.exports = { getAllUsers, updateUser, deleteUser, getUserById, getAllClaims, getClaimById, deleteClaim, updateClaimStatus};