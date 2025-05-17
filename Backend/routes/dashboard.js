const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardActions');
const { authenticateToken, checkAdminOrSupervisor, validateObjectId } = require('../middleware/authMiddleware');

// Routes for users
router.get('/users', authenticateToken, checkAdminOrSupervisor, dashboardController.getAllUsers);
router.get('/users/:id', authenticateToken, checkAdminOrSupervisor, validateObjectId, dashboardController.getUserById);
router.get('/users-with-contracts', authenticateToken, checkAdminOrSupervisor, dashboardController.getAllUsersWithContracts);
router.get('/users-with-contracts-only', authenticateToken, checkAdminOrSupervisor, dashboardController.getUsersWithContractsOnly);

// Routes for claims
router.get('/claims', authenticateToken, checkAdminOrSupervisor, dashboardController.getAllClaims);
router.get('/claims/:id', authenticateToken, checkAdminOrSupervisor, validateObjectId, dashboardController.getClaimById);

// Routes for contracts
router.get('/contracts', authenticateToken, checkAdminOrSupervisor, dashboardController.getAllContracts);

// Routes for dashboard statistics and charts
router.get('/stats', authenticateToken, checkAdminOrSupervisor, dashboardController.getDashboardStats);
router.get('/policy-types', authenticateToken, checkAdminOrSupervisor, dashboardController.getPolicyTypeDistribution);
router.get('/contract-activity', authenticateToken, checkAdminOrSupervisor, dashboardController.getContractActivityByMonth);

module.exports = router;