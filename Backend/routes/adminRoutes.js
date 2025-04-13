const express = require('express');
const router = express.Router();
const { authenticateToken, checkAdmin, validateObjectId } = require('../middleware/authMiddleware');
const {
    getAllUsers, updateUser, deleteUser, getUserById,
    getAllClaims, getClaimById, updateClaimStatus, deleteClaim,
    getAllUsersWithContracts, getUsersWithContractsOnly
} = require("../controllers/adminActions");

// User Management
router.get('/users', authenticateToken, checkAdmin, getAllUsers);
router.get('/users-with-contracts', authenticateToken, checkAdmin, getAllUsersWithContracts);
router.get('/users-with-contracts-only', authenticateToken, checkAdmin, getUsersWithContractsOnly);
router.put('/users/:id', authenticateToken, checkAdmin, validateObjectId, updateUser);
router.delete('/users/:id', authenticateToken, checkAdmin, validateObjectId, deleteUser);
router.get('/users/:id', authenticateToken, checkAdmin, validateObjectId, getUserById);

// Claim Management
router.get("/claims", authenticateToken, checkAdmin, getAllClaims);
router.get("/claims/:id", authenticateToken, checkAdmin, validateObjectId, getClaimById);
router.put("/claims/:id", authenticateToken, checkAdmin, validateObjectId, updateClaimStatus);
router.delete("/claims/:id", authenticateToken, checkAdmin, validateObjectId, deleteClaim);

module.exports = router;
