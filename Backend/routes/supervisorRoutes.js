const express = require('express');
const router = express.Router();
const {
    authenticateToken,
    checkSupervisor,
    validateObjectId
} = require('../middleware/authMiddleware');

const {
    getAllClaims,
    getClaimById,
    updateClaimStatus,
    deleteClaim,
    getUsersWithContractsOnly
   
} = require('../controllers/supervisorActions');

// Claims management
router.get('/claims', authenticateToken, checkSupervisor, getAllClaims);
router.get('/claims/:id', authenticateToken, checkSupervisor, validateObjectId, getClaimById);
router.put('/claims/:id', authenticateToken, checkSupervisor, validateObjectId, updateClaimStatus);
router.delete('/claims/:id', authenticateToken, checkSupervisor, validateObjectId, deleteClaim);

// View users with contracts (supervisor access)
router.get('/users-with-contracts-only', authenticateToken, checkSupervisor, getUsersWithContractsOnly);

// Messages management
// router.get('/messages', authenticateToken, checkSupervisor, getAllMessages);

module.exports = router;