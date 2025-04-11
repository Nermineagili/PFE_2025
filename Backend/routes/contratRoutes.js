const express = require('express');
const { body } = require('express-validator');  // For input validation
const { createContract, getUserContracts } = require('../controllers/ContratController');
const { authenticateToken, validateObjectId } = require('../middleware/authMiddleware'); // Import middleware

const router = express.Router();

// POST route to subscribe to a new contract
router.post(
  '/subscribe',
  [
    body('userId').not().isEmpty().withMessage('User ID is required'),
    body('policyType').not().isEmpty().withMessage('Policy Type is required'),
    body('startDate').isDate().withMessage('Start date is required'),
    body('endDate').isDate().withMessage('End date is required'),
    body('premiumAmount').isNumeric().withMessage('Premium amount must be a number'),
    body('coverageDetails').not().isEmpty().withMessage('Coverage details are required'),
  ],
  createContract,authenticateToken, validateObjectId
);

// GET route to fetch all contracts for a user
router.get('/:userId', getUserContracts ,authenticateToken, validateObjectId);  // Ensure this is not `/contracts/:userId`
module.exports = router;
