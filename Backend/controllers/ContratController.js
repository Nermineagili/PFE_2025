const mongoose = require('mongoose');
const Contract = require('../models/Contract');
const User = require('../models/user');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/sendEmail');
const fs = require('fs'); // Standard fs module for createWriteStream
const { promises: fsPromises } = require('fs'); // Promisified fs methods
const path = require('path');
const PDFDocument = require('pdfkit');
const logoPath = path.join(__dirname, '../assets/yomi_logo.png');
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set. Stripe functionality will not work.');
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createContractRecord = async (userId, policyType, startDate, endDate, premiumAmount, coverageDetails, policyDetails, paymentIntentId, status = 'active', signatureBase64 = '') => {
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
      status,
      signature: signatureBase64
    });

    await contract.save();

    const user = await User.findById(userId);
    if (!user) {
      console.error(`User ${userId} not found`);
      return null;
    }
    
    user.contracts = user.contracts || [];
    user.contracts.push(contract._id);
    await user.save();

    try {
      const htmlContent = `
        <h2>Bonjour ${user.name || user.username},</h2>
        <p>Votre contrat <strong>${policyType}</strong> a été créé avec succès.</p>
        <p><strong>Détails :</strong></p>
        <ul>
          <li>Référence : ${contract._id}</li>
          <li>Date de début : ${new Date(startDate).toLocaleDateString()}</li>
          <li>Date de fin : ${new Date(endDate).toLocaleDateString()}</li>
          <li>Montant : ${premiumAmount.toFixed(2)} €</li>
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
      policyDetails,
      signature,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.query.testing === 'true') {
      const testPaymentId = `test_${Date.now()}`;
      const contract = await createContractRecord(
        userId, policyType, startDate, endDate, 
        premiumAmount, coverageDetails, policyDetails, 
        testPaymentId, 'active', signature
      );
      
      return res.status(201).json({
        message: 'Test contract created',
        contract,
        paymentIntentId: testPaymentId
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(premiumAmount * 100),
      currency: 'eur',
      payment_method: 'pm_card_visa',
      confirm: true,
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

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        message: 'Payment failed',
        paymentIntent
      });
    }

    const contract = await createContractRecord(
      userId, policyType, startDate, endDate,
      premiumAmount, coverageDetails, policyDetails,
      paymentIntent.id,
      'active', signature
    );

    if (!contract) {
      return res.status(500).json({ 
        message: 'Contract creation failed',
        paymentIntentId: paymentIntent.id
      });
    }

    res.status(201).json({
      message: 'Contract created and payment processed',
      contract,
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

exports.downloadContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const userId = req.user ? req.user._id : null;

    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({ message: 'Invalid contract ID' });
    }

    const contract = await Contract.findById(contractId).lean();
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (!userId || contract.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this contract' });
    }

    const user = await User.findById(contract.userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const tempDir = path.join(__dirname, '../temp');
    await fsPromises.mkdir(tempDir, { recursive: true }).catch(err => {
      console.error('Error creating temp directory:', err);
      throw new Error('Failed to create temporary directory');
    });

    const pdfPath = path.join(tempDir, `Contrat_${contract.policyType}_${contract._id}.pdf`);

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Add logo and title
    const logoPath = path.join(__dirname, '../assets/logo.png');
    const yOffset = 50;
    try {
      await fsPromises.access(logoPath);
      doc.image(logoPath, 50, yOffset, { width: 100 });
    } catch {
      doc.fontSize(20).text('YOMI Assurance', 50, yOffset, { align: 'center' });
    }
    doc.fontSize(12).text('Nous rendons l\'assurance plus facile', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).text('ATTESTATION D\'ASSURANCE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Contrat d'assurance n° ${contract._id}`, { align: 'center', underline: true });
    doc.text('Assurance tous risques expositions - manifestations temporaires', { align: 'center' });
    doc.text('Courtier: Patricia ETWAL', { align: 'center' });
    doc.moveDown();

    // Subscriber information
    doc.fontSize(12).text('Le souscripteur', { underline: true });
    doc.text(`Nom de l'entreprise: GSL Mons sprl`);
    doc.text(`Nom du signataire: ${user.name || 'Non spécifié'} ${user.lastname || ''}`);
    doc.text(`Adresse entreprise: ${user.address || 'Adresse non spécifiée'}`);
    doc.text(`N° de téléphone: 065 22 06 50`); // Replace with dynamic data if available
    doc.text(`Adresse mail: ${user.email || 'Non spécifié'}`);
    doc.text(`N° client: ${user._id}`);
    doc.moveDown();

    // Insured information
    doc.text('L\'assuré', { underline: true });
    doc.text(`Nom de l'entreprise: GSL Mons sprl`);
    doc.text(`Adresse entreprise: ${user.address || 'Adresse non spécifiée'}`);
    doc.text(`Adresse siège social: ${user.address || 'Adresse non spécifiée'}`);
    doc.text(`N° assuré: 1 384 0236`); // Replace with dynamic data if available
    doc.moveDown();

    // Contract details
    doc.text('La vie du contrat', { underline: true });
    doc.text(`Date d'effet: ${new Date(contract.startDate).toLocaleDateString('fr-FR')}`);
    doc.text(`Durée du contrat: ${Math.round((new Date(contract.endDate) - new Date(contract.startDate)) / (1000 * 60 * 60 * 24))} jours`);
    doc.text(`Date d'échéance: ${new Date(contract.endDate).toLocaleDateString('fr-FR')}`);
    doc.text(`Mode de règlement: Virement bancaire`);
    doc.text(`Montant assuré: Type 5 (plus de 50 000,00 €)`); // Customize based on policy
    doc.text(`Cotisation: ${contract.premiumAmount.toFixed(2)} €`);
    doc.moveDown();

    // Additional details
    doc.text('Détails supplémentaires', { underline: true });
    doc.text(`Prénom: ${user.name || 'Non spécifié'}`);
    doc.text(`Nom: ${user.lastname || 'Non spécifié'}`);
    doc.text(`Email: ${user.email || 'Non spécifiée'}`);
    doc.text(`Adresse: ${user.address || 'Adresse non spécifiée'}`);
    doc.text(`N° Police: ${contract.policyNumber || `POL-${Math.floor(100000 + Math.random() * 900000)}`}`);
    doc.text(`Type de police: ${contract.policyType}`);
    doc.text(`Détails de couverture: ${contract.coverageDetails || 'Non spécifié'}`);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`);
    doc.moveDown();

    // Signature
    if (contract.signature) {
      const signatureData = contract.signature.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      const signatureBuffer = Buffer.from(signatureData, 'base64');
      const tempSignaturePath = path.join(tempDir, `signature_${contract._id}.png`);
      await fsPromises.writeFile(tempSignaturePath, signatureBuffer);
      doc.moveDown(2);
      doc.text('Signature:', { align: 'right' });
      doc.image(tempSignaturePath, 400, doc.y, { width: 150 });
      await fsPromises.unlink(tempSignaturePath); // Clean up temporary file
    } else {
      doc.moveDown(2);
      doc.text('Signature: Non disponible', { align: 'right' });
    }

    // Add YOMI Assurance stamp at bottom center, higher up
    const stampPath = path.join(__dirname, '../assets/stamp.png'); // Path to your stamp image
    try {
      await fsPromises.access(stampPath);
      doc.save(); // Save the current state to restore later
      const pageWidth = 595; // A4 width in points
      const stampX = (pageWidth - 150) / 2; // Center the 150-width stamp
      doc.translate(stampX, 650); // Higher bottom center position (adjust y as needed)
      doc.rotate(45, { origin: [0, 0] }); // Rotate for stamp effect
      doc.image(stampPath, 0, 0, { width: 150, opacity: 0.2 }); // Lighter stamp
      doc.restore(); // Restore the state
    } catch (stampError) {
      // Fallback to text-based stamp if image is unavailable
      doc.save();
      const pageWidth = 595; // A4 width in points
      const textX = (pageWidth - 150) / 2; // Center the text
      doc.fontSize(30).text('YOMI Assurance', {
        align: 'center',
        color: '#2196F3',
        opacity: 0.1,
        rotate: 45,
        x: textX,
        y: 650
      });
      doc.restore();
    }

    // Finalize PDF
    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Send the PDF file as a response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Contrat_${contract.policyType}_${contract._id}.pdf`);
    const readStream = fs.createReadStream(pdfPath);
    readStream.pipe(res);

    // Clean up
    readStream.on('end', async () => {
      await fsPromises.unlink(pdfPath).catch(err => console.error('Error deleting PDF:', err));
    });

    readStream.on('error', (streamError) => {
      console.error('Error streaming PDF:', streamError);
      res.status(500).json({ message: 'Error streaming PDF file' });
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
  }
};

exports.finalizePayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Payment Intent ID required' });
    }
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        success: false,
        message: `Payment not completed (status: ${paymentIntent.status})`
      });
    }

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

exports.getUserContracts = async (req, res) => {
    try {
        console.log('getUserContracts called with req.user:', req.user);
        console.log('getUserContracts called with req.params.userId:', req.params.userId);
        const { userId } = req.params;
        const user = await User.findById(userId).populate('contracts');
        if (!user) {
            console.log('User not found for userId:', userId);
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('Raw user data:', user);
        console.log('User fetched with contracts:', user.contracts);
        res.status(200).json(user.contracts || []);
    } catch (error) {
        console.error('Contracts fetch error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.prepareRenewal = async (req, res) => {
  try {
    const { contractId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid contract ID format',
        contractId
      });
    }

    const expiringContract = await Contract.findById(contractId);
    if (!expiringContract) {
      return res.status(404).json({ 
        success: false,
        message: 'Contract not found',
        contractId
      });
    }

    if (expiringContract.status !== 'active' && expiringContract.status !== 'expired') {
      return res.status(400).json({ 
        success: false,
        message: 'Contract is not eligible for renewal',
        currentStatus: expiringContract.status,
        requiredStatus: ['active', 'expired']
      });
    }

    const userIdFromToken = req.user ? req.user._id : null;
    
    if (userIdFromToken && expiringContract.userId.toString() !== userIdFromToken.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to renew this contract'
      });
    }

    const newStartDate = new Date(expiringContract.endDate);
    const newEndDate = new Date(newStartDate);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);

    const renewalData = {
      renewalOffered: true,
      renewalPremium: expiringContract.premiumAmount * 1.1,
      renewalCoverage: expiringContract.coverageDetails,
      renewalPolicyDetails: expiringContract.policyDetails,
      newStartDate: newStartDate.toISOString(),
      newEndDate: newEndDate.toISOString()
    };

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

    const newStartDate = contractToRenew.status === 'expired' && new Date(contractToRenew.endDate) < new Date() 
      ? new Date() 
      : new Date(contractToRenew.endDate);
    
    const newEndDate = new Date(newStartDate);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);

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

    await Contract.findByIdAndUpdate(
      contractId,
      { 
        status: 'archived',
        archivedAt: new Date(),
        replacedBy: newContract._id,
        archiveReason: 'renewed'
      }
    );

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

  } catch (error) {
    console.error('Renewal error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Renewal execution failed',
      error: error.message 
    });
  }
};

function generateExpirationEmailContent(user, contract) {
  const renewalLink = `${process.env.FRONTEND_URL}/mes-contrats`;
  return `
    <h2>Bonjour ${user.name || user.username},</h2>
    <p>Votre contrat <strong>${contract.policyType}</strong> a expiré.</p>
    <p><strong>Détails du contrat :</strong></p>
    <ul>
      <li>Référence : ${contract._id}</li>
      <li>Date de fin : ${new Date(contract.endDate).toLocaleDateString()}</li>
      <li>Montant : ${contract.premiumAmount} €</li>
    </ul>
    <p>Pour renouveler votre contrat, veuillez cliquer sur le lien ci-dessous :</p>
    <p><a href="${renewalLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">Renouveler mon contrat</a></p>
    <p>Vous serez redirigé vers la page "Mes Contrats" pour procéder au renouvellement.</p>
    <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
  `;
}

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

exports.getRenewableContracts = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const currentDate = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(currentDate.getDate() + 30);

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
        }
      ]
    }).sort({ endDate: 1 });

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

exports.fixContractStatuses = async (req, res) => {
  try {
    const currentDate = new Date();
    console.log(`[Contract Status Update] Running at ${currentDate.toISOString()}`);

    const expiredContracts = await Contract.find({
      endDate: { $lt: currentDate },
      status: { $in: ['active', 'pending_payment'] }
    }).lean();

    console.log(`Found ${expiredContracts.length} contracts to expire`);

    const expiredContractIds = expiredContracts.map(c => c._id);
    const expiredResult = await Contract.updateMany(
      { 
        _id: { $in: expiredContractIds },
        status: { $in: ['active', 'pending_payment'] }
      },
      { 
        $set: { 
          status: 'expired',
          statusUpdatedAt: new Date() 
        } 
      }
    );

    for (const contract of expiredContracts) {
      try {
        const user = await User.findById(contract.userId);
        if (user) {
          await sendEmail(
            user.email,
            'Votre contrat a expiré',
            generateExpirationEmailContent(user, contract)
          );
          console.log(`Expiration email sent to ${user.email} for contract ${contract._id}`);
        } else {
          console.warn(`User not found for contract ${contract._id}`);
        }
      } catch (emailError) {
        console.error(`Failed to send expiration email for contract ${contract._id}:`, emailError);
      }
    }

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

    const invalidStatusContracts = await Contract.updateMany(
      {
        endDate: { $gte: currentDate },
        status: 'expired'
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