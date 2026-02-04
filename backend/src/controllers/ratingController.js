const { InternRating, Application, Job, CompanyProfile } = require('../models');

const normalizeSkills = (skills) => {
  if (!Array.isArray(skills)) return [];
  return skills
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 20);
};

exports.createRating = async (req, res) => {
  try {
    const { applicationId, rating, review, skills } = req.body || {};

    if (!applicationId) {
      return res.status(400).json({ success: false, message: 'applicationId is required' });
    }

    const ratingValue = Number(rating);
    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ success: false, message: 'rating must be an integer between 1 and 5' });
    }

    const companyProfile = await CompanyProfile.findOne({ where: { userId: req.user.id } });
    if (!companyProfile) {
      return res.status(403).json({ success: false, message: 'Company profile not found' });
    }

    const application = await Application.findByPk(applicationId, {
      include: [{ model: Job, attributes: ['id', 'companyId', 'title'] }]
    });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (!application.Job || application.Job.companyId !== companyProfile.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to rate this intern' });
    }

    const normalizedStatus = String(application.status || '').trim().toLowerCase();
    if (!['hired', 'offered'].includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Rating is only allowed when application status is Hired or Offered'
      });
    }

    const payload = {
      applicationId: application.id,
      companyId: companyProfile.id,
      studentId: application.studentId,
      rating: ratingValue,
      review: typeof review === 'string' && review.trim() ? review.trim() : null,
      skills: normalizeSkills(skills)
    };

    const existing = await InternRating.findOne({ where: { applicationId: application.id } });
    let saved;
    if (existing) {
      await existing.update(payload);
      saved = existing;
    } else {
      saved = await InternRating.create(payload);
    }

    const response = await InternRating.findByPk(saved.id, {
      include: [{ model: CompanyProfile, attributes: ['id', 'companyName', 'logo'] }]
    });

    return res.status(existing ? 200 : 201).json({ success: true, data: response });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getStudentRatings = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'studentId is required' });
    }

    const ratings = await InternRating.findAll({
      where: { studentId },
      include: [
        { model: CompanyProfile, attributes: ['id', 'companyName', 'logo', 'location'] },
        {
          model: Application,
          attributes: ['id', 'status'],
          include: [{ model: Job, attributes: ['id', 'title'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const avg =
      ratings.length > 0
        ? Number((ratings.reduce((sum, item) => sum + Number(item.rating || 0), 0) / ratings.length).toFixed(1))
        : 0;

    return res.status(200).json({
      success: true,
      count: ratings.length,
      averageRating: avg,
      data: ratings
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
