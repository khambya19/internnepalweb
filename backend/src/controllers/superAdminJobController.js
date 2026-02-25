// Super Admin Job Management Controller
const { Job, CompanyProfile, User, Application } = require('../models');
const { Op } = require('sequelize');

// Get all jobs with pagination and filters
exports.getAllJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Job.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: CompanyProfile,
          as: 'company',
          include: [{ model: User, attributes: ['name', 'email'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        jobs: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get single job by ID
exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findByPk(id, {
      include: [
        {
          model: CompanyProfile,
          as: 'company',
          include: [{ model: User, attributes: ['name', 'email'] }]
        }
      ]
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Get application count
    const applicationCount = await Application.count({ where: { jobId: id } });

    res.status(200).json({
      success: true,
      data: { job, applicationCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Update job
exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Update job fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        job[key] = updates[key];
      }
    });

    await job.save();

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: { job }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Delete job
exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    await job.destroy();

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Change job status
exports.changeJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'closed', 'draft'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    job.status = status;
    await job.save();

    res.status(200).json({
      success: true,
      message: 'Job status updated successfully',
      data: { job }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
