const Contract = require('../models/Contract');
const User = require('../models/user');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/sendEmail');

// Ensure Stripe key is available
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set. Stripe functionality will not work.');
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Helper function to create a contract record after successful payment
const createContractAfterPayment = async (userId, policyType, startDate, endDate, premiumAmount, coverageDetails, policyDetails) => {
  try {
    // Create a new contract
    const contract = new Contract({
      userId,
      policyType,
      startDate,
      endDate,
      premiumAmount,
      coverageDetails,
      policyDetails
    });

    await contract.save();

    // Add contract to user
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User with ID ${userId} not found when creating contract`);
      return null;
    }
    
    user.contracts.push(contract._id);
    await user.save();

    // Send confirmation email to the user
    const htmlContent = `
      <h2>Bonjour ${user.name || user.username},</h2>
      <p>Merci pour votre souscription au contrat <strong>${policyType}</strong>.</p>
      <p>Votre demande a été enregistrée avec succès et est en cours de traitement.</p>
      <p><strong>Détails du contrat :</strong></p>
      <ul>
        <li>Date de début : ${new Date(startDate).toLocaleDateString()}</li>
        <li>Date de fin : ${new Date(endDate).toLocaleDateString()}</li>
        <li>Montant de la prime : ${premiumAmount} €</li>
      </ul>
      <br/>
      <p>Nous vous remercions pour votre confiance.</p>
    `;

    await sendEmail(user.email, 'Confirmation de souscription à un contrat', htmlContent);
    
    return contract;
  } catch (error) {
    console.error('Error creating contract after payment:', error);
    return null;
  }
};

// Create a new contract (subscription)
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

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a PaymentIntent with Stripe using the premiumAmount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(premiumAmount * 100),
      currency: 'eur',
      metadata: { 
        userId: userId.toString(),
        policyType,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        premiumAmount: premiumAmount.toString(),
        coverageDetails: coverageDetails.substring(0, 500) // Limit length for metadata
      },
    });

    // Send clientSecret back to frontend to proceed with the payment
    res.status(200).json({
      message: 'Payment Intent created successfully.',
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id, // Include the ID so the frontend can reference it later
      contractDetails: {
        userId,
        policyType,
        startDate,
        endDate,
        premiumAmount,
        coverageDetails,
        policyDetails
      }
    });
    
  } catch (error) {
    console.error('Error creating contract or payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Handle saving the contract after successful payment (This would be triggered from frontend once payment is confirmed)
exports.confirmContractPayment = async (req, res) => {
  const { userId, policyType, startDate, endDate, premiumAmount, coverageDetails, policyDetails, paymentIntentId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent) {
      return res.status(404).json({ message: 'Payment intent not found' });
    }

    if (paymentIntent.status === 'succeeded') {
      // Create the contract using our helper function
      const contract = await createContractAfterPayment(
        userId, 
        policyType, 
        startDate, 
        endDate, 
        premiumAmount, 
        coverageDetails, 
        policyDetails
      );

      if (!contract) {
        return res.status(500).json({ message: 'Failed to create contract after payment' });
      }

      res.status(201).json({
        message: 'Contract created successfully and confirmation email sent',
        contract,
      });
    } else {
      res.status(400).json({ 
        message: 'Payment not successful', 
        status: paymentIntent.status 
      });
    }
  } catch (error) {
    console.error('Error confirming payment or creating contract:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all contracts for a user
exports.getUserContracts = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user and populate the contracts
    const user = await User.findById(userId).populate('contracts');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.contracts || user.contracts.length === 0) {
      return res.status(200).json({ message: 'No contracts found', contracts: [] });
    }

    res.status(200).json(user.contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Handle Stripe webhook events
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set. Webhook verification will not work.');
    return res.status(500).send('Webhook Error: Webhook secret not configured');
  }
  
  let event;

  try {
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(
      req.rawBody, // You'll need to configure express to provide this
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        // Extract metadata
        const { 
          userId, 
          policyType, 
          startDate, 
          endDate, 
          premiumAmount, 
          coverageDetails 
        } = paymentIntent.metadata;
        
        // Check if a contract already exists with this payment intent to avoid duplicates
        const existingContract = await Contract.findOne({ 
          userId: userId,
          // You might want to add a paymentIntentId field to your Contract schema
          // and use that for deduplication
          startDate: new Date(startDate)
        });
        
        if (!existingContract) {
          // Create contract based on this payment using our helper function
          const contract = await createContractAfterPayment(
            userId,
            policyType,
            new Date(startDate),
            new Date(endDate),
            parseFloat(premiumAmount),
            coverageDetails,
            {} // policyDetails might not be in metadata, use empty object as default
          );
          
          if (contract) {
            console.log(`Contract created via webhook for user ${userId}, policy type ${policyType}`);
          } else {
            console.error(`Failed to create contract via webhook for user ${userId}`);
          }
        } else {
          console.log(`Skipping duplicate contract creation for payment ${paymentIntent.id}`);
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log(`Payment failed for intent ${failedPayment.id}`);
        // You could notify the user or update a pending contract status
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    // We still return 200 to acknowledge receipt, even if processing failed
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).send({ received: true });
};