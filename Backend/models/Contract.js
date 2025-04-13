const mongoose = require("mongoose");

const ContractSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    policyType: {
        type: String,
        enum: ['santé', 'voyage', 'automobile', 'responsabilité civile', 'habitation', 'professionnelle'],
        required: true
      },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    premiumAmount: { type: Number, required: true },
    coverageDetails: { type: String, required: true },
    claims: [{ type: mongoose.Schema.Types.ObjectId, ref: "Claim" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contract", ContractSchema);