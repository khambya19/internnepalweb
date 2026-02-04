const express = require('express');
const router = express.Router();
const { submitJobReport, getMyReports, deleteMyReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const { requireCompletedProfile } = require('../middleware/requireCompletedProfile');

router.post('/job', protect, authorize('student'), requireCompletedProfile, submitJobReport);
router.get('/my-reports', protect, authorize('student'), requireCompletedProfile, getMyReports);
router.delete('/my-reports/:id', protect, authorize('student'), requireCompletedProfile, deleteMyReport);

module.exports = router;
