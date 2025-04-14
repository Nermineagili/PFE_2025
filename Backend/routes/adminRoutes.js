const express = require('express');
const router = express.Router();
const { authenticateToken, checkAdmin, validateObjectId } = require('../middleware/authMiddleware');
const {
    createUser,getAllUsers, updateUser, deleteUser, getUserById,
    
    getAllUsersWithContracts, getUsersWithContractsOnly
} = require("../controllers/adminActions");

// User Management
router.get('/users', authenticateToken, checkAdmin, getAllUsers);
router.get('/users-with-contracts', authenticateToken, checkAdmin, getAllUsersWithContracts);
router.get('/users-with-contracts-only', authenticateToken, checkAdmin, getUsersWithContractsOnly);
router.put('/users/:id', authenticateToken, checkAdmin, validateObjectId, updateUser);
router.delete('/users/:id', authenticateToken, checkAdmin, validateObjectId, deleteUser);
router.get('/users/:id', authenticateToken, checkAdmin, validateObjectId, getUserById);
router.post('/users',authenticateToken, checkAdmin,createUser);

module.exports = router;
