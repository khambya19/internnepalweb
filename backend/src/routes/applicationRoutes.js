const express = require('express');
const router = express.Router();
const {
  applyForJob,
  getJobApplications,
  updateApplicationStatus,
  getMyApplications,
  getAllCompanyApplications,
  updateApplicationNotes,
  withdrawApplication,
  bulkReject,
  toggleStar
} = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const { requireCompletedProfile } = require('../middleware/requireCompletedProfile');

router.post('/:jobId', protect, authorize('student'), requireCompletedProfile, applyForJob);
router.get('/company/all', protect, authorize('company'), requireCompletedProfile, getAllCompanyApplications);
router.get('/job/:jobId', protect, authorize('company'), requireCompletedProfile, getJobApplications);
router.put('/:id', protect, authorize('company'), requireCompletedProfile, updateApplicationStatus);
router.patch('/:id/notes', protect, authorize('company'), requireCompletedProfile, updateApplicationNotes);
router.patch('/:id/star', protect, authorize('company'), requireCompletedProfile, toggleStar);
router.post('/bulk-reject', protect, authorize('company'), requireCompletedProfile, bulkReject);
router.get('/my-applications', protect, authorize('student'), requireCompletedProfile, getMyApplications);
router.delete('/:id', protect, authorize('student'), requireCompletedProfile, withdrawApplication);

module.exports = router;
