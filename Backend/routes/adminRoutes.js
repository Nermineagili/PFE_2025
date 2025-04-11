const express = require('express');
const router = express.Router();
const { authenticateToken, checkAdmin, validateObjectId } = require('../middleware/authMiddleware');
const { getAllUsers, updateUser, deleteUser, getUserById } = require('../controllers/adminActions');
const { getAllClaims, getClaimById, updateClaimStatus, deleteClaim } = require("../controllers/adminActions");
// User management routes (Admin only)
router.get('/users', authenticateToken, checkAdmin, getAllUsers);
router.put('/users/:id', authenticateToken, checkAdmin, validateObjectId, updateUser);
router.delete('/users/:id', authenticateToken, checkAdmin, validateObjectId, deleteUser);
router.get('/users/:id',authenticateToken, checkAdmin, validateObjectId, getUserById); // Get user by ID


// Claim Management Routes (Admin Only)
router.get("/claims", authenticateToken, checkAdmin, getAllClaims);
router.get("/claims/:id", authenticateToken, checkAdmin, validateObjectId, getClaimById);
router.put("/claims/:id", authenticateToken, checkAdmin, validateObjectId, updateClaimStatus);
router.delete("/claims/:id", authenticateToken, checkAdmin, validateObjectId, deleteClaim);
module.exports = router;