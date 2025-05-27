const Claim = require("../models/claim");
const User = require("../models/user");
const Contract = require('../models/Contract');
const ContactMessage = require("../models/ContactMessage.js");
const bcrypt = require('bcrypt');

const getAllClaims = async (req, res) => {
    try {
        const claims = await Claim.find()
            .populate("userId", "name email phone")
            // Removed .populate("contractId", "startDate endDate status policyType") since contractId no longer exists
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "All claims retrieved successfully",
            data: claims
        });
    } catch (err) {
        console.error("Error fetching claims:", err);
        res.status(500).json({ success: false, message: "Failed to fetch claims" });
    }
};

const getClaimById = async (req, res) => {
    try {
        const claim = await Claim.findById(req.params.id)
            .populate("userId", "name email phone");
            // Removed .populate("contractId", "startDate endDate status policyType") since contractId no longer exists

        if (!claim) return res.status(404).json({ success: false, message: "Claim not found" });
        res.status(200).json({
            success: true,
            message: "Claim retrieved successfully",
            data: claim
        });
    } catch (err) {
        console.error("Error fetching claim:", err);
        res.status(500).json({ success: false, message: "Failed to fetch claim" });
    }
};

const updateClaimStatus = async (req, res) => {
    try {
        const { status, comment } = req.body;
        if (!["pending", "approved", "rejected"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const supervisorId = req.user?._id; // Assuming authenticateToken sets req.user
        if (!supervisorId) {
            return res.status(401).json({ success: false, message: "Supervisor ID not found in token" });
        }

        const updateData = { status };
        if (comment && status === "rejected") {
            updateData.$push = { comments: { comment, supervisorId } };
        }

        const updatedClaim = await Claim.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate("userId", "name email phone");
        // Removed .populate("contractId", "startDate endDate status policyType") since contractId no longer exists

        if (!updatedClaim) return res.status(404).json({ success: false, message: "Claim not found" });

        res.status(200).json({
            success: true,
            message: "Claim status updated successfully",
            data: updatedClaim
        });
    } catch (err) {
        console.error("Error updating claim status:", err);
        res.status(500).json({ success: false, message: "Failed to update claim status" });
    }
};

const deleteClaim = async (req, res) => {
    try {
        const deletedClaim = await Claim.findByIdAndDelete(req.params.id);
        if (!deletedClaim) return res.status(404).json({ success: false, message: "Claim not found" });

        res.status(200).json({
            success: true,
            message: "Claim deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting claim:", err);
        res.status(500).json({ success: false, message: "Failed to delete claim" });
    }
};

const getUsersWithContractsOnly = async (req, res) => {
    try {
        const { policyType } = req.query;

        const contractFilter = policyType
            ? { policyType }
            : {};

        const matchingContracts = await Contract.find(contractFilter).select('_id');
        const matchingContractIds = matchingContracts.map(c => c._id);

        const users = await User.find({
            role: { $ne: 'admin' },
            contracts: { $in: matchingContractIds }
        })
            .select('name email phone contracts')
            .populate({
                path: 'contracts',
                match: contractFilter,
                select: 'policyType startDate endDate premiumAmount',
                options: { sort: { startDate: -1 } }
            })
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            message: "Users with contracts retrieved successfully",
            data: users
        });
    } catch (err) {
        console.error('Error fetching users with contracts:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch users with contracts' });
    }
};

const getAllMessages = async (req, res) => {
    try {
        if (req.user.role !== 'superviseur') {
            return res.status(403).json({ success: false, message: 'Access denied: Supervisor role required' });
        }
        const messages = await ContactMessage.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'name email');
        res.status(200).json({
            success: true,
            message: "Messages retrieved successfully",
            data: messages
        });
    } catch (error) {
        console.error('Error fetching messages:', error.message);
        res.status(500).json({ success: false, message: "Failed to fetch messages", details: error.message });
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