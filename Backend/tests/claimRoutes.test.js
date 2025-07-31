const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const claimRoutes = require('../routes/claim');

// Mock Claim as a class
jest.mock('../models/claim', () => {
  return jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({
      _id: 'mockClaimId',
      status: 'pending'
    })
  }));
});
const Claim = require('../models/claim');

// Mock user model
jest.mock('../models/user', () => ({
  findById: jest.fn(),
}));
const User = require('../models/user');

// Mock auth middleware
jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: '64a1f98c9f1b8e3a8c2d4f12' };
    next();
  }
}));

const app = express();
app.use(bodyParser.json());
app.use('/api/claims', claimRoutes);

describe('Claim Routes API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

it('should submit a claim successfully', async () => {
  const validUserId = '64a1f98c9f1b8e3a8c2d4f12';
  const validContractId = 'contract123';

  const now = new Date();
  const pastDate = new Date(now.getTime() - 86400000).toISOString(); // yesterday
  const futureDate = new Date(now.getTime() + 86400000).toISOString(); // tomorrow

  const mockContract = {
    _id: validContractId,
    status: 'active',
    startDate: pastDate,
    endDate: futureDate,
    claims: [],
    policyType: 'Some Policy',
    save: jest.fn().mockResolvedValue(true),
  };

  // FIX: Return an object with a .populate() function
  User.findById.mockReturnValue({
    populate: jest.fn().mockResolvedValue({
      _id: validUserId,
      name: 'John Doe',
      contracts: [mockContract],
    }),
  });

  const response = await request(app)
    .post('/api/claims/submit')
    .field('userId', validUserId)
    .field('contractId', validContractId)
    .field('firstName', 'John')
    .field('lastName', 'Doe')
    .field('birthDate[day]', '1')
    .field('birthDate[month]', '1')
    .field('birthDate[year]', '1990')
    .field('profession', 'Engineer')
    .field('phone', '1234567890')
    .field('email', 'john@example.com')
    .field('postalAddress', '123 Street')
    .field('incidentType', 'accident')
    .field('incidentDate', '2025-07-10')
    .field('incidentTime', '14:30')
    .field('incidentLocation', 'City')
    .field('incidentDescription', 'Details')
    .field('damages', 'Car damage')
    .field('thirdPartyInvolved', 'false')
    .expect(201);

  expect(response.body.success).toBe(true);
  expect(response.body.message).toBe('Claim submitted successfully');
});

  it('should return all claims for a user', async () => {
    const mockClaims = [{ _id: 'claim1' }, { _id: 'claim2' }];
    Claim.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockClaims)
    });

    const response = await request(app)
      .get('/api/claims/user/user123')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(mockClaims);
  });

  it('should return a specific claim', async () => {
    const mockClaim = { _id: 'claim123', status: 'pending' };
    Claim.findOne = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      then: (cb) => cb(mockClaim)
    });

    const response = await request(app)
      .get('/api/claims/user/user123/claim123')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(mockClaim);
  });

  it('should return 404 if claim not found', async () => {
    Claim.findOne = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      then: (cb) => cb(null)
    });

    const response = await request(app)
      .get('/api/claims/user/user123/invalid')
      .expect(404);

    expect(response.body.message).toBe('Claim not found or does not belong to this user');
  });
});
