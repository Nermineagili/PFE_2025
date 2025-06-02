const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true }, // Reintroduced
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    birthDate: {
        day: { type: Number, required: true },
        month: { type: Number, required: true },
        year: { type: Number, required: true }
    },
    profession: { type: String, required: true }, // New field
    phone: { type: String, required: true },
    email: { type: String, required: true },
    postalAddress: { type: String, required: true },
    incidentType: { 
        type: String, 
        enum: ['accident', 'incendie', 'vol', 'maladie', 'dégât des eaux'], 
        required: true 
    }, // New field
    incidentDate: { type: Date, required: true }, // New field
    incidentTime: { type: String, required: true }, // New field (e.g., "14:30")
    incidentLocation: { type: String, required: true }, // New field
    incidentDescription: { type: String, required: true }, // Renamed to match "Circonstances détaillées"
    damages: { type: String, required: true }, // New field
    thirdPartyInvolved: { type: Boolean, required: true, default: false }, // New field
    thirdPartyDetails: {
        name: { type: String }, // Optional, only if thirdPartyInvolved is true
        contactInfo: { type: String }, // Optional
        registrationId: { type: String }, // Optional
        insurerContact: { type: String } // Optional
    }, // New nested object
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
            comment: { type: String, required: true },
            supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ]
});

module.exports = mongoose.model('Claim', ClaimSchema);