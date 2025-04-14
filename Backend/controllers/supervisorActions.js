const Claim = require("../models/claim");
const User = require("../models/user");
const bcrypt = require('bcrypt');

// Get all claims (Superviseur only)
const getAllClaims = async (req, res) => {
    try {
        const claims = await Claim.find().populate("userId", "name email");
        res.json(claims);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch claims" });
    }
};

// Get claim by ID (Superviseur only)
const getClaimById = async (req, res) => {
    try {
        const claim = await Claim.findById(req.params.id).populate("userId", "name email");
        if (!claim) return res.status(404).json({ error: "Claim not found" });
        res.json(claim);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch claim" });
    }
};

// Update claim status (Superviseur only)
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

// Delete a claim (Superviseur only)
const deleteClaim = async (req, res) => {
    try {
        const deletedClaim = await Claim.findByIdAndDelete(req.params.id);
        if (!deletedClaim) return res.status(404).json({ error: "Claim not found" });

        res.json({ message: "Claim deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete claim" });
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

module.exports = {
    getAllClaims,
    getClaimById,
    updateClaimStatus,
    deleteClaim,
    getUsersWithContractsOnly
};
