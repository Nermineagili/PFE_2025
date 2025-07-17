// tests/setup.js
const express = require('express');
const http = require('http');
const adminRoutes = require('../routes/adminRoutes'); // Existing admin routes

// ✅ Create Express app
const app = express();
app.use(express.json());
app.use('/admin', adminRoutes); // Mount admin routes for existing tests

// ✅ Mock dependencies for isolation
jest.mock('../models/user', () => {
  const MockUser = jest.fn().mockImplementation((data) => {
    const instance = { ...data, contracts: [] };
    instance.save = function () {
      return MockUser.prototype.save.call(this);
    };
    return instance;
  });

  MockUser.prototype.save = jest.fn().mockImplementation(function () {
    return Promise.resolve({
      _id: '1',
      ...this,
      password: 'hashedPassword',
      profilePic: '/uploads/default-avatar.png',
      role: this.role || 'user',
      contracts: this.contracts || [],
      createdAt: new Date(),
      settings: {
        language: 'Français',
        emailNotifications: true,
        pushNotifications: true,
      },
    });
  });

  MockUser.findOne = jest.fn();
  MockUser.findById = jest.fn().mockImplementation((id) => {
    return {
      select: jest.fn().mockImplementation(() => {
        let user = {
          _id: id,
          name: 'John',
          email: 'john@example.com',
          contracts: ['contract1'],
          password: 'hashedPassword',
        };
        return {
          exec: jest.fn().mockResolvedValue(user),
        };
      }),
    };
  });
  MockUser.findByIdAndUpdate = jest.fn();
  MockUser.findByIdAndDelete = jest.fn();
  MockUser.find = jest.fn();

  return MockUser;
});

jest.mock('../models/claim', () => ({
  find: jest.fn().mockResolvedValue([]),
}));
jest.mock('../models/Contract', () => ({
  find: jest.fn().mockResolvedValue([]),
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    verify: jest.fn((callback) => callback(null)),
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));

jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(),
  Schema: jest.fn().mockImplementation((schema) => ({ schema })),
  SchemaTypes: {
    ObjectId: jest.fn().mockImplementation(() => 'mockedObjectId'),
  },
}));

jest.mock('../controllers/ContratController', () => ({
  fixContractStatuses: jest.fn(),
}));

// ✅ Mock authMiddleware globally
jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: 'admin-id', role: 'admin' };
    next();
  }),
  checkAdmin: jest.fn((req, res, next) => next()),
  validateObjectId: jest.fn((req, res, next) => next()),
}));

// ✅ Create and export server with control
const server = http.createServer(app);

module.exports = {
  app, // Export Express app so tests can mount extra routes
  server, // HTTP server for Supertest
  start: () => new Promise((resolve) => server.listen(0, resolve)), // Port auto-assign
  stop: () => new Promise((resolve) => server.close(resolve)),
};
