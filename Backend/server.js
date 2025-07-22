// server.js
require('dotenv').config();

if (process.env.NODE_ENV !== 'test') {
  console.log('\n=== Environment variables ===');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', process.env.SMTP_PORT);
  console.log('SMTP_USER:', process.env.SMTP_USER ? '✅ Set' : '❌ Not set');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✅ Set' : '❌ Not set');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');
  console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '❌ Not set');
}

const { Configuration, OpenAIApi } = require('openai');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const cron = require('node-cron');

// const settingsRoutes = require('./routes/settings');
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');
const claimRoutes = require('./routes/claim');
const adminRoutes = require('./routes/adminRoutes');
const contactRoutes = require('./routes/ContactRoutes');
const taskRoutes = require('./routes/taskRoutes');
const contratRoutes = require('./routes/ContratRoutes');
const supervisorRoutes = require('./routes/supervisorRoutes');
const paymentRoutes = require('./routes/payment');
const contractController = require('./controllers/ContratController');
const chatRoutes = require('./routes/chat');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// In server.js, after app initialization but before routes
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`Incoming ${req.method} request to ${req.path} at ${new Date().toISOString()} with headers:`, req.headers);
  }
  next();
});

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-debug-request"],
  credentials: true,
}));

// Handle preflight OPTIONS requests
app.options("*", cors());

// Stripe webhook middleware
app.post('/webhook', express.raw({ type: 'application/json' }), contractController.handleStripeWebhook);

// Regular body parsers
app.use(express.json());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Serve images statically
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
// app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// MongoDB Connection with error handling
const connectWithRetry = () => {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  })
    .then(() => {
      if (process.env.NODE_ENV !== 'test') {
        console.log('✅ MongoDB connected!');
      }
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      setTimeout(connectWithRetry, 5000); // Retry every 5 seconds
    });
};

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1); // Exit on unhandled rejection in production
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.stack);
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1); // Exit on uncaught exception in production
  }
});

// Cron job for contract status (run only when server starts)
if (require.main === module) {
  connectWithRetry(); // Initiate MongoDB connection

  cron.schedule('0 3 * * *', () => {
    if (mongoose.connection.readyState === 1) { // 1 means connected
      console.log('Running contract status check...');
      const mockReq = {};
      const mockRes = {
        status: () => ({
          json: (data) => console.log('Contract status update result:', data),
        }),
      };
      contractController.fixContractStatuses(mockReq, mockRes).catch((err) => {
        console.error('[Contract Status Update Error]', { error: err.message, stack: err.stack, timestamp: new Date().toISOString() });
      });
    } else {
      console.log('Skipping contract status check: MongoDB not connected');
    }
  });

  // Initial run with connection check
  if (mongoose.connection.readyState === 1) {
    contractController.fixContractStatuses({}, {
      status: () => ({
        json: (data) => console.log('Initial contract status check:', data),
      }),
    }).catch((err) => {
      console.error('[Initial Contract Status Check Error]', { error: err.message, stack: err.stack, timestamp: new Date().toISOString() });
    });
  } else {
    console.log('Skipping initial contract status check: MongoDB not connected');
  }

  // Test route
  app.delete('/api/supervisor/claims/test/:id', async (req, res) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Testing delete for ${req.params.id} at ${new Date().toISOString()} without middleware`);
    }
    const deleteClaim = require('./controllers/supervisorActions').deleteClaim;
    await deleteClaim(req, res);
  });

  // Start Server
  const server = app.listen(PORT, () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`✅ Server started on port ${PORT}`);
    }
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    server.close(() => {
      console.log('Server terminated gracefully');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    server.close(() => {
      console.log('Server interrupted gracefully');
      process.exit(0);
    });
  });
}

// Export the raw app for testing
module.exports = app;