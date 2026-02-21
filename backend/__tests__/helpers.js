const request = require('supertest');
const express = require('express');
const { User, CompanyProfile, StudentProfile } = require('../src/models');

// Helper functions for testing

/**
 * Generate a valid JWT token for testing
 */
const generateAuthToken = (user) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '7d' }
  );
};

/**
 * Create a mock Express app with routes for testing
 */
const createTestApp = (routes) => {
  const app = express();
  app.use(express.json());
  routes(app);
  return app;
};

/**
 * Mock authenticated request
 */
const authenticatedRequest = (app, method, url, user) => {
  const token = generateAuthToken(user);
  return request(app)[method](url).set('Authorization', `Bearer ${token}`);
};

/**
 * Create mock user data
 */
const createMockUser = (overrides = {}) => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  phone: '1234567890',
  role: 'student',
  isActive: true,
  password: '$2b$10$hashedpassword',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create mock student profile
 */
const createMockStudentProfile = (overrides = {}) => ({
  id: 1,
  userId: 1,
  bio: 'Test student bio',
  education: 'Bachelor of Computer Science',
  skills: ['JavaScript', 'React', 'Node.js'],
  experience: 'Fresher',
  ...overrides,
});

/**
 * Create mock company profile
 */
const createMockCompanyProfile = (overrides = {}) => ({
  id: 1,
  userId: 2,
  companyName: 'Test Company',
  industry: 'Technology',
  companySize: '10-50',
  website: 'https://testcompany.com',
  description: 'We are a test company',
  ...overrides,
});

/**
 * Create mock job data
 */
const createMockJob = (overrides = {}) => ({
  id: 1,
  title: 'Software Engineer Intern',
  description: 'Great opportunity for fresh graduates',
  requirements: 'JavaScript, React, Node.js',
  skills: ['JavaScript', 'React', 'Node.js'],
  category: 'Engineering',
  type: 'Internship',
  locations: ['Kathmandu'],
  workMode: 'Hybrid',
  duration: 6,
  stipend: 50000,
  openings: 2,
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  status: 'active',
  companyId: 1,
  isPaid: true,
  perks: ['Certificate', 'Flexible hours'],
  ...overrides,
});

/**
 * Create mock application data
 */
const createMockApplication = (overrides = {}) => ({
  id: 1,
  jobId: 1,
  studentId: 1,
  coverLetter: 'I am very interested in this position',
  status: 'Applied',
  statusHistory: [
    {
      status: 'Applied',
      label: 'Application submitted',
      changedAt: new Date(),
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create mock report data
 */
const createMockReport = (overrides = {}) => ({
  id: 1,
  jobId: 1,
  studentId: 1,
  reason: 'Inappropriate content',
  description: 'This job posting contains inappropriate content',
  status: 'pending',
  createdAt: new Date(),
  ...overrides,
});

/**
 * Validate API response structure
 */
const expectSuccessResponse = (response, statusCode = 200) => {
  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty('success', true);
  expect(response.body).toHaveProperty('data');
};

/**
 * Validate API error response structure
 */
const expectErrorResponse = (response, statusCode = 400) => {
  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('message');
};

/**
 * Validate pagination structure
 */
const expectPaginationStructure = (pagination) => {
  expect(pagination).toHaveProperty('page');
  expect(pagination).toHaveProperty('limit');
  expect(pagination).toHaveProperty('total');
  expect(pagination).toHaveProperty('pages');
};

/**
 * Mock database model methods
 */
const mockDbMethods = (Model) => {
  Model.findAll = jest.fn();
  Model.findOne = jest.fn();
  Model.findByPk = jest.fn();
  Model.create = jest.fn();
  Model.update = jest.fn();
  Model.destroy = jest.fn();
  Model.count = jest.fn();
};

/**
 * Clear all database mocks
 */
const clearAllDbMocks = () => {
  jest.clearAllMocks();
};

/**
 * Create mock save function for Sequelize instances
 */
const createMockSaveFn = () => jest.fn().mockResolvedValue(true);

/**
 * Create mock destroy function for Sequelize instances
 */
const createMockDestroyFn = () => jest.fn().mockResolvedValue(true);

/**
 * Wait for async operations
 */
const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  generateAuthToken,
  createTestApp,
  authenticatedRequest,
  createMockUser,
  createMockStudentProfile,
  createMockCompanyProfile,
  createMockJob,
  createMockApplication,
  createMockReport,
  expectSuccessResponse,
  expectErrorResponse,
  expectPaginationStructure,
  mockDbMethods,
  clearAllDbMocks,
  createMockSaveFn,
  createMockDestroyFn,
  waitFor,
};
