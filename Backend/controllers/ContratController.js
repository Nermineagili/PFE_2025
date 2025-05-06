const mongoose = require('mongoose');
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
      payment_method: 'pm_card_visa', // Test card
      confirm: true, // This confirms immediately
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
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
    // Check payment status immediately
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        message: 'Payment failed',
        paymentIntent
      });
    }
    // Create contract in "pending" status
    const contract = await createContractRecord(
      userId, policyType, startDate, endDate,
      premiumAmount, coverageDetails, policyDetails,
      paymentIntent.id,
      'active' // Set to active immediately
    );

    if (!contract) {
      return res.status(500).json({ 
        message: 'Contract creation failed',
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    }

    res.status(201).json({
      message: 'Contract created and payment processed',
      contract, // Include the full contract object
      paymentIntentId: paymentIntent.id
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

// FIXED: Prepare contract renewal - Fixed authenticated user check
exports.prepareRenewal = async (req, res) => {
  try {
    const { contractId } = req.params;
    
    // Validate contract ID format
    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid contract ID format',
        contractId
      });
    }

    // Find the contract
    const expiringContract = await Contract.findById(contractId);
    if (!expiringContract) {
      return res.status(404).json({ 
        success: false,
        message: 'Contract not found',
        contractId
      });
    }

    // Check if contract is eligible for renewal
    if (expiringContract.status !== 'active' && expiringContract.status !== 'expired') {
      return res.status(400).json({ 
        success: false,
        message: 'Contract is not eligible for renewal',
        currentStatus: expiringContract.status,
        requiredStatus: ['active', 'expired']
      });
    }

    // Check if contract belongs to the requesting user - FIXED: Check from JWT token
    const userIdFromToken = req.user ? req.user._id : null;
    
    // If we have user from token, verify ownership
    if (userIdFromToken && expiringContract.userId.toString() !== userIdFromToken.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to renew this contract'
      });
    }

    // Calculate new dates (1 year extension)
    const newStartDate = new Date(expiringContract.endDate);
    const newEndDate = new Date(newStartDate);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);

    // Prepare renewal data
    const renewalData = {
      renewalOffered: true,
      renewalPremium: expiringContract.premiumAmount * 1.1, // 10% increase
      renewalCoverage: expiringContract.coverageDetails,
      renewalPolicyDetails: expiringContract.policyDetails,
      newStartDate: newStartDate.toISOString(),
      newEndDate: newEndDate.toISOString()
    };

    // Update contract with renewal data
    expiringContract.renewalData = renewalData;
    await expiringContract.save();

    res.status(200).json({
      success: true,
      message: 'Renewal prepared successfully',
      renewalData,
      contract: expiringContract
    });

  } catch (error) {
    console.error('Renewal preparation error:', {
      message: error.message,
      stack: error.stack,
      contractId: req.params.contractId,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Internal server error while preparing renewal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// FIXED: Execute contract renewal - Added more validation and better error handling
exports.executeRenewal = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { paymentMethodId } = req.body;
    
    if (!paymentMethodId) {
      return res.status(400).json({ 
        success: false,
        message: 'Payment method ID is required' 
      });
    }

    // Find and validate the contract to renew
    const contractToRenew = await Contract.findById(contractId);
    if (!contractToRenew) {
      return res.status(404).json({ 
        success: false,
        message: 'Contract not found' 
      });
    }
    
    if (!contractToRenew.renewalData?.renewalOffered) {
      return res.status(400).json({ 
        success: false,
        message: 'Renewal not prepared for this contract' 
      });
    }

    // Calculate new contract dates
    const newStartDate = contractToRenew.status === 'expired' && new Date(contractToRenew.endDate) < new Date() 
      ? new Date() 
      : new Date(contractToRenew.endDate);
    
    const newEndDate = new Date(newStartDate);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);

    try {
      // Process payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(contractToRenew.renewalData.renewalPremium * 100),
        currency: 'eur',
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        metadata: { 
          userId: contractToRenew.userId.toString(),
          policyType: contractToRenew.policyType,
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString(),
          premiumAmount: contractToRenew.renewalData.renewalPremium,
          isRenewal: 'true',
          originalContractId: contractId
        }
      });

      // Create new contract
      const newContract = await createContractRecord(
        contractToRenew.userId,
        contractToRenew.policyType,
        newStartDate,
        newEndDate,
        contractToRenew.renewalData.renewalPremium,
        contractToRenew.renewalData.renewalCoverage,
        contractToRenew.renewalData.renewalPolicyDetails,
        paymentIntent.id,
        paymentIntent.status === 'succeeded' ? 'active' : 'pending_payment'
      );

      if (!newContract) {
        return res.status(500).json({ 
          success: false,
          message: 'Contract renewal failed'
        });
      }

      // Archive the old contract
      await Contract.findByIdAndUpdate(
        contractId,
        { 
          status: 'archived',
          archivedAt: new Date(),
          replacedBy: newContract._id,
          archiveReason: 'renewed'
        }
      );

      // Send confirmation email
      try {
        const user = await User.findById(contractToRenew.userId);
        if (user) {
          await sendEmail(
            user.email,
            'Confirmation de renouvellement',
            generateRenewalEmailContent(user, contractToRenew, newContract)
          );
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      res.status(200).json({
        success: true,
        message: 'Renewal processed successfully. Old contract archived.',
        newContract,
        archivedContractId: contractId
      });

    } catch (stripeError) {
      console.error('Payment error:', stripeError);
      res.status(400).json({ 
        success: false,
        message: 'Payment failed',
        error: stripeError.message 
      });
    }
  } catch (error) {
    console.error('Renewal error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Renewal execution failed',
      error: error.message 
    });
  }
};

// Helper function for email content
function generateRenewalEmailContent(user, oldContract, newContract) {
  return `
    <h2>Bonjour ${user.name || user.username},</h2>
    <p>Votre contrat <strong>${oldContract.policyType}</strong> a été renouvelé avec succès.</p>
    
    <h3>Ancien contrat archivé</h3>
    <ul>
      <li>Référence: ${oldContract._id}</li>
      <li>Date de fin: ${new Date(oldContract.endDate).toLocaleDateString()}</li>
    </ul>
    
    <h3>Nouveau contrat</h3>
    <ul>
      <li>Référence: ${newContract._id}</li>
      <li>Date de début: ${new Date(newContract.startDate).toLocaleDateString()}</li>
      <li>Date de fin: ${new Date(newContract.endDate).toLocaleDateString()}</li>
      <li>Montant: ${newContract.premiumAmount} €</li>
    </ul>
    
    <p>L'ancien contrat a été archivé et n'apparaîtra plus dans votre liste de contrats actifs.</p>
  `;
}

// Get contracts eligible for renewal
exports.getRenewableContracts = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const currentDate = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(currentDate.getDate() + 30);

    // Find contracts that are:
    // 1. Active and ending within the next 30 days, OR
    // 2. Expired (regardless of when they expired)
    const renewableContracts = await Contract.find({
      userId: new mongoose.Types.ObjectId(userId),
      $or: [
        {
          status: 'active',
          endDate: { 
            $lte: thirtyDaysFromNow, 
            $gte: currentDate 
          }
        },
        {
          status: 'expired'
          // Removed date restriction to show all expired contracts
        }
      ]
    }).sort({ endDate: 1 }); // Sort by endDate ascending

    res.status(200).json({
      success: true,
      count: renewableContracts.length,
      contracts: renewableContracts
    });

  } catch (error) {
    console.error('Get renewable contracts error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get renewable contracts',
      error: error.message 
    });
  }
};
// Add this to your contracts controller
exports.fixContractStatuses = async (req, res) => {
  try {
    const currentDate = new Date();
    console.log(`[Contract Status Update] Running at ${currentDate.toISOString()}`);

    // 1. First handle expired contracts
    const expiredContracts = await Contract.find({
      endDate: { $lt: currentDate },
      status: { $in: ['active', 'pending_payment'] } // Only these should expire
    }).lean();

    console.log(`Found ${expiredContracts.length} contracts to expire`);

    const expiredResult = await Contract.updateMany(
      { 
        _id: { $in: expiredContracts.map(c => c._id) },
        status: { $in: ['active', 'pending_payment'] }
      },
      { 
        $set: { 
          status: 'expired',
          statusUpdatedAt: new Date() 
        } 
      }
    );

    // 2. Handle pending payments that should be active
    const pendingContracts = await Contract.find({
      endDate: { $gte: currentDate },
      status: 'pending_payment',
      paymentIntentId: { $exists: true, $ne: null }
    }).lean();

    console.log(`Found ${pendingContracts.length} pending contracts to activate`);

    const activeResult = await Contract.updateMany(
      { 
        _id: { $in: pendingContracts.map(c => c._id) },
        status: 'pending_payment'
      },
      { 
        $set: { 
          status: 'active',
          statusUpdatedAt: new Date() 
        } 
      }
    );

    // 3. Additional check for contracts with invalid statuses
    const invalidStatusContracts = await Contract.updateMany(
      {
        endDate: { $gte: currentDate },
        status: 'expired' // These shouldn't be expired yet
      },
      {
        $set: {
          status: 'active',
          statusUpdatedAt: new Date()
        }
      }
    );

    console.log(`Fixed ${invalidStatusContracts.modifiedCount} incorrectly expired contracts`);

    res.status(200).json({
      success: true,
      message: 'Contract statuses updated successfully',
      stats: {
        expired: expiredResult.modifiedCount,
        activated: activeResult.modifiedCount,
        corrected: invalidStatusContracts.modifiedCount
      },
      currentTime: currentDate.toISOString()
    });

  } catch (error) {
    console.error('[Contract Status Update Error]', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update contract statuses',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};

// FIXED: Update webhook handler to better handle raw body
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