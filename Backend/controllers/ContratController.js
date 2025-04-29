const Contract = require('../models/Contract');
const User = require('../models/user');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/sendEmail');

// Ensure Stripe key is available
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set. Stripe functionality will not work.');
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Improved contract creation helper
const createContractRecord = async (userId, policyType, startDate, endDate, premiumAmount, coverageDetails, policyDetails, paymentIntentId, status = 'active') => {
  try {
    console.log('Creating contract with payment intent:', paymentIntentId);
    
    const contract = new Contract({
      userId,
      policyType,
      startDate,
      endDate,
      premiumAmount,
      coverageDetails,
      policyDetails,
      paymentIntentId,
      status
    });

    await contract.save();

    // Add contract to user
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User ${userId} not found`);
      return null;
    }
    
    user.contracts = user.contracts || [];
    user.contracts.push(contract._id);
    await user.save();

    // Send confirmation email
    try {
      const htmlContent = `
        <h2>Bonjour ${user.name || user.username},</h2>
        <p>Votre contrat <strong>${policyType}</strong> a été créé avec succès.</p>
        <p><strong>Détails :</strong></p>
        <ul>
          <li>Référence : ${contract._id}</li>
          <li>Date de début : ${new Date(startDate).toLocaleDateString()}</li>
          <li>Date de fin : ${new Date(endDate).toLocaleDateString()}</li>
          <li>Montant : ${premiumAmount} €</li>
        </ul>
      `;
      await sendEmail(user.email, 'Confirmation de contrat', htmlContent);
    } catch (emailError) {
      console.error('Email error:', emailError);
    }
    
    return contract;
  } catch (error) {
    console.error('Contract creation error:', error);
    return null;
  }
};

// Create contract endpoint - now creates contract immediately
exports.createContract = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      userId,
      policyType,
      startDate,
      endDate,
      premiumAmount,
      coverageDetails,
      policyDetails
    } = req.body;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // TESTING MODE - Create contract without payment
    if (req.query.testing === 'true') {
      const testPaymentId = `test_${Date.now()}`;
      const contract = await createContractRecord(
        userId, policyType, startDate, endDate, 
        premiumAmount, coverageDetails, policyDetails, 
        testPaymentId
      );
      
      return res.status(201).json({
        message: 'Test contract created',
        contract,
        paymentIntentId: testPaymentId
      });
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(premiumAmount * 100),
      currency: 'eur',
      metadata: { 
        userId,
        policyType,
        startDate,
        endDate,
        premiumAmount,
        coverageDetails: coverageDetails.substring(0, 500),
        policyDetails: JSON.stringify(policyDetails).substring(0, 500)
      }
    });

    // Create contract in "pending" status
    const contract = await createContractRecord(
      userId, policyType, startDate, endDate,
      premiumAmount, coverageDetails, policyDetails,
      paymentIntent.id,
      'pending_payment' // Initial status
    );

    if (!contract) {
      return res.status(500).json({ 
        message: 'Contract creation failed',
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    }

    res.status(200).json({
      message: 'Payment ready - contract created',
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      contract
    });
    
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ 
      message: 'Subscription failed',
      error: error.message 
    });
  }
};

// Finalize payment endpoint - simplified
exports.finalizePayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Payment Intent ID required' });
    }
    
    // Verify payment succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        success: false,
        message: `Payment not completed (status: ${paymentIntent.status})`
      });
    }

    // Find and update contract
    const contract = await Contract.findOneAndUpdate(
      { paymentIntentId },
      { status: 'active' },
      { new: true }
    );

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found for this payment'
      });
    }

    res.status(200).json({
      success: true,
      contract,
      paymentIntent
    });

  } catch (error) {
    console.error('Finalization error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Webhook handler remains mostly the same
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook Error');
  }
  
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Update existing contract if found
        await Contract.findOneAndUpdate(
          { paymentIntentId: paymentIntent.id },
          { status: 'active' }
        );
        break;
        
      default:
        console.log(`Unhandled event: ${event.type}`);
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
  }

  res.status(200).send({ received: true });
};

// Keep existing getUserContracts function
exports.getUserContracts = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate('contracts');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user.contracts || []);
  } catch (error) {
    console.error('Contracts fetch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};