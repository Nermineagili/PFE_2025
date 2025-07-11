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
    getUsersWithContractsOnly,
    analyzeClaim 
   
} = require('../controllers/supervisorActions');
// In supervisorRoutes.js, before the router definition
router.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.path} at ${new Date().toISOString()}`);
    next();
});

router.delete('/claims/:id', authenticateToken, checkSupervisor, validateObjectId, (req, res, next) => {
    console.log(`Entering deleteClaim handler for ${req.params.id} at ${new Date().toISOString()}`);
    next();
}, deleteClaim);
// Claims management
router.get('/claims', authenticateToken, checkSupervisor, getAllClaims);
router.get('/claims/:id', authenticateToken, checkSupervisor, validateObjectId, getClaimById);
router.put('/claims/:id', authenticateToken, checkSupervisor, validateObjectId, updateClaimStatus);
router.delete('/claims/:id', authenticateToken, checkSupervisor, validateObjectId, (req, res, next) => {
    console.log(`Entering deleteClaim handler for ${req.params.id} at ${new Date().toISOString()}`);
    next();
}, deleteClaim);
// View users with contracts (supervisor access)
router.get('/users-with-contracts-only', authenticateToken, checkSupervisor, getUsersWithContractsOnly);
router.post('/claims/analyze/:claimId', validateObjectId('claimId'), authenticateToken, checkSupervisor, analyzeClaim); // Add this route
// Messages management
// router.get('/messages', authenticateToken, checkSupervisor, getAllMessages);

module.exports = router;