// IMPORTANT: This must be the first line in the file
require('dotenv').config();

// Debug environment variables
console.log('\n=== Environment variables ===');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER ? '✅ Set' : '❌ Not set');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✅ Set' : '❌ Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');
console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '❌ Not set');
const { Configuration, OpenAIApi } = require('openai');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');

// Route imports
const settingsRoutes = require('./routes/settings');
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');
const claimRoutes = require('./routes/claim');
const adminRoutes = require('./routes/adminRoutes');
const contactRoutes = require('./routes/ContactRoutes');
const taskRoutes = require('./routes/taskRoutes');
const contratRoutes = require('./routes/ContratRoutes');
const supervisorRoutes = require('./routes/supervisorRoutes');
const paymentRoutes = require('./routes/payment');
const contractController = require('./controllers/ContratController'); // Adjust path as needed
const chatRoutes = require('./routes/chat');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notificationRoutes');
const app = express();
const PORT = process.env.PORT || 5000;
const cron = require('node-cron');
const { fixContractStatuses } = require('./controllers/ContratController');
// Run every day at 3 AM
// Schedule the job to run daily at 3 AM
cron.schedule('0 3 * * *', () => {
  console.log('Running contract status check...');
  // Create mock req/res objects
  const mockReq = {};
  const mockRes = {
    status: () => ({
      json: (data) => console.log('Contract status update result:', data)
    })
  };

});

// Optional: Run immediately on startup
fixContractStatuses({}, {
  status: () => ({
    json: (data) => console.log('Initial contract status check:', data)
  })
});
// CORS Configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // ✅ frontend address from env
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-debug-request"],
    credentials: true,
  })
);

// Handle preflight OPTIONS requests
app.options("*", cors());

// IMPORTANT: Stripe webhook middleware must be before JSON body parser
// This allows us to receive raw body for webhook verification
app.post('/webhook', 
  express.raw({type: 'application/json'}),
  contractController.handleStripeWebhook
);
// Regular body parsers for other routes
app.use(express.json());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Serve images statically from the 'uploads' folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Root route
app.get("/", (req, res) => {
  res.send("🚀 Express server is running!");
});

// Register all routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/tasks", taskRoutes);
app.use('/api/contracts', contratRoutes);
app.use('/api/supervisor', supervisorRoutes);
app.use("/api/payment", paymentRoutes);
app.use('/api', chatRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard' , dashboardRoutes); 
app.use('/api/notifications', notificationRoutes);
// MongoDB Connection 
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});