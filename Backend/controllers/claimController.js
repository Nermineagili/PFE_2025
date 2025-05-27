const Claim = require('../models/claim');
const User = require('../models/user');
const Contract = require('../models/Contract');
const cloudinary = require('../cloudinary'); // Assuming cloudinary config is in a separate file
const fs = require('fs');

const submitClaim = async (req, res) => {
    try {
        const {
            userId,
            contractId,
            birthDate,
            sexe,
            phone,
            address,
            postalAddress,
            city,
            postalCode,
            email,
            stateProvince,
            incidentDescription
        } = req.body;

        // Validate required fields
        if (!userId) {
            return res.status(400).json({ success: false, message: "userId is required" });
        }
        if (!contractId) {
            return res.status(400).json({ success: false, message: "contractId is required" });
        }

        // 1️⃣ Validate if user exists
        const user = await User.findById(userId).populate('contracts');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // 2️⃣ Validate the contract
        const contract = await Contract.findOne({ _id: contractId, userId });
        if (!contract) {
            return res.status(403).json({ success: false, message: "Contract not found or does not belong to this user." });
        }

        const now = new Date();
        if (new Date(contract.startDate) > now || new Date(contract.endDate) < now || contract.status !== 'active') {
            return res.status(403).json({ success: false, message: "The selected contract is not active or valid." });
        }

        // 3️⃣ Handle uploaded files with Multer
        const files = req.files || [];
        console.log('Number of files received:', files.length); // Debug log
        const supportingFiles = files.length > 0
            ? await Promise.all(
                files.map(async (file) => {
                    try {
                        console.log('Uploading file:', file.originalname, 'Size:', file.size); // Debug log
                        const result = await cloudinary.uploader.upload(file.path, {
                            folder: 'insurance_app/claims',
                            resource_type: 'auto',
                            timeout: 120000 // 120-second timeout
                        });

                        console.log('Cloudinary Upload Result:', result); // Debug log

                        if (!result || !result.public_id || !result.secure_url) {
                            throw new Error('Cloudinary upload did not return expected result');
                        }

                        // Delete the temporary file
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

        // 4️⃣ Create the claim with supporting files
        const newClaim = new Claim({
            userId,
            contractId,
            firstName: user.name,
            lastName: user.lastname,
            birthDate,
            sexe,
            phone,
            address,
            postalAddress,
            city,
            postalCode,
            email,
            stateProvince,
            incidentDescription,
            supportingFiles
        });

        // 5️⃣ Save the claim and update the contract
        await newClaim.save();
        contract.claims.push(newClaim._id);
        await contract.save();

        res.status(201).json({
            success: true,
            message: "Claim submitted successfully",
            data: newClaim
        });

    } catch (error) {
        console.error("Error submitting claim:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Get all claims of a specific user
const getUserClaims = async (req, res) => {
    try {
        const userId = req.params.userId;

        const claims = await Claim.find({ userId }).sort({ createdAt: -1 });

        return res.status(200).json(claims); 
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user claims" });
    }
};

// Get a specific claim of a user
const getUserClaimById = async (req, res) => {
    try {
        const { userId, claimId } = req.params;

        const claim = await Claim.findOne({ _id: claimId, userId });

        if (!claim) {
            return res.status(404).json({ error: "Claim not found or does not belong to this user" });
        }

        res.json(claim);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch claim" });
    }
};
// Download a supporting file
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