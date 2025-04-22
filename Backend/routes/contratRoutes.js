const express = require('express');
const { body } = require('express-validator');
const { createContract, confirmContractPayment, getUserContracts } = require('../controllers/ContratController');
const { authenticateToken, validateObjectId } = require('../middleware/authMiddleware');

// This middleware is needed to get the raw body for webhook signature verification
const stripeWebhookMiddleware = express.raw({type: 'application/json'});
const router = express.Router();

// POST route to subscribe to a new contract (payment initiation)
// Update the policyType validation to include 'transport'
router.post(
  '/subscribe',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('policyType')
      .isIn(['santé', 'voyage', 'automobile', 'responsabilité civile', 'habitation', 'professionnelle', 'transport'])
      .withMessage('Invalid policy type'),
    // ... rest of the validations
  ],
  createContract
);

// Similarly update the confirm-payment route
router.post(
  '/confirm-payment',
  [
    body('policyType')
      .isIn(['santé', 'voyage', 'automobile', 'responsabilité civile', 'habitation', 'professionnelle', 'transport'])
      .withMessage('Invalid policy type'),
    // ... rest of the validations
  ],
  confirmContractPayment
);

// GET route to fetch all contracts for a user
router.get(
  '/:userId',
  authenticateToken,
  validateObjectId,
  getUserContracts
);
// Add to your routes file


// Add this route - no auth needed as it's called by Stripe
// router.post('/webhook', stripeWebhookMiddleware, handleStripeWebhook);

module.exports = router;
