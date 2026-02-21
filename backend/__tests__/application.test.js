const applicationController = require('../src/controllers/applicationController');
const { Application, Job, CompanyProfile, Notification } = require('../src/models');

jest.mock('../src/models', () => ({
  Application: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  Job: {
    findByPk: jest.fn(),
  },
  CompanyProfile: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  Notification: {
    findAll: jest.fn(),
    create: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
  StudentProfile: {},
  InternRating: {},
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

describe('Application Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('applyForJob should create application for active job', async () => {
    Job.findByPk.mockResolvedValue({
      id: 'job-1',
      title: 'Intern',
      status: 'active',
      isRemovedByAdmin: false,
      hiringPaused: false,
      companyId: 'company-1',
    });
    CompanyProfile.findByPk.mockResolvedValue({ userId: 2 });
    Application.findOne.mockResolvedValue(null);
    Application.create.mockResolvedValue({ id: 'app-1', jobId: 'job-1', studentId: 1 });
    Notification.create.mockResolvedValue({ id: 'n1' });

    const req = {
      params: { jobId: 'job-1' },
      body: { coverLetter: 'Interested' },
      user: { id: 1, role: 'student', name: 'Student User' },
    };
    const res = createRes();

    await applicationController.applyForJob(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('getMyApplications should return list', async () => {
    Application.findAll.mockResolvedValue([
      {
        toJSON: () => ({
          id: 'app-1',
          status: 'Applied',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          Job: { id: 'job-1', title: 'Intern' },
        }),
      },
    ]);
    Notification.findAll.mockResolvedValue([]);

    const req = { user: { id: 1 } };
    const res = createRes();

    await applicationController.getMyApplications(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  test('updateApplicationStatus should update for owner company', async () => {
    const application = {
      id: 'app-1',
      status: 'Applied',
      statusHistory: [],
      Job: { id: 'job-1', companyId: 'company-1', title: 'Intern', company: { companyName: 'ABC' } },
      studentId: 1,
      save: jest.fn().mockResolvedValue(true),
      reload: jest.fn().mockResolvedValue(true),
    };

    Application.findByPk.mockResolvedValue(application);
    CompanyProfile.findOne.mockResolvedValue({ id: 'company-1', userId: 2 });

    const req = {
      params: { id: 'app-1' },
      body: { status: 'Shortlisted' },
      user: { id: 2, role: 'company' },
    };
    const res = createRes();

    await applicationController.updateApplicationStatus(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(application.save).toHaveBeenCalled();
  });

  test('withdrawApplication should allow pending/applied app', async () => {
    const application = {
      id: 'app-1',
      studentId: 1,
      status: 'Applied',
      Job: { id: 'job-1', title: 'Intern', company: { userId: 2 } },
      destroy: jest.fn().mockResolvedValue(true),
    };

    Application.findByPk.mockResolvedValue(application);
    Notification.create.mockResolvedValue({ id: 'n1' });

    const req = { params: { id: 'app-1' }, user: { id: 1, name: 'Student User' } };
    const res = createRes();

    await applicationController.withdrawApplication(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('withdrawn successfully');
    expect(application.destroy).toHaveBeenCalled();
  });
});
