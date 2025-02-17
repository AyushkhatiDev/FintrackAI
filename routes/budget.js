const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget
} = require('../controllers/budgetController');
const { check } = require('express-validator');

// Validation middleware
const budgetValidation = [
  check('name', 'Name is required').not().isEmpty(),
  check('amount', 'Amount is required and must be a number').isNumeric(),
  check('category', 'Category is required').not().isEmpty(),
  check('period', 'Period must be valid').isIn(['daily', 'weekly', 'monthly', 'yearly']),
  check('startDate', 'Start date must be valid').isISO8601(),
  check('endDate', 'End date must be valid').optional().isISO8601(),
];

router
  .route('/')
  .get(protect, getBudgets)
  .post(protect, budgetValidation, createBudget);

router
  .route('/:id')
  .get(protect, getBudget)
  .put(protect, budgetValidation, updateBudget)
  .delete(protect, deleteBudget);

module.exports = router;
