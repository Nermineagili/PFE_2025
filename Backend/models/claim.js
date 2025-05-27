const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Removed contractId field
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    birthDate: {
        day: { type: Number, required: true },
        month: { type: Number, required: true },
        year: { type: Number, required: true }
    },
    sexe: { type: String, enum: ['homme', 'femme'], required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    postalAddress: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    email: { type: String, required: true },
    stateProvince: { type: String, required: true },
    incidentDescription: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    supportingFiles: [
        {
            publicId: { type: String, required: true },
            url: { type: String, required: true },
            fileName: { type: String, required: true },
            fileType: { type: String, required: true },
            uploadedAt: { type: Date, default: Date.now }
        }
    ],
    comments: [
        {
            comment: { type: String, required: true }, // The comment text
            supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Supervisor who added the comment
            createdAt: { type: Date, default: Date.now } // Timestamp of the comment
        }
    ]
});

module.exports = mongoose.model('Claim', ClaimSchema);