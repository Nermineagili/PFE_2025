const mongoose = require('mongoose');
const express = require('express');
const { body } = require('express-validator');
const { 
  createContract, 
  finalizePayment, 
  getUserContracts, 
  handleStripeWebhook,
  getRenewableContracts,
  prepareRenewal,
  executeRenewal,
  fixContractStatuses
} = require('../controllers/ContratController');
const { authenticateToken, validateObjectId } = require('../middleware/authMiddleware');

const router = express.Router();
const stripeWebhookMiddleware = express.raw({type: 'application/json'});
// Middleware to validate contract IDs
const validateContractId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.contractId)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid contract ID format' 
    });
  }
  next();
};

// POST route to subscribe to a new contract (payment initiation)
router.post(
  '/subscribe',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('policyType')
      .isIn(['santé', 'voyage', 'automobile', 'responsabilité civile', 'habitation', 'professionnelle', 'transport'])
      .withMessage('Invalid policy type'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('premiumAmount').isNumeric().withMessage('Premium amount must be a number'),
    body('coverageDetails').notEmpty().withMessage('Coverage details are required')
  ],
  createContract
);

// Route to finalize a payment
router.post('/finalize-payment', finalizePayment);

// GET route to fetch all contracts for a user
router.get(
  '/:userId',
  authenticateToken,
  validateObjectId,
  getUserContracts
);

// Add this route - no auth needed as it's called by Stripe
router.post('/webhook', stripeWebhookMiddleware, handleStripeWebhook);
// Get contracts eligible for renewal
router.get(
  '/renewable/:userId',
  authenticateToken,
  validateObjectId,
  getRenewableContracts
);
router.post('/fix-statuses', fixContractStatuses);


// Prepare contract renewal
router.post(
  '/prepare-renewal/:contractId',
  authenticateToken,
  validateContractId,
  prepareRenewal
);

// Execute contract renewal
router.post(
  '/execute-renewal/:contractId',
  authenticateToken,
  validateContractId,
  executeRenewal
);

module.exports = router;