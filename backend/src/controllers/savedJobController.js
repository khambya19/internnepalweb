const { SavedJob, Job, CompanyProfile } = require('../models');
const { Op } = require('sequelize');

const ACTIVE_STATUS_WHERE = {
  isRemovedByAdmin: false,
  [Op.or]: [
    { status: { [Op.iLike]: 'active' } },
    { status: { [Op.iLike]: 'live' } }
  ]
};

exports.saveJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    const job = await Job.findOne({
      where: { id: jobId, ...ACTIVE_STATUS_WHERE },
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found or inactive' });
    }

    const [savedJob] = await SavedJob.findOrCreate({
      where: { userId, jobId },
      defaults: { userId, jobId },
    });

    return res.status(201).json({ success: true, data: savedJob });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

exports.unsaveJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    await SavedJob.destroy({
      where: { userId, jobId },
    });

    return res.status(200).json({
      success: true,
      message: 'Job removed from saved list (if it existed)',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

exports.getSavedJobs = async (req, res) => {
  try {
    const userId = req.user.id;

    const savedJobs = await SavedJob.findAll({
      where: { userId },
      include: [
        {
          model: Job,
          where: ACTIVE_STATUS_WHERE,
          required: true,
          include: [
            {
              model: CompanyProfile,
              as: 'company',
              attributes: ['companyName', 'location', 'logo'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      count: savedJobs.length,
      data: savedJobs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};
