const Claim = require("../models/claim");
const User = require("../models/user");
const Contract = require('../models/Contract');
const ContactMessage = require("../models/ContactMessage.js");
const bcrypt = require('bcrypt');

const getAllClaims = async (req, res) => {
    try {
        if (req.user.role !== 'superviseur') {
            return res.status(403).json({ success: false, message: "Access denied: Supervisor role required" });
        }

        const claims = await Claim.find()
            .populate("userId", "name email phone")
            .populate("contractId", "policyType startDate endDate status")
            .populate({
                path: "comments",
                populate: { path: "supervisorId", select: "name email" }
            })
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
        if (req.user.role !== 'superviseur') {
            return res.status(403).json({ success: false, message: "Access denied: Supervisor role required" });
        }

        const claim = await Claim.findById(req.params.id)
            .populate("userId", "name email phone")
            .populate("contractId", "policyType startDate endDate status")
            .populate({
                path: "comments",
                populate: { path: "supervisorId", select: "name email" }
            });

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
        if (req.user.role !== 'superviseur') {
            return res.status(403).json({ success: false, message: "Access denied: Supervisor role required" });
        }

        const { status, comment } = req.body;
        if (!["pending", "approved", "rejected"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const supervisorId = req.user._id;
        if (!supervisorId) {
            return res.status(401).json({ success: false, message: "Supervisor ID not found in token" });
        }

        const updateData = { status };
        if (comment && status !== "pending") {
            updateData.$push = { comments: { comment, supervisorId, createdAt: new Date() } };
        }

        const updatedClaim = await Claim.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate("userId", "name email phone")
        .populate("contractId", "policyType startDate endDate status")
        .populate({
            path: "comments",
            populate: { path: "supervisorId", select: "name email" }
        });

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
    console.log(`deleteClaim - Starting for ${req.params.id} at ${new Date().toISOString()}`);
    try {
        console.log(`deleteClaim - Finding claim ${req.params.id} at ${new Date().toISOString()}`);
        const claim = await Claim.findById(req.params.id);
        if (!claim) {
            console.log(`deleteClaim - Claim not found at ${new Date().toISOString()}`);
            return res.status(404).json({ success: false, message: "Claim not found" });
        }
        console.log(`deleteClaim - Found claim, contractId: ${claim.contractId} at ${new Date().toISOString()}`);

        console.log(`deleteClaim - Finding contract ${claim.contractId} at ${new Date().toISOString()}`);
        const startUpdate = Date.now();
        const contract = await Contract.findById(claim.contractId);
        if (!contract) {
            console.log(`deleteClaim - Contract not found for ${claim.contractId} at ${new Date().toISOString()}`);
            throw new Error(`Contract not found for ID: ${claim.contractId}`);
        }
        await Contract.findByIdAndUpdate(claim.contractId, { $pull: { claims: claim._id } });
        console.log(`deleteClaim - Contract updated in ${Date.now() - startUpdate}ms at ${new Date().toISOString()}`);

        console.log(`deleteClaim - Deleting claim ${req.params.id} at ${new Date().toISOString()}`);
        const startDelete = Date.now();
        const deletedClaim = await Claim.findByIdAndDelete(req.params.id);
        if (!deletedClaim) {
            console.log(`deleteClaim - Delete failed for ${req.params.id} at ${new Date().toISOString()}`);
            throw new Error("Claim deletion failed");
        }
        console.log(`deleteClaim - Claim deleted in ${Date.now() - startDelete}ms at ${new Date().toISOString()}`);

        res.status(200).json({ success: true, message: "Claim deleted successfully" });
    } catch (err) {
        console.error(`deleteClaim - Error: ${err.message} at ${new Date().toISOString()}`);
        res.status(500).json({ success: false, message: "Failed to delete claim", details: err.message });
    }
};
const getUsersWithContractsOnly = async (req, res) => {
    try {
        if (req.user.role !== 'superviseur') {
            return res.status(403).json({ success: false, message: "Access denied: Supervisor role required" });
        }

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

// Analyze claim with AI prediction
const analyzeClaim = async (req, res) => {
    try {
        if (req.user.role !== 'superviseur') {
            return res.status(403).json({ success: false, message: "Access denied: Supervisor role required" });
        }

        const { claimId } = req.params;
        const { prediction, probability_suspicieux } = req.body;
        const claim = await Claim.findById(claimId);
        if (!claim) {
            return res.status(404).json({ success: false, message: 'Claim not found' });
        }

        claim.prediction = prediction;
        claim.probability_suspicieux = probability_suspicieux;
        await claim.save();

        res.status(200).json({ success: true, claim });
    } catch (error) {
        console.error('Error updating claim:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            details: error.message,
        });
    }
};

module.exports = {
    getAllClaims,
    getClaimById,
    updateClaimStatus,
    deleteClaim,
    getUsersWithContractsOnly,
    getAllMessages,
    analyzeClaim
};