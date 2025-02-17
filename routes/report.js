const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMonthlyReport,
  getAnnualReport
} = require('../controllers/reportController');

router.get('/monthly/:year/:month', protect, getMonthlyReport);
router.get('/annual/:year', protect, getAnnualReport);

module.exports = router; 