const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getRecurringTransactions
} = require('../controllers/transactionController');
const { check } = require('express-validator');

// Validation middleware
const transactionValidation = [
  check('amount', 'Amount is required and must be a number').isNumeric(),
  check('type', 'Type must be either income or expense').isIn(['income', 'expense']),
  check('category', 'Category is required').not().isEmpty(),
  check('date', 'Date must be valid').isISO8601(),
  check('description', 'Description is required').not().isEmpty(),
  check('isRecurring', 'isRecurring must be a boolean').optional().isBoolean(),
  check('recurringFrequency', 'Invalid recurring frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly']),
];

router
  .route('/')
  .get(protect, getTransactions)
  .post(protect, transactionValidation, createTransaction);

router.get('/recurring', protect, getRecurringTransactions);

router
  .route('/:id')
  .get(protect, getTransaction)
  .put(protect, transactionValidation, updateTransaction)
  .delete(protect, deleteTransaction);

module.exports = router;
