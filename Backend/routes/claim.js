const express = require('express');
const router = express.Router();
const { submitClaim , getUserClaimById,getUserClaims } = require('../controllers/claimController');

// POST request to submit a claim
router.post('/submit', submitClaim);
// Get all claims of a user
router.get("/user/:userId", getUserClaims);

// Get a specific claim of a user
router.get("/user/:userId/:claimId", getUserClaimById);

module.exports = router;
