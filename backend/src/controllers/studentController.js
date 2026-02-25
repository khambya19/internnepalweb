const { StudentProfile, User, Application, Job, CompanyProfile, SavedJob } = require('../models');
const { Op } = require('sequelize');

const ACTIVE_STATUS_WHERE = {
  isRemovedByAdmin: false,
  [Op.or]: [
    { status: { [Op.iLike]: 'active' } },
    { status: { [Op.iLike]: 'live' } }
  ]
};

const normalizeApplicationStatus = (status) => {
  if (!status) return null;
  const lower = (status || '').toLowerCase().trim();

  if (lower === 'applied' || lower === 'pending' || lower === 'under review') return 'pending';
  if (lower === 'shortlisted') return 'shortlisted';
  if (lower === 'accepted' || lower === 'hired') return 'accepted';
  if (lower === 'rejected') return 'rejected';
  if (lower === 'interview scheduled') return 'interview';

  return null;
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, university, major, graduationYear, skills, resumeUrl, github, linkedin, portfolio, bio, avatar, banner, openToWork } = req.body;

    const normalizedUniversity = String(university || '').trim();
    const normalizedMajor = String(major || '').trim();
    const parsedGraduationYear =
      graduationYear && !Number.isNaN(parseInt(graduationYear, 10))
        ? parseInt(graduationYear, 10)
        : null;
    
    // Validate required education details
    if (!normalizedUniversity || !normalizedMajor || !parsedGraduationYear) {
      return res.status(400).json({
        success: false,
        message: 'University, major, and graduation year are required.'
      });
    }

    if (parsedGraduationYear < 1900 || parsedGraduationYear > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Graduation year must be between 1900 and 2100.'
      });
    }

    // Validate required resume URL
    if (!resumeUrl || resumeUrl.trim() === '') {
      return res.status(400).json({ success: false, message: 'Resume URL is required' });
    }
    if (!/^https?:\/\/.+/.test(resumeUrl)) {
      return res.status(400).json({ success: false, message: 'Resume URL must be a valid URL' });
    }
    
    let avatarUrl = undefined;
    if (req.file && req.file.filename) {
      avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    // Update User table fields (name and phone) if provided
    if (name || phone !== undefined) {
      const userUpdateFields = {};
      if (name) userUpdateFields.name = name;
      if (phone !== undefined) userUpdateFields.phone = phone;
      
      await User.update(userUpdateFields, { where: { id: req.user.id } });
    }

    const normalizedSkills = Array.isArray(skills)
      ? skills.filter((s) => typeof s === 'string' && s.trim().length > 0)
      : [];
    let profile = await StudentProfile.findOne({ where: { userId: req.user.id } });

    const updateFields = {
      university: normalizedUniversity,
      major: normalizedMajor,
      graduationYear: parsedGraduationYear,
      skills: normalizedSkills,
      resumeUrl,
      github,
      linkedin,
      portfolio,
      bio,
      avatar,
      banner
    };
    if (avatarUrl) updateFields.avatar = avatarUrl;
    if (openToWork !== undefined) updateFields.openToWork = Boolean(openToWork);

    if (!profile) {
      profile = await StudentProfile.create({
        userId: req.user.id,
        ...updateFields
      });
    } else {
      profile = await profile.update(updateFields);
    }

    // Fetch updated profile with User data
    profile = await StudentProfile.findOne({
      where: { userId: req.user.id },
      include: [{ model: User, attributes: ['name', 'email', 'phone'] }]
    });

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    let profile = await StudentProfile.findOne({ 
      where: { userId: req.user.id },
      include: [{ model: User, attributes: ['name', 'email', 'phone'] }]
    });

    if (!profile) {
      // Create empty profile if it doesn't exist
      profile = await StudentProfile.create({ userId: req.user.id });
      // Fetch again with User data
      profile = await StudentProfile.findOne({ 
        where: { userId: req.user.id },
        include: [{ model: User, attributes: ['name', 'email', 'phone'] }]
      });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await StudentProfile.findAll({
      include: [{ model: User, attributes: ['id', 'name', 'email', 'phone'] }]
    });

    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const studentId = req.user.id;

    const applications = await Application.findAll({
      where: { studentId },
      include: [
        {
          model: Job,
          include: [
            {
              model: CompanyProfile,
              as: 'company',
              attributes: ['companyName', 'logo', 'location']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const stats = {
      totalApplications: applications.length,
      pending: 0,
      shortlisted: 0,
      rejected: 0,
      accepted: 0,
      savedJobs: 0,
      upcomingInterviews: 0
    };

    const now = new Date();

    applications.forEach((app) => {
      const normalized = normalizeApplicationStatus(app.status);
      if (normalized && Object.prototype.hasOwnProperty.call(stats, normalized)) {
        stats[normalized] += 1;
      }

      if (app.interviewDate) {
        const interviewDate = new Date(app.interviewDate);
        if (!Number.isNaN(interviewDate.getTime()) && interviewDate >= now) {
          stats.upcomingInterviews += 1;
        }
      }
    });

    const savedJobsCount = await SavedJob.count({
      where: { userId: studentId }
    });

    stats.savedJobs = savedJobsCount;

    const recentApplications = applications.slice(0, 5).map((app) => ({
      id: app.id,
      jobTitle: app.Job ? app.Job.title : '',
      companyName: app.Job && app.Job.company ? app.Job.company.companyName : '',
      status: normalizeApplicationStatus(app.status) || 'pending',
      appliedAt: app.createdAt
    }));

    const recommendedJobsRaw = await Job.findAll({
      where: ACTIVE_STATUS_WHERE,
      include: [
        {
          model: CompanyProfile,
          as: 'company',
          attributes: ['companyName', 'location', 'logo']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 4
    });

    const recommendedJobs = recommendedJobsRaw.map((job) => ({
      id: job.id,
      title: job.title,
      companyName: job.company ? job.company.companyName : '',
      location: job.location || (Array.isArray(job.locations) && job.locations.length > 0 ? job.locations[0] : ''),
      stipend: job.stipend
    }));

    return res.status(200).json({
      success: true,
      data: {
        stats,
        recentApplications,
        recommendedJobs
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
