const mongoose = require("mongoose");
const ContractSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    policyType: {
      type: String,
      enum: ['santé', 'voyage', 'automobile', 'responsabilité civile', 'habitation', 'professionnelle', 'transport'],
      required: true
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    premiumAmount: { type: Number, required: true },
    coverageDetails: { type: String, required: true },
    claims: [{ type: mongoose.Schema.Types.ObjectId, ref: "Claim" }],
    policyDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    paymentIntentId: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ['active', 'pending_payment', 'expired', 'cancelled', 'pending_renewal'],
      default: 'active'
    },
    statusUpdatedAt: { type: Date },
    renewalData: {
      renewalOffered: Boolean,
      renewalPremium: Number,
      renewalCoverage: String,
      renewalPolicyDetails: mongoose.Schema.Types.Mixed
    },
    previousContract: { type: mongoose.Schema.Types.ObjectId, ref: "Contract" } // For tracking renewals
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contract", ContractSchema);