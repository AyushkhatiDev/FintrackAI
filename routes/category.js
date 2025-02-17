const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { check } = require('express-validator');

// Validation middleware
const categoryValidation = [
  check('name', 'Name is required').not().isEmpty(),
  check('type', 'Type must be either expense or income').isIn(['expense', 'income']),
  check('icon', 'Icon is required').not().isEmpty(),
  check('color', 'Color must be a valid hex color').matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
];

router
  .route('/')
  .get(protect, getCategories)
  .post(protect, categoryValidation, createCategory);

router
  .route('/:id')
  .get(protect, getCategory)
  .put(protect, categoryValidation, updateCategory)
  .delete(protect, deleteCategory);

module.exports = router; 