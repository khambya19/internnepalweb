const { getProfileCompletionForUser } = require('../utils/profileCompletion');

const PROFILE_ROUTE_BY_ROLE = {
  student: '/student/profile',
  company: '/company/dashboard/profile'
};

const requireCompletedProfile = async (req, res, next) => {
  try {
    const role = String(req.user?.role || '').toLowerCase();

    if (role !== 'student' && role !== 'company') {
      return next();
    }

    const profileCompletion = await getProfileCompletionForUser(req.user);
    req.profileCompletion = profileCompletion;

    // Both students and companies must complete their profiles before using protected features
    if (profileCompletion.completed) {
      return next();
    }

    return res.status(403).json({
      success: false,
      code: 'PROFILE_INCOMPLETE',
      message: 'Complete your profile before using this feature.',
      data: {
        profileCompletion,
        redirectTo: PROFILE_ROUTE_BY_ROLE[role]
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to validate profile completion',
      error: error.message
    });
  }
};

module.exports = { requireCompletedProfile };
