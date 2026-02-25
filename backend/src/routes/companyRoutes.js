const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getDashboardStats,
  getPublicProfile,
  createCompanyReview,
  getCompanyReviews
} = require('../controllers/companyController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const { requireCompletedProfile } = require('../middleware/requireCompletedProfile');

router.get('/profile', protect, getProfile);
router.get('/public/:id', getPublicProfile);
router.get('/:id/reviews', getCompanyReviews);
router.post('/:id/reviews', protect, authorize('student'), requireCompletedProfile, createCompanyReview);
router.put('/profile', protect, authorize('company'), updateProfile);
router.get('/dashboard-stats', protect, authorize('company'), requireCompletedProfile, getDashboardStats);

const { toggleSavedCandidate, getSavedCandidates } = require('../controllers/companyController');
router.post('/saved-candidates/:studentId', protect, authorize('company'), requireCompletedProfile, toggleSavedCandidate);
router.get('/saved-candidates', protect, authorize('company'), requireCompletedProfile, getSavedCandidates);

const { getCompanyReports } = require('../controllers/reportController');
router.get('/reports', protect, authorize('company'), requireCompletedProfile, getCompanyReports);

module.exports = router;
