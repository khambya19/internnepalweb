// Test setup file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jwt-tokens';
process.env.JWT_EXPIRE = '7d';
process.env.FRONTEND_URL = 'http://localhost:5173';

// Mock email sending during tests (CommonJS-friendly shape)
const mockSendEmail = jest.fn().mockResolvedValue(true);
mockSendEmail.sendInterviewScheduledEmail = jest.fn().mockResolvedValue(true);
mockSendEmail.sendRejectionEmail = jest.fn().mockResolvedValue(true);

jest.mock('../src/utils/sendEmail', () => mockSendEmail);

// Increase timeout for database operations
jest.setTimeout(10000);

// Global test utilities
global.mockUser = {
  student: {
    id: 1,
    name: 'Test Student',
    email: 'student@test.com',
    phone: '1234567890',
    role: 'student',
    password: '$2b$10$XYZ...',
  },
  company: {
    id: 2,
    name: 'Test Company',
    email: 'company@test.com',
    phone: '0987654321',
    role: 'company',
    password: '$2b$10$ABC...',
  },
  superadmin: {
    id: 3,
    name: 'Super Admin',
    email: 'superadmin@test.com',
    phone: '1111111111',
    role: 'superadmin',
    password: '$2b$10$DEF...',
  },
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
