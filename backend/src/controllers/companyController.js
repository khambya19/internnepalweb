const { CompanyProfile, User, Job, Application, StudentProfile, SavedCandidate, CompanyReview } = require('../models');
const { Op } = require('sequelize');

const normalizeApplicationStatus = (status) => String(status || '').trim().toLowerCase();

const calculateCompanyResponseRate = async (companyId) => {
  const jobs = await Job.findAll({
    where: { companyId },
    attributes: ['id'],
    raw: true
  });

  const jobIds = jobs.map((job) => job.id);
  if (jobIds.length === 0) {
    return { responseRate: null, avgResponseDays: null, totalApplications: 0, respondedCount: 0 };
  }

  const applications = await Application.findAll({
    where: { jobId: { [Op.in]: jobIds } },
    attributes: ['id', 'status', 'createdAt', 'updatedAt'],
    raw: true
  });

  const totalApplications = applications.length;
  if (totalApplications === 0) {
    return { responseRate: null, avgResponseDays: null, totalApplications: 0, respondedCount: 0 };
  }

  // "Responded" means company moved application out of pending/applied in <= 7 days.
  const responded = applications.filter((application) => {
    const status = normalizeApplicationStatus(application.status);
    if (status === 'pending' || status === 'applied') return false;

    const createdAt = new Date(application.createdAt);
    const updatedAt = new Date(application.updatedAt);
    if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) return false;

    const diffDays = (updatedAt - createdAt) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  });

  const respondedCount = responded.length;
  const responseRate = Math.round((respondedCount / totalApplications) * 100);
  const avgResponseDays = respondedCount
    ? Math.max(
        1,
        Math.round(
          responded.reduce((sum, item) => {
            const createdAt = new Date(item.createdAt);
            const updatedAt = new Date(item.updatedAt);
            return sum + (updatedAt - createdAt) / (1000 * 60 * 60 * 24);
          }, 0) / respondedCount
        )
      )
    : null;

  return { responseRate, avgResponseDays, totalApplications, respondedCount };
};

const summarizeCompanyReviews = (reviews = []) => {
  const normalized = reviews.map((review) => {
    const plain = typeof review.toJSON === 'function' ? review.toJSON() : review;
    return {
      id: plain.id,
      companyId: plain.companyId,
      studentId: plain.studentId,
      rating: Number(plain.rating || 0),
      review: plain.review || '',
      createdAt: plain.createdAt,
      student: plain.User
        ? {
            id: plain.User.id,
            name: plain.User.name,
            avatar: plain.User.StudentProfile?.avatar || null
          }
        : null
    };
  });

  const totalReviews = normalized.length;
  const averageRating = totalReviews
    ? Number(
        (
          normalized.reduce((sum, item) => sum + Number(item.rating || 0), 0) / totalReviews
        ).toFixed(1)
      )
    : null;

  return {
    totalReviews,
    averageRating,
    reviews: normalized
  };
};

// @desc    Update company profile
// @route   PUT /api/company/profile
// @access  Private (Company)
exports.updateProfile = async (req, res) => {
  try {
    const { 
        companyName, description, website, location, industry, logo,
        tagline, about, companySize, foundedYear, phone, 
        linkedin, twitter, facebook, instagram, github, banner
    } = req.body;
    let profile = await CompanyProfile.findOne({ where: { userId: req.user.id } });

    if (!profile) {
      profile = await CompanyProfile.create({
        userId: req.user.id,
        companyName,
        description,
        website,
        location,
        industry,
        logo,
        tagline, 
        about, 
        companySize, 
        foundedYear, 
        phone, 
        linkedin, 
        twitter, 
        facebook, 
        instagram, 
        github, 
        banner
      });
    } else {
      profile = await profile.update({
        companyName,
        description,
        website,
        location,
        industry,
        logo,
        tagline, 
        about, 
        companySize, 
        foundedYear, 
        phone, 
        linkedin, 
        twitter, 
        facebook, 
        instagram, 
        github, 
        banner
      });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get company profile
// @route   GET /api/company/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    let profile = await CompanyProfile.findOne({ 
      where: { userId: req.user.id },
      include: [
        { model: User, attributes: ['name', 'email', 'phone'] },
        {
          model: CompanyReview,
          attributes: ['id', 'companyId', 'studentId', 'rating', 'review', 'createdAt'],
          include: [
            {
              model: User,
              attributes: ['id', 'name'],
              include: [{ model: StudentProfile, attributes: ['avatar'] }]
            }
          ],
          separate: true,
          order: [['createdAt', 'DESC']],
          limit: 20
        }
      ]
    });

    if (!profile) {
      // Create empty profile if it doesn't exist
      profile = await CompanyProfile.create({ userId: req.user.id });
      // Fetch again with full associations
      profile = await CompanyProfile.findOne({ 
        where: { userId: req.user.id },
        include: [
          { model: User, attributes: ['name', 'email', 'phone'] },
          {
            model: CompanyReview,
            attributes: ['id', 'companyId', 'studentId', 'rating', 'review', 'createdAt'],
            include: [
              {
                model: User,
                attributes: ['id', 'name'],
                include: [{ model: StudentProfile, attributes: ['avatar'] }]
              }
            ],
            separate: true,
            order: [['createdAt', 'DESC']],
            limit: 20
          }
        ]
      });
    }

    const responseRate = await calculateCompanyResponseRate(profile.id);
    const reviewsSummary = summarizeCompanyReviews(profile.CompanyReviews || []);

    res.status(200).json({
      success: true,
      data: {
        ...profile.toJSON(),
        responseRate,
        reviewsSummary
      }
    });
  } catch (error) {
    console.error('Error in getProfile for company:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get public company profile
// @route   GET /api/company/public/:id
// @access  Public
exports.getPublicProfile = async (req, res) => {
  try {
    const profile = await CompanyProfile.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['name', 'email', 'phone'] },
        {
          model: CompanyReview,
          attributes: ['id', 'companyId', 'studentId', 'rating', 'review', 'createdAt'],
          include: [
            {
              model: User,
              attributes: ['id', 'name'],
              include: [{ model: StudentProfile, attributes: ['avatar'] }]
            }
          ],
          separate: true,
          order: [['createdAt', 'DESC']],
          limit: 20
        }
      ]
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const responseRate = await calculateCompanyResponseRate(profile.id);
    const reviewsSummary = summarizeCompanyReviews(profile.CompanyReviews || []);
    return res.status(200).json({
      success: true,
      data: {
        ...profile.toJSON(),
        responseRate,
        reviewsSummary
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Create or update company review by student
// @route   POST /api/company/:id/reviews
// @access  Private (Student)
exports.createCompanyReview = async (req, res) => {
  try {
    const companyId = req.params.id;
    const ratingValue = Number(req.body?.rating);
    const reviewText = typeof req.body?.review === 'string' ? req.body.review.trim() : '';

    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5.' });
    }

    const company = await CompanyProfile.findByPk(companyId, { attributes: ['id'] });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const [saved, created] = await CompanyReview.findOrCreate({
      where: {
        companyId,
        studentId: req.user.id
      },
      defaults: {
        companyId,
        studentId: req.user.id,
        rating: ratingValue,
        review: reviewText || null
      }
    });

    if (!created) {
      saved.rating = ratingValue;
      saved.review = reviewText || null;
      await saved.save();
    }

    const review = await CompanyReview.findByPk(saved.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name'],
          include: [{ model: StudentProfile, attributes: ['avatar'] }]
        }
      ]
    });

    return res.status(created ? 201 : 200).json({ success: true, data: review });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get public company reviews
// @route   GET /api/company/:id/reviews
// @access  Public
exports.getCompanyReviews = async (req, res) => {
  try {
    const companyId = req.params.id;
    const company = await CompanyProfile.findByPk(companyId, { attributes: ['id'] });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const reviews = await CompanyReview.findAll({
      where: { companyId },
      attributes: ['id', 'companyId', 'studentId', 'rating', 'review', 'createdAt'],
      include: [
        {
          model: User,
          attributes: ['id', 'name'],
          include: [{ model: StudentProfile, attributes: ['avatar'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    const summary = summarizeCompanyReviews(reviews);
    return res.status(200).json({
      success: true,
      ...summary
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get dashboard statistics for company
// @route   GET /api/company/dashboard-stats
// @access  Private (Company)
exports.getDashboardStats = async (req, res) => {
  try {
    const profile = await CompanyProfile.findOne({
      where: { userId: req.user.id },
      attributes: ['id', 'companyName']
    });
    if (!profile) {
      return res.status(200).json({
        success: true,
        data: {
          stats: {
            activePostings: 0,
            totalApplications: 0,
            newApplicationsToday: 0,
            avgApplicationsPerPosting: 0,
            totalViews: 0,
            conversionRate: 0
          },
          statusBreakdown: [],
          recentApplications: [],
          applicationsData: [],
          companyName: req.user?.name || 'Company'
        }
      });
    }

    const companyId = profile.id;

    // Get jobs belonging to company
    const jobs = await Job.findAll({ where: { companyId } });
    const jobIds = jobs.map(job => job.id);

    const activePostings = jobs.filter((job) => {
      const status = (job.status || '').toString().toLowerCase();
      return status === 'active' || status === 'live';
    }).length;
    
    // Get applications
    const applications = await Application.findAll({
      where: { jobId: { [Op.in]: jobIds } },
      include: [
        { model: Job, attributes: ['title'] },
        {
          model: User,
          as: 'student',
          attributes: ['name', 'email', 'phone'],
          include: [{ model: StudentProfile }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const totalApplications = applications.length;
    
    // Calculate new today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newApplicationsToday = applications.filter(app => new Date(app.createdAt) >= today).length;

    const avgApplicationsPerPosting = jobs.length > 0 ? (totalApplications / jobs.length) : 0;
    const totalViews = jobs.reduce((sum, job) => sum + Number(job.viewCount || job.views || 0), 0);

    // Filter statuses
    const statusCounts = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    const statusBreakdown = [
      { name: 'Applied', value: statusCounts['Applied'] || 0, color: '#3b82f6' },
      { name: 'Under Review', value: statusCounts['Under Review'] || 0, color: '#eab308' },
      { name: 'Shortlisted', value: statusCounts['Shortlisted'] || 0, color: '#22c55e' },
      { name: 'Rejected', value: statusCounts['Rejected'] || 0, color: '#ef4444' },
      { name: 'Interview Scheduled', value: statusCounts['Interview Scheduled'] || 0, color: '#a855f7' },
      { name: 'Hired', value: statusCounts['Hired'] || 0, color: '#14b8a6' },
    ].filter(s => s.value > 0);

    const recentApplications = applications.slice(0, 5).map(app => ({
      id: app.id,
      studentName: app.student?.name || 'Unknown',
      avatar: (app.student?.name || 'U').charAt(0).toUpperCase(),
      postingTitle: app.Job?.title || 'Unknown Role',
      appliedDate: app.createdAt,
      status: app.status
    }));

    const hiredCount = applications.filter(app => app.status === 'Hired').length;
    const conversionRate = totalApplications > 0 ? parseFloat(((hiredCount / totalApplications) * 100).toFixed(1)) : 0;

    const stats = {
      activePostings,
      totalApplications,
      newApplicationsToday,
      avgApplicationsPerPosting,
      totalViews,
      conversionRate
    };

    // Calculate dates for last 14 days
    const applicationsData = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = applications.filter(app => new Date(app.createdAt).toISOString().split('T')[0] === dateStr).length;
      applicationsData.push({ date: dateStr, count });
    }

    res.status(200).json({ 
      success: true, 
      data: {
        stats,
        statusBreakdown,
        recentApplications,
        applicationsData,
        companyName: profile.companyName
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Toggle save candidate
// @route   POST /api/company/saved-candidates/:studentId
// @access  Private (Company)
exports.toggleSavedCandidate = async (req, res) => {
  try {
    const { studentId } = req.params;
    const profile = await CompanyProfile.findOne({ where: { userId: req.user.id } });
    
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Company profile not found' });
    }

    const saved = await SavedCandidate.findOne({
      where: { companyId: profile.id, studentId }
    });

    if (saved) {
      await saved.destroy();
      return res.status(200).json({ success: true, message: 'Candidate removed from shortlist', saved: false });
    } else {
      await SavedCandidate.create({
        companyId: profile.id,
        studentId
      });
      return res.status(200).json({ success: true, message: 'Candidate added to shortlist', saved: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get saved candidates
// @route   GET /api/company/saved-candidates
// @access  Private (Company)
exports.getSavedCandidates = async (req, res) => {
  try {
    const profile = await CompanyProfile.findOne({ where: { userId: req.user.id } });
    
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Company profile not found' });
    }

    const saved = await SavedCandidate.findAll({
      where: { companyId: profile.id },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email'],
        include: [{ model: StudentProfile }]
      }]
    });

    res.status(200).json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
