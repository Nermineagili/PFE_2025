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
      type: mongoose.Schema.Types.Mixed, // to allow flexibility based on policyType
      default: {}
    },
    paymentIntentId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contract", ContractSchema);