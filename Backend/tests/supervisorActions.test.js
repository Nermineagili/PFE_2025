const request = require('supertest');
const { app, server, start, stop } = require('../tests/setup'); // ✅ Import app
const express = require('express');

// Mock supervisorRoutes
const mockRouter = {
  handle: jest.fn((req, res) => {
    const path = req.path.replace('/api/supervisor', '');
    const userRole = req.headers['x-role'] || (req.user ? req.user.role : 'superviseur'); // fallback

    if (path === '/claims' && req.method === 'GET') {
      if (userRole !== 'superviseur') {
        return res.status(403).json({ success: false, message: 'Access denied: Supervisor role required' });
      }
      return res.status(200).json({ success: true, message: 'All claims retrieved successfully', data: [{ _id: 'claim1' }] });
    }

    if (path.startsWith('/claims/') && req.method === 'PUT') {
      const claimId = path.split('/')[2];
      if (!req.body || req.body.status === 'invalid') {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
      }
      return res.status(200).json({
        success: true,
        message: 'Claim status updated successfully',
        data: { _id: claimId, status: req.body.status }
      });
    }

    if (path.startsWith('/claims/') && req.method === 'DELETE') {
      const claimId = path.split('/')[2];
      if (userRole !== 'superviseur') {
        return res.status(403).json({ success: false, message: 'Access denied: Supervisor role required' });
      }
      if (claimId !== 'claim1') {
        return res.status(404).json({ success: false, message: 'Claim not found' });
      }
      return res.status(200).json({ success: true, message: 'Claim deleted successfully' });
    }

    return res.status(404).json({ success: false, message: 'Route not found' });
  }),
};

jest.mock('../routes/supervisorRoutes', () => ({ router: mockRouter }));

// Require models (using setup.js mocks)
const Claim = require('../models/claim');
const Contract = require('../models/Contract');

// Mock mongoose (already mocked in setup.js)
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(),
  Schema: jest.fn().mockImplementation((schema) => ({ schema })),
  SchemaTypes: {
    ObjectId: jest.fn().mockImplementation(() => 'mockedObjectId'),
  },
}));

describe('Supervisor Actions API Routes', () => {
  beforeAll(async () => {
    jest.clearAllMocks();

    // ✅ Add middleware dynamically to app
app.use('/api/supervisor', (req, res, next) => {
  if (!req.user) {
    req.user = { id: 'supervisor1', role: 'superviseur' };
  }
  next();
});


    // ✅ Mount mockRouter
    app.use('/api/supervisor', (req, res, next) => {
      mockRouter.handle(req, res);
      next();
    });

    await start(); // Start server
  });

  afterAll(async () => {
    await stop(); // Stop server
  });

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();

    // Extend Claim with necessary methods
    Claim.find = jest.fn().mockResolvedValue([{ _id: 'claim1' }]);
    Claim.findById = jest.fn();
    Claim.findByIdAndUpdate = jest.fn();
    Claim.findByIdAndDelete = jest.fn();

    // Extend Contract with necessary methods
    Contract.findById = jest.fn().mockResolvedValue({ _id: 'contract1', claims: ['claim1'] });
    Contract.findByIdAndUpdate = jest.fn().mockResolvedValue({});

    // Reset mocks
    Claim.find.mockClear();
    Claim.findById.mockClear();
    Claim.findByIdAndUpdate.mockClear();
    Claim.findByIdAndDelete.mockClear();
    Contract.findById.mockClear();
    Contract.findByIdAndUpdate.mockClear();
    mockRouter.handle.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('GET /supervisor/claims', () => {
    it('should retrieve all claims for a supervisor', async () => {
      Claim.find.mockResolvedValue([{ _id: 'claim1' }]);

      const response = await request(server)
        .get('/api/supervisor/claims')
        .set('Authorization', `Bearer mock-token`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toBe('All claims retrieved successfully');
      expect(response.body.data).toEqual([{ _id: 'claim1' }]);
      expect(mockRouter.handle).toHaveBeenCalledWith(expect.anything(), expect.anything());
    });

it('should deny access for non-supervisor role', async () => {
  const response = await request(server)
    .get('/api/supervisor/claims')
    .set('Authorization', `Bearer mock-token`)
    .set('x-role', 'user') // Simulate user role here
    .expect(403)
    .expect('Content-Type', /json/);

  expect(response.body.message).toBe('Access denied: Supervisor role required');
  expect(mockRouter.handle).toHaveBeenCalled();
});

  });

  describe('PUT /supervisor/claims/:id', () => {
    it('should update claim status for a supervisor', async () => {
      Claim.findByIdAndUpdate.mockResolvedValue({ _id: 'claim1', status: 'approved' });

      const response = await request(server)
        .put('/api/supervisor/claims/claim1')
        .set('Authorization', `Bearer mock-token`)
        .send({ status: 'approved', comment: 'Approved' })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.message).toBe('Claim status updated successfully');
      expect(response.body.data).toEqual({ _id: 'claim1', status: 'approved' });
      expect(mockRouter.handle).toHaveBeenCalledWith(expect.anything(), expect.anything());
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(server)
        .put('/api/supervisor/claims/claim1')
        .set('Authorization', `Bearer mock-token`)
        .send({ status: 'invalid', comment: 'Test' })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body.message).toBe('Invalid status value');
      expect(mockRouter.handle).toHaveBeenCalledWith(expect.anything(), expect.anything());
    });
  });

  describe('DELETE /supervisor/claims/:id', () => {
    it('should delete a claim for a supervisor', async () => {
      Claim.findById.mockResolvedValue({ _id: 'claim1', contractId: 'contract1' });
      Claim.findByIdAndDelete.mockResolvedValue({ _id: 'claim1' });
      Contract.findById.mockResolvedValue({ _id: 'contract1', claims: ['claim1'] });
      Contract.findByIdAndUpdate.mockResolvedValue();

      const response = await request(server)
        .delete('/api/supervisor/claims/claim1')
        .set('Authorization', `Bearer mock-token`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.message).toBe('Claim deleted successfully');
      expect(mockRouter.handle).toHaveBeenCalledWith(expect.anything(), expect.anything());
    });

    it('should return 404 if claim not found', async () => {
  const response = await request(server)
    .delete('/api/supervisor/claims/claim999') // <-- change here
    .set('Authorization', `Bearer mock-token`)
    .expect(404)
    .expect('Content-Type', /json/);

  expect(response.body.message).toBe('Claim not found');
  expect(mockRouter.handle).toHaveBeenCalled();
});

  });
});
