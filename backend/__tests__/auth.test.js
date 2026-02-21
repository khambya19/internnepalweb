const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authController = require('../src/controllers/authController');
const { User } = require('../src/models');

jest.mock('../src/models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  StudentProfile: {
    findOne: jest.fn(),
  },
  CompanyProfile: {
    findOne: jest.fn(),
  },
}));

const createRes = () => {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = jest.fn(function setStatus(code) {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn(function setJson(payload) {
    res.body = payload;
    return res;
  });
  return res;
};

describe('Authentication Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('register should create user and return OTP message', async () => {
    User.create.mockResolvedValue({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'student',
      isVerified: false,
    });

    const req = {
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password@123',
        phone: '1234567890',
        role: 'student',
      },
    };
    const res = createRes();

    await authController.register(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('OTP');
  });

  test('login should succeed for verified active user', async () => {
    const password = 'Password@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    User.findOne.mockResolvedValue({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      role: 'student',
      isActive: true,
      isVerified: true,
      tokenVersion: 0,
    });

    const req = { body: { email: 'john@example.com', password } };
    const res = createRes();

    await authController.login(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
  });

  test('request-password-reset should return generic message for existing user', async () => {
    User.findOne.mockResolvedValue({
      id: 1,
      email: 'john@example.com',
      otp: null,
      otpExpires: null,
      otpAttempts: 0,
      otpBlockedUntil: null,
      save: jest.fn().mockResolvedValue(true),
    });

    const req = { body: { email: 'john@example.com' } };
    const res = createRes();

    await authController.requestPasswordReset(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('If an account exists');
  });

  test('verify-reset-otp should return reset token for valid OTP', async () => {
    User.findOne.mockResolvedValue({
      id: 1,
      email: 'john@example.com',
      otp: '123456',
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),
      otpAttempts: 0,
      otpBlockedUntil: null,
      save: jest.fn().mockResolvedValue(true),
    });

    const req = { body: { email: 'john@example.com', otp: '123456' } };
    const res = createRes();

    await authController.verifyResetOtp(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.resetToken).toBeDefined();
  });

  test('reset-password should reset with valid token + OTP session', async () => {
    const otp = '123456';
    const resetToken = jwt.sign(
      { id: 1, email: 'john@example.com', type: 'password_reset', otp },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    const currentPassword = await bcrypt.hash('Password@123', 10);
    const mockUser = {
      id: 1,
      email: 'john@example.com',
      password: currentPassword,
      otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),
      otpAttempts: 0,
      otpBlockedUntil: null,
      tokenVersion: 0,
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(mockUser);

    const req = {
      body: {
        resetToken,
        newPassword: 'NewPassword@123',
        confirmPassword: 'NewPassword@123',
      },
    };
    const res = createRes();

    await authController.resetPassword(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Password reset successful');
    expect(mockUser.save).toHaveBeenCalled();
  });
});
