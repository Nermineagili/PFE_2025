const express = require("express");
const { sendContactEmail,replyToUser } = require("../controllers/contactController");
const {getAllMessages} = require("../controllers/supervisorActions")
const router = express.Router();

router.post("/", sendContactEmail);
router.post("/reply", replyToUser); // 👈 NEW ROUTE
// GET /contact/messages
router.get('/messages', getAllMessages);

module.exports = router;
