const Contract = require('../models/Contract');
const User = require('../models/user');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/sendEmail');


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
    user.contracts.push(contract._id);
    await user.save();

    // ✅ Send confirmation email
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

    await sendEmail(
      user.email,
      'Confirmation de souscription à un contrat',
      `
        <h3>Bonjour ${user.name || user.username},</h3>
        <p>Votre contrat <strong>${policyType}</strong> est en cours de traitement.</p>
        <p>Merci de votre confiance !</p>
      `
    );
    
    res.status(201).json({
      message: 'Contract created successfully and confirmation email sent',
      contract,
    });

  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all contracts for a user
exports.getUserContracts = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user and populate the contracts
    const user = await User.findById(userId).populate('contracts');

    if (!user || !user.contracts || user.contracts.length === 0) {
      return res.status(404).json({ message: 'No contracts found' });
    }

    res.status(200).json(user.contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
