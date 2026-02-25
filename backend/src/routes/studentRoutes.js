const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getAllStudents, getDashboardStats } = require('../controllers/studentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const { requireCompletedProfile } = require('../middleware/requireCompletedProfile');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, authorize('student'), updateProfile);
router.get('/all', protect, authorize('company'), requireCompletedProfile, getAllStudents);
router.get('/dashboard', protect, authorize('student'), requireCompletedProfile, getDashboardStats);

module.exports = router;
