const { JobReport, Job, User, CompanyProfile, StudentProfile } = require('../models');
const { Op } = require('sequelize');

exports.submitJobReport = async (req, res) => {
  try {
    const reporterId = req.user.id;
    const { jobId, reason, description } = req.body;

    if (!jobId || !reason) {
      return res.status(400).json({ success: false, message: 'jobId and reason are required' });
    }

    // Check if job exists
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const [report, created] = await JobReport.findOrCreate({
      where: { jobId, reporterId },
      defaults: {
        reason,
        description,
        status: 'pending'
      }
    });

    if (!created) {
      return res.status(400).json({ success: false, message: 'You have already reported this job.' });
    }

    res.status(201).json({ success: true, message: 'Report submitted. Thank you for keeping InternNepal safe.', data: report });
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause = status ? { status } : {};

    const reports = await JobReport.findAll({
      where: whereClause,
      include: [
        {
          model: Job,
          attributes: [
            'id',
            'title',
            'companyId',
            'category',
            'description',
            'responsibilities',
            'requirements',
            'skills',
            'minEducation',
            'experienceLevel',
            'locations',
            'location',
            'workMode',
            'type',
            'status',
            'deadline',
            'startDate',
            'stipend',
            'stipendNote',
            'salary',
            'openings',
            'duration',
            'isPaid',
            'perks',
            'hiringPaused',
            'isRemovedByAdmin',
            'removedByAdminAt',
            'removedByReportId',
            'createdAt',
            'updatedAt'
          ],
          include: [
            {
              model: CompanyProfile,
              as: 'company',
              attributes: ['id', 'companyName', 'logo', 'location', 'industry']
            }
          ]
        },
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'dismissed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const report = await JobReport.findByPk(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = status;
    await report.save();

    res.status(200).json({ success: true, message: 'Report status updated', data: report });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.deleteReportedJob = async (req, res) => {
  try {
    const { id } = req.params; // this is the report ID
    
    const report = await JobReport.findByPk(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const job = await Job.findByPk(report.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (job.isRemovedByAdmin) {
      return res.status(200).json({
        success: true,
        message: 'Job is already removed. You can restore it with Undo.',
        data: {
          reportId: report.id,
          jobId: job.id,
          isRemovedByAdmin: true
        }
      });
    }

    const previousStatus = job.status || 'active';
    const previousHiringPaused = Boolean(job.hiringPaused);

    job.isRemovedByAdmin = true;
    job.removedByAdminAt = new Date();
    job.removedByReportId = report.id;
    job.removedPreviousStatus = previousStatus;
    job.removedPreviousHiringPaused = previousHiringPaused;
    job.status = 'closed';
    job.hiringPaused = true;
    await job.save();

    if (report.status === 'pending') {
      report.status = 'reviewed';
      await report.save();
    }

    res.status(200).json({
      success: true,
      message: 'Job removed successfully. You can undo this action.',
      data: {
        reportId: report.id,
        jobId: job.id,
        previousStatus,
        removedAt: job.removedByAdminAt
      }
    });
  } catch (error) {
    console.error('Delete reported job error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.restoreReportedJob = async (req, res) => {
  try {
    const { id } = req.params; // report ID

    const report = await JobReport.findByPk(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const job = await Job.findByPk(report.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (!job.isRemovedByAdmin) {
      return res.status(400).json({ success: false, message: 'Job is not in removed state.' });
    }

    const restoredStatus = job.removedPreviousStatus || 'active';
    const restoredHiringPaused = typeof job.removedPreviousHiringPaused === 'boolean'
      ? job.removedPreviousHiringPaused
      : false;

    job.isRemovedByAdmin = false;
    job.removedByAdminAt = null;
    job.removedByReportId = null;
    job.removedPreviousStatus = null;
    job.removedPreviousHiringPaused = null;
    job.status = restoredStatus;
    job.hiringPaused = restoredHiringPaused;
    await job.save();

    return res.status(200).json({
      success: true,
      message: 'Job restored successfully.',
      data: {
        reportId: report.id,
        jobId: job.id,
        status: job.status
      }
    });
  } catch (error) {
    console.error('Restore reported job error:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get reports submitted by a student (for student dashboard)
exports.getMyReports = async (req, res) => {
  try {
    const reporterId = req.user.id;
    
    const reports = await JobReport.findAll({
      where: { reporterId },
      include: [
        {
          model: Job,
          attributes: ['id', 'title', 'location', 'type', 'companyId'],
          include: [
            {
              model: CompanyProfile,
              as: 'company',
              attributes: ['companyName', 'logo']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Delete a report (unreport) - student can remove their own report
exports.deleteMyReport = async (req, res) => {
  try {
    const { id } = req.params; // report ID
    const reporterId = req.user.id;

    const report = await JobReport.findOne({
      where: { id, reporterId }
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found or you do not have permission to delete it' });
    }

    await report.destroy();

    res.status(200).json({ success: true, message: 'Report removed successfully. The job is no longer reported by you.' });
  } catch (error) {
    console.error('Delete my report error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get reports for jobs posted by a company (for company dashboard)
exports.getCompanyReports = async (req, res) => {
  try {
    const companyProfile = await CompanyProfile.findOne({
      where: { userId: req.user.id },
      attributes: ['id']
    });

    if (!companyProfile) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Find all jobs posted by this company
    const jobs = await Job.findAll({
      where: { companyId: companyProfile.id },
      attributes: ['id']
    });

    const jobIds = jobs.map(job => job.id);
    if (!jobIds.length) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Find all reports for these jobs
    const reports = await JobReport.findAll({
      where: { jobId: { [Op.in]: jobIds } },
      include: [
        {
          model: Job,
          attributes: ['id', 'title', 'location', 'type']
        },
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    console.error('Get company reports error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
