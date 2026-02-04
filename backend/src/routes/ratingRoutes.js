const express = require('express');
const router = express.Router();
const { createRating, getStudentRatings } = require('../controllers/ratingController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const { requireCompletedProfile } = require('../middleware/requireCompletedProfile');

router.post('/', protect, authorize('company'), requireCompletedProfile, createRating);
router.get('/student/:studentId', getStudentRatings);

module.exports = router;
