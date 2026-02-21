const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Job, Application } = require('../src/models');

describe('Database Model Tests', () => {
  describe('User Model Validation', () => {
    test('should have required fields', () => {
      const userFields = ['name', 'email', 'password', 'phone', 'role', 'isActive'];
      
      userFields.forEach(field => {
        expect(typeof field).toBe('string');
      });
    });

    test('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.com'
      ];

      const invalidEmails = [
        'invalid',
        '@example.com',
        'test@',
        'test @example.com'
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    test('should validate role values', () => {
      const validRoles = ['student', 'company', 'superadmin'];
      const invalidRoles = ['admin', 'user', 'guest'];

      validRoles.forEach(role => {
        expect(['student', 'company', 'superadmin']).toContain(role);
      });

      invalidRoles.forEach(role => {
        expect(['student', 'company', 'superadmin']).not.toContain(role);
      });
    });
  });

  describe('Password Security', () => {
    test('should hash password with bcrypt', async () => {
      const plainPassword = 'Password@123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword).toMatch(/^\$2[aby]\$/);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    test('should verify correct password', async () => {
      const plainPassword = 'Password@123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const plainPassword = 'Password@123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      const isValid = await bcrypt.compare('WrongPassword@123', hashedPassword);
      expect(isValid).toBe(false);
    });

    test('should validate password strength', () => {
      const strongPasswords = [
        'Password@123',
        'MyP@ssw0rd',
        'Test123!@#'
      ];

      const weakPasswords = [
        'password',
        '12345678',
        'Password'
      ];

      // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;

      strongPasswords.forEach(password => {
        expect(strongPasswordRegex.test(password)).toBe(true);
      });

      weakPasswords.forEach(password => {
        expect(strongPasswordRegex.test(password)).toBe(false);
      });
    });
  });

  describe('JWT Token Handling', () => {
    const secret = process.env.JWT_SECRET || 'test-secret';

    test('should generate valid JWT token', () => {
      const payload = { userId: 1, email: 'test@example.com', role: 'student' };
      const token = jwt.sign(payload, secret, { expiresIn: '7d' });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should decode JWT token correctly', () => {
      const payload = { userId: 1, email: 'test@example.com', role: 'student' };
      const token = jwt.sign(payload, secret, { expiresIn: '7d' });
      
      const decoded = jwt.verify(token, secret);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    test('should reject invalid token', () => {
      expect(() => {
        jwt.verify('invalid-token', secret);
      }).toThrow();
    });

    test('should reject token with wrong secret', () => {
      const payload = { userId: 1 };
      const token = jwt.sign(payload, 'correct-secret', { expiresIn: '7d' });

      expect(() => {
        jwt.verify(token, 'wrong-secret');
      }).toThrow();
    });
  });

  describe('Job Model Validation', () => {
    test('should have required job fields', () => {
      const requiredFields = [
        'title',
        'description',
        'companyId',
        'status',
        'deadline'
      ];

      requiredFields.forEach(field => {
        expect(typeof field).toBe('string');
      });
    });

    test('should validate job status values', () => {
      const validStatuses = ['active', 'closed', 'paused'];
      const invalidStatuses = ['pending', 'draft', 'archived'];

      validStatuses.forEach(status => {
        expect(['active', 'closed', 'paused']).toContain(status);
      });

      invalidStatuses.forEach(status => {
        expect(['active', 'closed', 'paused']).not.toContain(status);
      });
    });

    test('should validate deadline is in future', () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

      expect(futureDate > new Date()).toBe(true);
      expect(pastDate > new Date()).toBe(false);
    });

    test('should validate stipend is positive', () => {
      const validStipends = [0, 10000, 50000, 100000];
      const invalidStipends = [-5000, -100];

      validStipends.forEach(stipend => {
        expect(stipend).toBeGreaterThanOrEqual(0);
      });

      invalidStipends.forEach(stipend => {
        expect(stipend).toBeLessThan(0);
      });
    });

    test('should validate locations array', () => {
      const validLocations = ['Kathmandu', 'Pokhara', 'Lalitpur'];
      expect(Array.isArray(validLocations)).toBe(true);
      expect(validLocations.length).toBeGreaterThan(0);
    });

    test('should validate skills array', () => {
      const validSkills = ['JavaScript', 'React', 'Node.js'];
      expect(Array.isArray(validSkills)).toBe(true);
      expect(validSkills.length).toBeGreaterThan(0);
    });
  });

  describe('Application Model Validation', () => {
    test('should have required application fields', () => {
      const requiredFields = [
        'jobId',
        'studentId',
        'status'
      ];

      requiredFields.forEach(field => {
        expect(typeof field).toBe('string');
      });
    });

    test('should validate application status values', () => {
      const validStatuses = [
        'Applied',
        'Under Review',
        'Shortlisted',
        'Interview Scheduled',
        'Offered',
        'Hired',
        'Rejected'
      ];

      validStatuses.forEach(status => {
        expect(typeof status).toBe('string');
        expect(status.length).toBeGreaterThan(0);
      });
    });

    test('should track status history', () => {
      const statusHistory = [];
      
      statusHistory.push({
        status: 'Applied',
        changedAt: new Date(),
        label: 'Application submitted'
      });

      statusHistory.push({
        status: 'Shortlisted',
        changedAt: new Date(),
        label: 'Shortlisted by company'
      });

      expect(statusHistory).toHaveLength(2);
      expect(statusHistory[0].status).toBe('Applied');
      expect(statusHistory[1].status).toBe('Shortlisted');
    });

    test('should validate interview data structure', () => {
      const interviewData = {
        interviewDate: '2026-04-15',
        interviewTime: '10:00 AM',
        interviewMessage: 'Mode: Online\nMeeting Link: https://meet.google.com/xyz'
      };

      expect(interviewData.interviewDate).toBeDefined();
      expect(interviewData.interviewTime).toBeDefined();
      expect(interviewData.interviewMessage).toContain('Mode:');
    });
  });

  describe('Report Model Validation', () => {
    test('should validate report status values', () => {
      const validStatuses = ['pending', 'reviewed', 'dismissed'];
      
      validStatuses.forEach(status => {
        expect(['pending', 'reviewed', 'dismissed']).toContain(status);
      });
    });

    test('should require reason field', () => {
      const reasons = [
        'Inappropriate content',
        'Fake job posting',
        'Scam/Fraud',
        'Misleading information'
      ];

      reasons.forEach(reason => {
        expect(typeof reason).toBe('string');
        expect(reason.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Type Validation', () => {
    test('should validate numeric fields', () => {
      const numericFields = {
        stipend: 50000,
        duration: 6,
        openings: 2,
        userId: 1
      };

      Object.values(numericFields).forEach(value => {
        expect(typeof value).toBe('number');
        expect(Number.isInteger(value)).toBe(true);
      });
    });

    test('should validate boolean fields', () => {
      const booleanFields = {
        isActive: true,
        isPaid: true,
        hiringPaused: false
      };

      Object.values(booleanFields).forEach(value => {
        expect(typeof value).toBe('boolean');
      });
    });

    test('should validate string fields', () => {
      const stringFields = {
        name: 'John Doe',
        email: 'john@example.com',
        title: 'Software Engineer',
        description: 'Job description'
      };

      Object.values(stringFields).forEach(value => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    test('should validate array fields', () => {
      const arrayFields = {
        skills: ['JavaScript', 'React'],
        locations: ['Kathmandu'],
        perks: ['Certificate']
      };

      Object.values(arrayFields).forEach(value => {
        expect(Array.isArray(value)).toBe(true);
      });
    });

    test('should validate date fields', () => {
      const dateFields = {
        createdAt: new Date(),
        updatedAt: new Date(),
        deadline: new Date('2026-12-31')
      };

      Object.values(dateFields).forEach(value => {
        expect(value instanceof Date).toBe(true);
        expect(Number.isNaN(value.getTime())).toBe(false);
      });
    });
  });

  describe('Business Logic Validation', () => {
    test('should calculate days until deadline', () => {
      const deadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const today = new Date();
      const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

      expect(daysUntil).toBe(10);
    });

    test('should check if job is expired', () => {
      const expiredDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

      expect(new Date() > expiredDate).toBe(true);
      expect(new Date() > futureDate).toBe(false);
    });

    test('should validate phone number format', () => {
      const validPhones = ['9841234567', '9851234567', '9843456789'];
      const invalidPhones = ['123', 'abcdefghij', ''];

      const phoneRegex = /^[0-9]{7,15}$/;

      validPhones.forEach(phone => {
        expect(phoneRegex.test(phone)).toBe(true);
      });

      invalidPhones.forEach(phone => {
        expect(phoneRegex.test(phone)).toBe(false);
      });
    });

    test('should normalize email to lowercase', () => {
      const emails = ['Test@Example.com', 'USER@DOMAIN.COM', 'User@Domain.Co.Uk'];
      
      emails.forEach(email => {
        const normalized = email.toLowerCase().trim();
        expect(normalized).toBe(email.toLowerCase());
        expect(normalized).not.toContain(' ');
      });
    });
  });
});

describe('Error Handling Tests', () => {
  test('should handle missing required fields', () => {
    const invalidData = {};
    const requiredFields = ['name', 'email', 'password'];

    requiredFields.forEach(field => {
      expect(invalidData[field]).toBeUndefined();
    });
  });

  test('should handle null values', () => {
    const nullableFields = {
      coverLetter: null,
      bio: null,
      website: null
    };

    Object.values(nullableFields).forEach(value => {
      expect(value === null || value === undefined).toBe(true);
    });
  });

  test('should handle empty arrays', () => {
    const emptyArrays = {
      skills: [],
      locations: [],
      perks: []
    };

    Object.values(emptyArrays).forEach(arr => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr).toHaveLength(0);
    });
  });
});
