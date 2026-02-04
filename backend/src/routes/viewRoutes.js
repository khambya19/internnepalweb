const express = require('express');
const { protect } = require('../middleware/auth');
const { recordView } = require('../controllers/viewController');

const router = express.Router();

router.post('/record', protect, recordView);

module.exports = router;
