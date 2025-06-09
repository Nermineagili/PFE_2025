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
  fixContractStatuses,
  downloadContract
} = require('../controllers/ContratController');
const { authenticateToken, validateObjectId } = require('../middleware/authMiddleware');

const router = express.Router();
const stripeWebhookMiddleware = express.raw({type: 'application/json'});

const validateContractId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.contractId)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid contract ID format' 
    });
  }
  next();
};

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
    body('coverageDetails').notEmpty().withMessage('Coverage details are required'),
    body('signature').optional().isString().withMessage('Signature must be a string')
  ],
  createContract
);

router.post('/finalize-payment', finalizePayment);

router.get(
  '/:userId',
  authenticateToken,
  validateObjectId,
  getUserContracts
);

router.post('/webhook', stripeWebhookMiddleware, handleStripeWebhook);

router.get(
  '/renewable/:userId',
  authenticateToken,
  validateObjectId,
  getRenewableContracts
);

router.post('/fix-statuses', fixContractStatuses);

router.post(
  '/prepare-renewal/:contractId',
  authenticateToken,
  validateContractId,
  prepareRenewal
);

router.post(
  '/execute-renewal/:contractId',
  authenticateToken,
  validateContractId,
  executeRenewal
);

router.get(
  '/download/:contractId',
  authenticateToken,
  validateContractId,
  downloadContract
);

module.exports = router;