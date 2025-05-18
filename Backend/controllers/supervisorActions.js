const Claim = require("../models/claim");
const User = require("../models/user");
const Contract = require('../models/Contract');

const ContactMessage = require("../models/ContactMessage.js");

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
    const { policyType } = req.query; // e.g., /api/supervisor/users-with-contracts?policyType=santé

    // First, find contracts that match the given policyType
    const contractFilter = policyType
      ? { policyType }
      : {}; // if no filter, match all types

    const matchingContracts = await Contract.find(contractFilter).select('_id');

    // Extract contract IDs
    const matchingContractIds = matchingContracts.map(c => c._id);

    // Find users who have at least one of the matching contracts
    const users = await User.find({
      role: { $ne: 'admin' },
      contracts: { $in: matchingContractIds }
    })
      .select('name email phone contracts')
      .populate({
        path: 'contracts',
        match: contractFilter, // Only populate matching contracts
        select: 'policyType startDate endDate premiumAmount',
        options: { sort: { startDate: -1 } }
      })
      .sort({ name: 1 });

    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users with contracts:', err);
    res.status(500).json({ error: 'Failed to fetch users with contracts' });
  }
};


// Get all messages (Superviseur only)
const getAllMessages = async (req, res) => {
  try {
    if (req.user.role !== 'superviseur') {
      return res.status(403).json({ error: 'Access denied: Supervisor role required' });
    }
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    res.status(500).json({ error: "Failed to fetch messages", details: error.message });
  }
};

module.exports = {
    getAllClaims,
    getClaimById,
    updateClaimStatus,
    deleteClaim,
    getUsersWithContractsOnly,
    getAllMessages
};
