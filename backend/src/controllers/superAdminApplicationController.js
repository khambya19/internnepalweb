// Super Admin Application Management Controller
const { Application, Job, StudentProfile, User, CompanyProfile, sequelize } = require('../models');
const { Op, QueryTypes } = require('sequelize');

// Get all applications with pagination and filters
exports.getAllApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;

    // If search provided, get application IDs that match job title, company name, or student name
    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      const jobResults = await sequelize.query(
        `SELECT a.id FROM "Applications" a
         INNER JOIN "Jobs" j ON a."jobId" = j.id
         INNER JOIN "CompanyProfiles" cp ON j."companyId" = cp.id
         WHERE j.title ILIKE :search OR cp."companyName" ILIKE :search`,
        { replacements: { search: searchPattern }, type: QueryTypes.SELECT }
      );
      const studentResults = await sequelize.query(
        `SELECT a.id FROM "Applications" a
         INNER JOIN "Users" u ON a."studentId" = u.id
         WHERE u.name ILIKE :search OR u.email ILIKE :search`,
        { replacements: { search: searchPattern }, type: QueryTypes.SELECT }
      );
      const ids = [...new Set([
        ...(jobResults || []).map((r) => r.id),
        ...(studentResults || []).map((r) => r.id)
      ])];
      if (ids.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            applications: [],
            pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), pages: 0 }
          }
        });
      }
      where.id = { [Op.in]: ids };
    }

    // Simple, stable include so rows always return correctly
    const include = [
      {
        model: Job,
        attributes: ['id', 'title', 'status', 'companyId'],
        required: false,
        include: [
          {
            model: CompanyProfile,
            as: 'company',
            attributes: ['id', 'companyName'],
            required: false
          }
        ]
      },
      {
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'email'],
        required: false,
        include: [
          {
            model: StudentProfile,
            attributes: ['id', 'major', 'university', 'graduationYear'],
            required: false
          }
        ]
      }
    ];

    const { count, rows } = await Application.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include,
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    const applications = rows.map((row) => {
      const plain = row.toJSON();
      return {
        ...plain,
        job: plain.job || plain.Job || null,
        student: plain.student || null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get single application by ID
exports.getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findByPk(id, {
      include: [
        {
          model: Job,
          attributes: ['id', 'title', 'description', 'status'],
          include: [
            {
              model: CompanyProfile,
              as: 'company',
              attributes: ['id', 'companyName']
            }
          ]
        },
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email', 'phone'],
          include: [
            {
              model: StudentProfile,
              attributes: ['id', 'major', 'university', 'graduationYear']
            }
          ]
        }
      ]
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const plain = application.toJSON();
    const normalized = {
      ...plain,
      job: plain.job || plain.Job || null,
      student: plain.student || null
    };

    res.status(200).json({
      success: true,
      data: { application: normalized }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'shortlisted', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    application.status = status;
    await application.save();

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: { application }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Delete application
exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    await application.destroy();

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
