const express = require('express');
const router = express.Router();
const { saveJob, unsaveJob, getSavedJobs } = require('../controllers/savedJobController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const { requireCompletedProfile } = require('../middleware/requireCompletedProfile');

router.get('/', protect, authorize('student'), requireCompletedProfile, getSavedJobs);
router.post('/:jobId', protect, authorize('student'), requireCompletedProfile, saveJob);
router.delete('/:jobId', protect, authorize('student'), requireCompletedProfile, unsaveJob);

module.exports = router;
