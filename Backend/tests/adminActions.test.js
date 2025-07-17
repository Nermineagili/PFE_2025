const request = require('supertest');
const { server, start, stop } = require('../tests/setup'); // Correct path
const bcrypt = require('bcrypt');

describe('Admin Actions API Routes', () => {
  beforeAll(async () => {
    jest.clearAllMocks();
    await start();
  });

  afterAll(async () => {
    await stop();
  });

  it('POST /admin/users should create a user successfully', async () => {
    const newUser = {
      name: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      profilePic: '',
      role: 'user',
    };

    const MockUser = require('../models/user');
    MockUser.findOne.mockResolvedValue(null);
    jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt');
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');

    const response = await request(server)
      .post('/admin/users')
      .set('Authorization', `Bearer mock-token`)
      .send(newUser)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toHaveProperty('message', 'User created successfully');
    expect(response.body.user).toHaveProperty('email', newUser.email);
    expect(MockUser).toHaveBeenCalledWith(expect.objectContaining({
      ...newUser,
      password: 'hashedPassword',
    }));
    expect(MockUser.prototype.save).toHaveBeenCalled();
    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith(newUser.password, 'salt');
  });

  it('GET /admin/users should fetch all users', async () => {
    const mockUsers = [{ _id: '1', name: 'John', email: 'john@example.com', contracts: ['contract1'] }];
    const MockUser = require('../models/user');
    MockUser.find.mockResolvedValue(mockUsers);

    const response = await request(server)
      .get('/admin/users')
      .set('Authorization', `Bearer mock-token`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual(mockUsers);
    expect(MockUser.find).toHaveBeenCalledWith({ role: { $ne: 'admin' } }, '-password');
  });
});