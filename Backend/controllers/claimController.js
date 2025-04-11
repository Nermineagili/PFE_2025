const Claim = require('../models/claim');
const User = require('../models/user');

const submitClaim = async (req, res) => {
    try {
        const { userId, birthDate, sexe, phone, address, postalAddress, city, postalCode, email, stateProvince, incidentDescription } = req.body;

        console.log("Received userId:", userId); // Debugging

        // 1️⃣ Validate if user exists
        const user = await User.findById(userId);
        if (!user) {
            console.log("User not found!");
            return res.status(404).json({ success: false, message: "User not found" });
        }

        console.log("User found:", user); // Debugging

        // 2️⃣ Create the claim
        const newClaim = new Claim({
            userId,
            firstName: user.name,  // Retrieved from database
            lastName: user.lastname,    // Retrieved from database
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

        if (!claims.length) {
            return res.status(404).json({ message: "No claims found for this user" });
        }

        res.json(claims);
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