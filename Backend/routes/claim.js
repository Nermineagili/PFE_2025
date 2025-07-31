const express = require('express');
const router = express.Router();
const { submitClaim, getUserClaims, getUserClaimById, downloadClaimFile, analyzeClaim } = require('../controllers/claimController');
const { authenticateToken, validateObjectId, checkSupervisor } = require('../middleware/authMiddleware');
const multer = require('multer');
const fs = require('fs');

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = 'Uploads/';
            if (!fs.existsSync(dir)) fs.mkdirSync(dir);
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + '-' + file.originalname);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        console.log('Processing file:', file.originalname, 'MIME:', file.mimetype);
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'), false);
        }
    }
});

// Debug middleware
router.use((req, res, next) => {
    console.log('Incoming Request Headers:', req.headers);
    console.log('Incoming Request Body (before multer):', req.body);
    next();
});

// Multer error handling
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('Multer Error:', err);
        return res.status(400).json({ success: false, message: `Multer error: ${err.message}` });
    } else if (err) {
        console.error('Other Error:', err);
        return res.status(400).json({ success: false, message: err.message });
    }
    next();
});

// Submit claim
router.post('/submit', authenticateToken, (req, res, next) => {
    if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
        upload.array('supportingFiles', 5)(req, res, next);
    } else {
        next();
    }
}, (req, res, next) => {
    console.log('Files after multer:', req.files);
    console.log('Body after multer:', req.body);
    next();
}, submitClaim);

// Get all claims of a user
router.get("/user/:userId", getUserClaims);

// Get a specific claim of a user
router.get("/user/:userId/:claimId",  getUserClaimById);

// Download a specific supporting file
router.get("/download/:claimId/:fileId", downloadClaimFile);

module.exports = router;
