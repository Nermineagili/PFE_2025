const Claim = require('../models/claim');
const User = require('../models/user');
const Contract = require('../models/Contract');
const cloudinary = require('../cloudinary');
const fs = require('fs');

const submitClaim = async (req, res) => {
    try {
        const {
            userId,
            contractId,
            firstName,
            lastName,
            birthDate,
            profession,
            phone,
            email,
            postalAddress,
            incidentType,
            incidentDate,
            incidentTime,
            incidentLocation,
            incidentDescription,
            damages,
            thirdPartyInvolved,
            thirdPartyDetails
        } = req.body;

        if (!userId || !contractId) {
            return res.status(400).json({ success: false, message: "userId and contractId are required" });
        }

        const user = await User.findById(userId).populate('contracts');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!user.contracts || user.contracts.length === 0) {
            return res.status(403).json({ 
                success: false, 
                message: "You must have at least one contract to submit a claim." 
            });
        }

        const now = new Date();
        const activeContracts = user.contracts.filter(contract => {
            return contract.status === 'active' && 
                   new Date(contract.startDate) <= now && 
                   new Date(contract.endDate) >= now;
        });

        console.log('Active contracts found:', activeContracts.length);

        if (activeContracts.length === 0) {
            return res.status(403).json({ 
                success: false, 
                message: "You must have at least one active contract to submit a claim. Please check your contract status or contact support." 
            });
        }

        const selectedContract = activeContracts.find(c => c._id.toString() === contractId);
        if (!selectedContract) {
            return res.status(403).json({ 
                success: false, 
                message: "Selected contract is not active or does not belong to you." 
            });
        }

        const files = req.files || [];
        console.log('Number of files received:', files.length);
        const supportingFiles = files.length > 0
            ? await Promise.all(
                files.map(async (file) => {
                    try {
                        console.log('Uploading file:', file.originalname, 'Size:', file.size);
                        const result = await cloudinary.uploader.upload(file.path, {
                            folder: 'insurance_app/claims',
                            resource_type: 'auto',
                            timeout: 120000
                        });

                        console.log('Cloudinary Upload Result:', result);

                        if (!result || !result.public_id || !result.secure_url) {
                            throw new Error('Cloudinary upload did not return expected result');
                        }

                        fs.unlink(file.path, (err) => {
                            if (err) console.error('Failed to delete temp file:', err);
                        });

                        return {
                            publicId: result.public_id,
                            url: result.secure_url,
                            fileName: file.originalname,
                            fileType: file.mimetype
                        };
                    } catch (uploadError) {
                        console.error('File upload failed:', uploadError.message);
                        throw new Error('Failed to upload file to Cloudinary');
                    }
                })
            )
            : [];

        const newClaim = new Claim({
            userId,
            contractId,
            firstName,
            lastName,
            birthDate,
            profession,
            phone,
            email,
            postalAddress,
            incidentType,
            incidentDate,
            incidentTime,
            incidentLocation,
            incidentDescription,
            damages,
            thirdPartyInvolved,
            thirdPartyDetails: thirdPartyInvolved ? thirdPartyDetails : undefined,
            supportingFiles
        });

        await newClaim.save();
        selectedContract.claims.push(newClaim._id);
        await selectedContract.save();

        res.status(201).json({
            success: true,
            message: "Claim submitted successfully",
            data: newClaim,
            activeContracts: activeContracts.map(contract => ({
                _id: contract._id,
                policyType: contract.policyType,
                startDate: contract.startDate,
                endDate: contract.endDate,
                status: contract.status
            }))
        });

    } catch (error) {
        console.error("Error submitting claim:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getUserClaims = async (req, res) => {
    try {
        const userId = req.params.userId;

        const claims = await Claim.find({ userId })
            .populate("userId", "name email phone")
            .populate("contractId", "policyType startDate endDate status")
            .populate({
                path: "comments",
                populate: { path: "supervisorId", select: "name email" }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Claims retrieved successfully",
            data: claims
        });
    } catch (err) {
        console.error("Error fetching user claims:", err);
        res.status(500).json({ success: false, message: "Failed to fetch user claims" });
    }
};

const getUserClaimById = async (req, res) => {
    try {
        const { userId, claimId } = req.params;

        const claim = await Claim.findOne({ _id: claimId, userId })
            .populate("userId", "name email phone")
            .populate("contractId", "policyType startDate endDate status")
            .populate({
                path: "comments",
                populate: { path: "supervisorId", select: "name email" }
            });

        if (!claim) {
            return res.status(404).json({ success: false, message: "Claim not found or does not belong to this user" });
        }

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

const downloadClaimFile = async (req, res) => {
    try {
        const { claimId, fileId } = req.params;

        const claim = await Claim.findById(claimId);
        if (!claim) {
            return res.status(404).json({ success: false, message: "Claim not found" });
        }

        const file = claim.supportingFiles.id(fileId);
        if (!file) {
            return res.status(404).json({ success: false, message: "File not found" });
        }

        res.redirect(file.url);
    } catch (error) {
        console.error("Error downloading claim file:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    submitClaim,
    getUserClaims,
    getUserClaimById,
    downloadClaimFile
};