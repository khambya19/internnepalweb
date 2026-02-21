const superAdminController = require('../src/controllers/superAdminController');
const { User, Job, Application, Notification, StudentProfile } = require('../src/models');

jest.mock('../src/models', () => ({
  User: {
    count: jest.fn(),
    findAll: jest.fn(),
  },
  Job: {
    count: jest.fn(),
    findAll: jest.fn(),
    sum: jest.fn(),
  },
  Application: {
    count: jest.fn(),
    findAll: jest.fn(),
  },
  Notification: {
    count: jest.fn(),
  },
  StudentProfile: {
    sum: jest.fn(),
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

describe('Super Admin Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getDashboardStats should return stats object', async () => {
    User.count
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(30);
    Job.count
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(75);
    Application.count
      .mockResolvedValueOnce(250)
      .mockResolvedValueOnce(80);
    Notification.count.mockResolvedValue(10);

    User.findAll.mockResolvedValue([]);
    Job.findAll.mockResolvedValue([]);
    Application.findAll.mockResolvedValue([]);

    const req = {};
    const res = createRes();

    await superAdminController.getDashboardStats(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stats).toHaveProperty('totalUsers', 50);
    expect(res.body.data.stats).toHaveProperty('totalJobs', 100);
  });

  test('getSidebarCounts should return sidebar totals', async () => {
    User.count
      .mockResolvedValueOnce(30)
      .mockResolvedValueOnce(20);
    Job.count.mockResolvedValue(100);
    Application.count.mockResolvedValue(250);

    const req = {};
    const res = createRes();

    await superAdminController.getSidebarCounts(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        students: 30,
        companies: 20,
        jobs: 100,
        applications: 250,
      })
    );
  });

  test('getViewStats should return job/profile view totals', async () => {
    Job.sum.mockResolvedValue(123);
    StudentProfile.sum.mockResolvedValue(45);

    const req = {};
    const res = createRes();

    await superAdminController.getViewStats(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ totalJobViews: 123, totalProfileViews: 45 });
  });
});
