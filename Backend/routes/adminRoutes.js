const express = require('express');
const router = express.Router();
const { authenticateToken, checkAdmin, validateObjectId } = require('../middleware/authMiddleware');
const {
    createUser,
    getAllUsers, 
    updateUser, 
    deleteUser, 
    getUserById,
    getAllUsersWithContracts, 
    getUsersWithContractsOnly,
    searchUsers
} = require("../controllers/adminActions");

// User Management
router.get('/users', authenticateToken, checkAdmin, getAllUsers);
router.get('/users-with-contracts', authenticateToken, checkAdmin, getAllUsersWithContracts);
router.get('/users-with-contracts-only', authenticateToken, checkAdmin, getUsersWithContractsOnly);
router.put('/users/:id', authenticateToken, checkAdmin,  updateUser);
router.delete('/users/:id', authenticateToken, checkAdmin,  deleteUser);
router.get('/users/:id', authenticateToken, checkAdmin,  getUserById);
router.post('/users', authenticateToken, checkAdmin, createUser);
router.get('/search-users', authenticateToken, checkAdmin, searchUsers);

module.exports = router;