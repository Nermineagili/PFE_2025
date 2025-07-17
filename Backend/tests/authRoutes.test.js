const request = require('supertest');
const app = require('../server.js');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// Mock Nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    verify: jest.fn().mockResolvedValue(true),
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
  }),
}));

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked-jwt-token'),
}));

// Dynamically mock User for each test
jest.mock('../models/user', () => {
  const MockUser = jest.fn().mockImplementation((data) => {
    const instance = Object.create(MockUser.prototype); // Inherit prototype
    Object.assign(instance, {
      ...data, // Preserve constructor data
    });
    return instance;
  });

  // Define save on the prototype
  MockUser.prototype.save = jest.fn(function () {
    return Promise.resolve({
      _id: '1',
      ...this, // Use instance data
      password: 'hashedPassword', // Mocked hashed password
      profilePic: '/uploads/default-avatar.png', // Default from schema
      role: this.role || 'user', // Use input role or default
      contracts: [],
      createdAt: new Date(),
      settings: {
        language: 'Français',
        emailNotifications: true,
        pushNotifications: true,
      },
    });
  });

  // Spy on the prototype's save method
  jest.spyOn(MockUser.prototype, 'save');

  return MockUser;
}, { virtual: true });

describe('Auth API Routes', () => {
  let accessToken = null;
  let refreshToken = null;

  beforeAll(() => {
    jest.clearAllMocks();
  });

  afterAll((done) => {
    done(); // No mongoose cleanup needed
  });

  it('POST /api/auth/register should create a user successfully', async () => {
    const newUser = {
      name: 'Nermine',
      lastname: 'agili',
      email: 'nn@example.com',
      password: 'password123', // Original password
      profilePic: '',
      role: 'user',
    };

    // Mock User constructor and methods
    const MockUser = require('../models/user');
    MockUser.findOne = jest.fn().mockResolvedValue(null); // No existing user
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword'); // Mock hash result

    const response = await request(app)
      .post('/api/auth/register')
      .send(newUser)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toHaveProperty('message', 'User registered successfully');
    expect(response.body.user).toHaveProperty('email', newUser.email);
    expect(response.body.user).toHaveProperty('name', newUser.name);
    expect(response.body.user).toHaveProperty('lastname', newUser.lastname);
    expect(MockUser).toHaveBeenCalledWith(expect.objectContaining({
      ...newUser,
      password: 'hashedPassword', // Expect hashed password
    }));
    expect(MockUser.prototype.save).toHaveBeenCalled(); // Check the spied save method
  });

  it('POST /api/auth/login should authenticate user and return tokens', async () => {
    const credentials = {
      email: 'nn@example.com',
      password: 'password123',
    };

    // Mock User constructor and methods
    const MockUser = require('../models/user');
    MockUser.findOne = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: '1',
        email: credentials.email,
        password: 'hashedPassword',
        name: 'nermine',
        lastname: 'agili',
        profilePic: '/uploads/default-avatar.png',
        role: 'user',
      }),
      comparePassword: jest.fn().mockResolvedValue(true),
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    const response = await request(app)
      .post('/api/auth/login')
      .send(credentials)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('token', 'mocked-jwt-token');
    expect(response.body.user).toHaveProperty('email', credentials.email);
    accessToken = response.body.token; // Using token as accessToken
    refreshToken = null; // No refresh token in this implementation

    expect(accessToken).toBeDefined();
  });

  it('GET /api/auth/refresh should return 404 (not implemented)', async () => {
    await request(app)
      .get('/api/auth/refresh')
      .expect(404); // Expect 404 since refresh isn’t implemented
  });

  it('GET /api/user should return 404 (route not defined)', async () => {
    await request(app)
      .get('/api/user')
      .expect(404); // Expect 404 since /api/user isn’t defined
  });
});