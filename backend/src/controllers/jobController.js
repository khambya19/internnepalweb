const { Job, CompanyProfile, User, Application, sequelize } = require('../models');
const { Op } = require('sequelize');

const ACTIVE_STATUS_WHERE = {
  isRemovedByAdmin: false,
  status: {
    [Op.in]: ['active', 'live', 'Active', 'Live', 'ACTIVE', 'LIVE']
  }
};

const normalizeJobStatus = (status) => {
  if (typeof status !== 'string') return status;
  const normalized = status.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === 'live') return 'active';
  if (normalized === 'expired') return 'closed';
  return normalized;
};

const getSortOrder = (sortBy) => {
  if (sortBy === 'oldest') return [['createdAt', 'ASC']];
  if (sortBy === 'deadline') return [['deadline', 'ASC'], ['createdAt', 'DESC']];
  return [['createdAt', 'DESC']]; // newest (default)
};

// Helper function to calculate company response rate
const calculateResponseRate = async (companyId) => {
  try {
    // Get all jobs for this company
    const companyJobs = await Job.findAll({
      where: { companyId },
      attributes: ['id']
    });

    if (companyJobs.length === 0) {
      return { responseRate: null, avgResponseDays: null, totalApplications: 0 };
    }

    const jobIds = companyJobs.map(j => j.id);

    // Get all applications for these jobs
    const applications = await Application.findAll({
      where: { jobId: { [Op.in]: jobIds } },
      attributes: ['id', 'status', 'createdAt', 'updatedAt'],
      raw: true
    });

    const totalApplications = applications.length;

    if (totalApplications === 0) {
      return { responseRate: null, avgResponseDays: null, totalApplications: 0 };
    }

    // Responded means status moved out of pending/applied within 7 days.
    const respondedApplications = applications.filter((app) => {
      const status = String(app.status || '').trim().toLowerCase();
      if (status === 'pending' || status === 'applied') return false;

      const created = new Date(app.createdAt);
      const updated = new Date(app.updatedAt);
      if (Number.isNaN(created.getTime()) || Number.isNaN(updated.getTime())) return false;

      const diffDays = (updated - created) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    });

    const respondedCount = respondedApplications.length;

    // Calculate average response time for those responded applications
    const totalResponseDays = respondedApplications.reduce((sum, app) => {
      const created = new Date(app.createdAt);
      const updated = new Date(app.updatedAt);
      return sum + (updated - created) / (1000 * 60 * 60 * 24);
    }, 0);

    const responseRate = totalApplications > 0 
      ? Math.round((respondedCount / totalApplications) * 100) 
      : 0;

    const avgResponseDays = respondedCount > 0
      ? Math.max(1, Math.round(totalResponseDays / respondedCount))
      : null;

    return {
      responseRate,
      avgResponseDays,
      totalApplications,
      respondedCount
    };
  } catch (error) {
    console.error('Error calculating response rate:', error);
    return { responseRate: null, avgResponseDays: null, totalApplications: 0 };
  }
};

exports.createJob = async (req, res) => {
  try {
    const companyProfile = await CompanyProfile.findOne({ where: { userId: req.user.id } });
    if (!companyProfile) {
      return res.status(403).json({ success: false, message: 'Create a company profile first' });
    }

    const payload = { ...req.body };
    const normalizedStatus = normalizeJobStatus(payload.status);
    if (normalizedStatus) {
      payload.status = normalizedStatus;
    }

    const job = await Job.create({
      ...payload,
      companyId: companyProfile.id
    });

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const sortBy = String(req.query.sortBy || 'newest').trim().toLowerCase();
    const jobs = await Job.findAll({
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('Applications.id')), 'applicantCount']
        ]
      },
      include: [
        { model: CompanyProfile, as: 'company', attributes: ['id', 'companyName', 'location', 'logo'] },
        { model: Application, attributes: [], required: false }
      ],
      where: ACTIVE_STATUS_WHERE,
      group: ['Job.id', 'company.id'],
      order: getSortOrder(sortBy)
    });

    const now = new Date();
    const result = [];

    // Cache for company response rates to avoid duplicate queries
    const companyResponseRates = new Map();

    await Promise.all(jobs.map(async (job) => {
      if (job.deadline && new Date(job.deadline) < now) {
        if (job.status !== 'expired') await job.update({ status: 'expired' });
        // skip expired jobs from browse listing
      } else {
        const applicantCount = Number(job.get('applicantCount') || 0);
        const jobData = { ...job.toJSON(), applicantCount, applicationsCount: applicantCount };

        // Add response rate for the company
        if (job.company && job.company.id) {
          const companyId = job.company.id;
          
          // Check cache first
          if (!companyResponseRates.has(companyId)) {
            const responseStats = await calculateResponseRate(companyId);
            companyResponseRates.set(companyId, responseStats);
          }

          jobData.company.responseRate = companyResponseRates.get(companyId);
        }

        result.push(jobData);
      }
    }));

    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getLandingStats = async (req, res) => {
  try {
    const [activeJobs, totalCompanies, totalApplications] = await Promise.all([
      Job.count({ where: ACTIVE_STATUS_WHERE }),
      CompanyProfile.count(),
      Application.count()
    ]);

    return res.status(200).json({
      success: true,
      data: {
        activeJobs: Number(activeJobs || 0),
        totalCompanies: Number(totalCompanies || 0),
        totalApplications: Number(totalApplications || 0),
        averageCompanyRating: null,
        totalReviews: 0
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id, {
      include: [{
        model: CompanyProfile,
        as: 'company',
        attributes: [
          'id',
          'companyName',
          'location',
          'logo',
          'banner',
          'description',
          'about',
          'tagline',
          'website',
          'industry',
          'companySize',
          'foundedYear',
          'phone',
          'email',
          'linkedin',
          'twitter',
          'facebook',
          'instagram',
          'github'
        ],
        include: [{ model: User, attributes: ['email'] }]
      }]
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (job.deadline && new Date(job.deadline) < new Date() && job.status !== 'expired') {
      await job.update({ status: 'expired' });
      return res.status(404).json({ success: false, message: 'Job is no longer available' });
    }

    const normalizedStatus = String(job.status || '').toLowerCase();
    if (job.isRemovedByAdmin || !['active', 'live'].includes(normalizedStatus)) {
      return res.status(404).json({ success: false, message: 'Job is no longer available' });
    }

    // Add response rate for the company
    if (job.CompanyProfile && job.CompanyProfile.id) {
      const responseStats = await calculateResponseRate(job.CompanyProfile.id);
      job.CompanyProfile.dataValues.responseRate = responseStats;
    }

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getMyJobs = async (req, res) => {
  try {
    const companyProfile = await CompanyProfile.findOne({ where: { userId: req.user.id } });
    if (!companyProfile) {
      return res.status(403).json({ success: false, message: 'Create a company profile first' });
    }

    const jobs = await Job.findAll({
      where: { companyId: companyProfile.id },
      order: [['createdAt', 'DESC']],
      include: [{ model: CompanyProfile, as: 'company', attributes: ['companyName', 'location', 'logo'] }]
    });

    // Expire jobs if deadline is passed
    const now = new Date();
    await Promise.all(jobs.map(async (job) => {
      if (job.deadline && new Date(job.deadline) < now && job.status !== 'expired') {
        await job.update({ status: 'expired' });
      }
    }));

    // For each job, count applications and ensure CompanyProfile is attached
    const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
      const applicationsCount = await job.countApplications();
      // Ensure CompanyProfile is attached and logo is present
      let companyProfile = job.company || job.CompanyProfile || null;
      if (!companyProfile) {
        companyProfile = await CompanyProfile.findByPk(job.companyId, {
          attributes: ['companyName', 'location', 'logo']
        });
      }
      return { ...job.toJSON(), applicationsCount, CompanyProfile: companyProfile };
    }));

    res.status(200).json({ success: true, count: jobsWithCounts.length, data: jobsWithCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const companyProfile = await CompanyProfile.findOne({ where: { userId: req.user.id } });
    if (!companyProfile) return res.status(403).json({ success: false, message: 'Not authorized' });

    let job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    if (job.companyId !== companyProfile.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this job' });
    }

    const payload = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
      const normalizedStatus = normalizeJobStatus(payload.status);
      if (normalizedStatus) {
        payload.status = normalizedStatus;
      } else {
        delete payload.status;
      }
    }

    job = await job.update(payload);
    res.status(200).json({ success: true, data: job });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.deleteJob = async (req, res) => {
    try {
      const companyProfile = await CompanyProfile.findOne({ where: { userId: req.user.id } });
      if (!companyProfile) return res.status(403).json({ success: false, message: 'Not authorized' });
  
      let job = await Job.findByPk(req.params.id);
      if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  
      if (job.companyId !== companyProfile.id) {
          return res.status(403).json({ success: false, message: 'Not authorized to delete this job' });
      }
  
      await job.destroy();
      res.status(200).json({ success: true, data: {} });
  
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
  };

exports.toggleHiringPause = async (req, res) => {
  try {
    const companyProfile = await CompanyProfile.findOne({ where: { userId: req.user.id } });
    if (!companyProfile) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let job = await Job.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (job.companyId !== companyProfile.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this job' });
    }

    // Toggle the hiringPaused status
    job.hiringPaused = !job.hiringPaused;
    await job.save();

    res.status(200).json({ 
      success: true, 
      data: job,
      message: job.hiringPaused ? 'Hiring paused successfully' : 'Hiring resumed successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
