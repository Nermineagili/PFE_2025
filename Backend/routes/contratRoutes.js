const express = require('express');
const { body } = require('express-validator');
const { createContract, getUserContracts } = require('../controllers/ContratController');
const { authenticateToken, validateObjectId } = require('../middleware/authMiddleware');

const router = express.Router();

// POST route to subscribe to a new contract
router.post(
  '/subscribe',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('policyType')
      .isIn(['santé', 'voyage', 'automobile', 'responsabilité civile', 'habitation', 'professionnelle'])
      .withMessage('Invalid policy type'),
    body('startDate').isISO8601().toDate().withMessage('Start date is required and must be a valid date'),
    body('endDate').isISO8601().toDate().withMessage('End date is required and must be a valid date'),
    body('premiumAmount').isNumeric().withMessage('Premium amount must be a number'),
    body('coverageDetails').notEmpty().withMessage('Coverage details are required'),
    // policyDetails is optional and flexible (you can add custom validation later if needed)
    authenticateToken,
    validateObjectId
  ],
  createContract
);

// GET route to fetch all contracts for a user
router.get(
  '/:userId',
  authenticateToken,
  validateObjectId,
  getUserContracts
);

module.exports = router;
