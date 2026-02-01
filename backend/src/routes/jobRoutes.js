const express = require('express');
const router = express.Router();
const { createJob, getJobs, getLandingStats, getJob, getMyJobs, updateJob, deleteJob, toggleHiringPause } = require('../controllers/jobController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const { requireCompletedProfile } = require('../middleware/requireCompletedProfile');

router.post('/', protect, authorize('company'), requireCompletedProfile, createJob);
router.get('/', getJobs);
router.get('/landing-stats', getLandingStats);
router.get('/my-jobs', protect, authorize('company'), requireCompletedProfile, getMyJobs);
router.get('/:id', getJob);
router.put('/:id', protect, authorize('company'), requireCompletedProfile, updateJob);
router.patch('/:id/pause', protect, authorize('company'), requireCompletedProfile, toggleHiringPause);
router.delete('/:id', protect, authorize('company'), requireCompletedProfile, deleteJob);

module.exports = router;
