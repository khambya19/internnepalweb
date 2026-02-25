const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const { getViewStats } = require('../controllers/superAdminController');
const { getAllReports, updateReportStatus, deleteReportedJob, restoreReportedJob } = require('../controllers/reportController');

const router = express.Router();

router.get('/views/stats', protect, authorize('superadmin'), getViewStats);

router.get('/reports', protect, authorize('superadmin'), getAllReports);
router.put('/reports/:id/status', protect, authorize('superadmin'), updateReportStatus);
router.delete('/reports/:id/job', protect, authorize('superadmin'), deleteReportedJob);
router.post('/reports/:id/job/restore', protect, authorize('superadmin'), restoreReportedJob);

module.exports = router;
