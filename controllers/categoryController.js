const Category = require('../models/Category');
const { redisClient } = require('../config/redis');

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
exports.createCategory = async (req, res) => {
  try {
    // Check if category already exists for user
    const existingCategory = await Category.findOne({
      name: req.body.name,
      $or: [
        { user: req.user._id },
        { isDefault: true }
      ]
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    const category = await Category.create({
      ...req.body,
      user: req.user._id
    });

    // Invalidate cache
    await redisClient.del(`categories:${req.user._id}`);

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

// @desc    Get all categories (including default and user-created)
// @route   GET /api/categories
// @access  Private
exports.getCategories = async (req, res) => {
  try {
    // Check cache
    const cachedCategories = await redisClient.get(`categories:${req.user._id}`);
    if (cachedCategories) {
      return res.json({
        success: true,
        data: JSON.parse(cachedCategories)
      });
    }

    const categories = await Category.find({
      $or: [
        { user: req.user._id },
        { isDefault: true }
      ]
    }).sort({ name: 1 });

    // Set cache
    await redisClient.setEx(
      `categories:${req.user._id}`,
      3600, // 1 hour
      JSON.stringify(categories)
    );

    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user._id },
        { isDefault: true }
      ]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
exports.updateCategory = async (req, res) => {
  try {
    let category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or cannot be modified'
      });
    }

    // Prevent updating default categories
    if (category.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Default categories cannot be modified'
      });
    }

    category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    // Invalidate cache
    await redisClient.del(`categories:${req.user._id}`);

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Prevent deleting default categories
    if (category.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Default categories cannot be deleted'
      });
    }

    await category.remove();

    // Invalidate cache
    await redisClient.del(`categories:${req.user._id}`);

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
}; 