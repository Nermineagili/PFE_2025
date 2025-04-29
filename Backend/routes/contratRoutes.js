const express = require('express');
const { body } = require('express-validator');
const { createContract, finalizePayment, getUserContracts, handleStripeWebhook } = require('../controllers/ContratController');
const { authenticateToken, validateObjectId } = require('../middleware/authMiddleware');

// This middleware is needed to get the raw body for webhook signature verification
const stripeWebhookMiddleware = express.raw({type: 'application/json'});
const router = express.Router();

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

// Route to finalize a test payment
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

module.exports = router;