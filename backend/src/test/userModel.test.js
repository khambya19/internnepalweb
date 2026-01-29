const SequelizeMock = require('sequelize-mock');
const dbMock = new SequelizeMock();
const UserMock = dbMock.define('User', {
  id: 1,
  email: 'test@example.com',
  password: 'hashedpassword'
});

describe('User Model', () => {
  it('should create a user with correct fields', async () => {
    const user = await UserMock.create({
      email: 'test@example.com',
      password: 'hashedpassword'
    });
    expect(user.email).toBe('test@example.com');
    expect(user.password).toBe('hashedpassword');
  });

  // Add more tests for validation, methods, etc.
});