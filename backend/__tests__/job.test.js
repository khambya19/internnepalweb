const jobController = require('../src/controllers/jobController');
const { Job, CompanyProfile, Application } = require('../src/models');

jest.mock('../src/models', () => ({
  Job: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  CompanyProfile: {
    findOne: jest.fn(),
    count: jest.fn(),
  },
  User: {},
  Application: {
    count: jest.fn(),
  },
  sequelize: {
    fn: jest.fn(),
    col: jest.fn(),
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

describe('Job Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createJob should create job for valid company profile', async () => {
    CompanyProfile.findOne.mockResolvedValue({ id: 'company-1', userId: 1 });
    Job.create.mockResolvedValue({ id: 'job-1', title: 'Intern' });

    const req = {
      user: { id: 1, role: 'company' },
      body: { title: 'Intern', description: 'Desc', status: 'live' },
    };
    const res = createRes();

    await jobController.createJob(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(Job.create).toHaveBeenCalledTimes(1);
  });

  test('updateJob should allow owner company', async () => {
    const job = {
      id: 'job-1',
      companyId: 'company-1',
      update: jest.fn().mockResolvedValue({ id: 'job-1', title: 'Updated' }),
    };

    CompanyProfile.findOne.mockResolvedValue({ id: 'company-1', userId: 1 });
    Job.findByPk.mockResolvedValue(job);

    const req = {
      user: { id: 1, role: 'company' },
      params: { id: 'job-1' },
      body: { title: 'Updated' },
    };
    const res = createRes();

    await jobController.updateJob(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(job.update).toHaveBeenCalled();
  });

  test('deleteJob should delete owner company job', async () => {
    const job = {
      id: 'job-1',
      companyId: 'company-1',
      destroy: jest.fn().mockResolvedValue(true),
    };

    CompanyProfile.findOne.mockResolvedValue({ id: 'company-1', userId: 1 });
    Job.findByPk.mockResolvedValue(job);

    const req = { user: { id: 1, role: 'company' }, params: { id: 'job-1' } };
    const res = createRes();

    await jobController.deleteJob(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(job.destroy).toHaveBeenCalled();
  });

  test('getLandingStats should return numeric counts', async () => {
    Job.count.mockResolvedValue(2);
    CompanyProfile.count.mockResolvedValue(1);
    Application.count.mockResolvedValue(3);

    const req = {};
    const res = createRes();

    await jobController.getLandingStats(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.activeJobs).toBe(2);
    expect(res.body.data.totalCompanies).toBe(1);
    expect(res.body.data.totalApplications).toBe(3);
  });

  test('getJob should return 404 when job does not exist', async () => {
    Job.findByPk.mockResolvedValue(null);

    const req = { params: { id: 'missing-job' } };
    const res = createRes();

    await jobController.getJob(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
