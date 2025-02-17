const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSpendingPatterns,
  getBudgetAnalysis,
  getSavingsOpportunities
} = require('../controllers/aiInsightController');

// Get spending patterns and insights
router.get('/spending-patterns', protect, getSpendingPatterns);

// Get budget analysis
router.get('/budget-analysis', protect, getBudgetAnalysis);

// Get savings opportunities
router.get('/savings-opportunities', protect, getSavingsOpportunities);

module.exports = router;
