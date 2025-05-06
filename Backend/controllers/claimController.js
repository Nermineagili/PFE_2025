const Claim = require('../models/claim');
const User = require('../models/user');

const submitClaim = async (req, res) => {
    try {
        const {
            userId,
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

        // 1️⃣ Validate if user exists
        const user = await User.findById(userId).populate('contracts');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // 2️⃣ Check if user has at least one contract
        if (!user.contracts || user.contracts.length === 0) {
            return res.status(403).json({ success: false, message: "You need a valid contract to submit a claim." });
        }

        // Optional: Check if any contract is still active
        const now = new Date();
        const hasActiveContract = user.contracts.some(contract =>
            new Date(contract.startDate) <= now && new Date(contract.endDate) >= now
        );

        if (!hasActiveContract) {
            return res.status(403).json({ success: false, message: "You do not have any active contracts." });
        }

        // 3️⃣ Create the claim
        const newClaim = new Claim({
            userId,
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
            incidentDescription
        });

        await newClaim.save();

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

module.exports = {
    submitClaim,
    getUserClaims,
    getUserClaimById,
};