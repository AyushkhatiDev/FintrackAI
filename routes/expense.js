const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');
const { check } = require('express-validator');

// Validation middleware
const expenseValidation = [
  check('amount', 'Amount is required and must be a number').isNumeric(),
  check('description', 'Description is required').not().isEmpty(),
  check('category', 'Category is required').not().isEmpty(),
  check('date', 'Date must be valid').optional().isISO8601(),
];

router
  .route('/')
  .get(protect, getExpenses)
  .post(protect, expenseValidation, createExpense);

router
  .route('/:id')
  .get(protect, getExpense)
  .put(protect, expenseValidation, updateExpense)
  .delete(protect, deleteExpense);

module.exports = router;
