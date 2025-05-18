const express = require("express");
const { sendContactEmail,replyToUser } = require("../controllers/contactController");
const {getAllMessages} = require("../controllers/supervisorActions");
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

// No authentication for sending contact message
router.post('/', sendContactEmail);

// Require authentication for replying
router.post('/reply', authenticateToken, replyToUser);
// GET /contact/messages
router.get('/messages', getAllMessages);

module.exports = router;
