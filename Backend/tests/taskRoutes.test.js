const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/task'); // Adjust path if necessary
const taskRoutes = require('../routes/taskRoutes'); // Import task routes

// Mock authentication middleware
jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: (req, res, next) => next(),
  checkAdmin: (req, res, next) => next(),
}));

// Mock task controller
jest.mock('../controllers/taskController', () => ({
  getTasks: jest.fn((req, res) => res.status(200).json([{ _id: '1', title: 'Mock Task' }])),
  getTaskById: jest.fn((req, res) => res.status(200).json({ _id: '1', title: 'Mock Task' })),
  createTask: jest.fn((req, res) =>
    res.status(201).json({ message: 'Task created successfully', newTask: { _id: '1', title: 'Test Task' } })
  ),
  updateTask: jest.fn((req, res) =>
    res.status(200).json({ message: 'Task updated successfully', updatedTask: { _id: '1', title: 'Updated' } })
  ),
  deleteTask: jest.fn((req, res) => res.status(200).json({ message: 'Task deleted successfully' })),
}));

// Set up Express app
const app = express();
app.use(express.json());
app.use('/tasks', taskRoutes);

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/testdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Task.deleteMany();
});

describe('Task Routes', () => {
  it('should create a task', async () => {
    const response = await request(app)
      .post('/tasks')
      .send({
        title: 'Test Task',
        description: 'Task description',
        status: 'pending',
      })
      .expect(201);

    expect(response.body.message).toBe('Task created successfully');
    expect(response.body.newTask).toHaveProperty('_id');
  });

  it('should get all tasks', async () => {
    const response = await request(app).get('/tasks').expect(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should get a task by ID', async () => {
    const response = await request(app).get('/tasks/1').expect(200);
    expect(response.body).toHaveProperty('_id', '1');
  });

  it('should update a task', async () => {
    const response = await request(app)
      .put('/tasks/1')
      .send({ title: 'Updated', description: 'Updated desc', status: 'completed' })
      .expect(200);

    expect(response.body.message).toBe('Task updated successfully');
    expect(response.body.updatedTask.title).toBe('Updated');
  });

  it('should delete a task', async () => {
    const response = await request(app).delete('/tasks/1').expect(200);
    expect(response.body.message).toBe('Task deleted successfully');
  });
});
