const express = require("express");
const { sendContactEmail,replyToUser, deleteContactMessage } = require("../controllers/contactController");
const {getAllMessages} = require("../controllers/supervisorActions");
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

// No authentication for sending contact message
router.post('/', sendContactEmail);

// Require authentication for replying
router.post('/reply', authenticateToken, replyToUser);
// GET /contact/messages
router.get('/messages', getAllMessages);
router.post('/delete', authenticateToken, deleteContactMessage);
module.exports = router;
