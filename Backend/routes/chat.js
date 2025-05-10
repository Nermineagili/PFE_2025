const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const rateLimit = require('express-rate-limit');

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

router.post('/chat', chatLimiter, chatController.handleChat);

module.exports = router;