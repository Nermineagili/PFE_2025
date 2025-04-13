const Contract = require('../models/Contract');
const User = require('../models/user');
const { validationResult } = require('express-validator');

// Create a new contract (subscription)
exports.createContract = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { userId, policyType, startDate, endDate, premiumAmount, coverageDetails } = req.body;

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
    });

    // Save the contract to the database
    await contract.save();

    // Add the contract reference to the user's contracts array
    user.contracts.push(contract._id);
    await user.save();

    res.status(201).json({
      message: 'Contract created successfully',
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
