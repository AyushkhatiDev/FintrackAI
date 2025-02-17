const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { redisClient } = require('../config/redis');

// @desc    Create new budget
// @route   POST /api/budgets
// @access  Private
exports.createBudget = async (req, res) => {
  try {
    const budget = await Budget.create({
      ...req.body,
      user: req.user._id
    });

    // Invalidate cache
    await redisClient.del(`budgets:${req.user._id}`);

    res.status(201).json({
      success: true,
      data: budget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating budget',
      error: error.message
    });
  }
};

// @desc    Get all budgets for logged in user
// @route   GET /api/budgets
// @access  Private
exports.getBudgets = async (req, res) => {
  try {
    // Check cache
    const cachedBudgets = await redisClient.get(`budgets:${req.user._id}`);
    if (cachedBudgets) {
      return res.json({
        success: true,
        data: JSON.parse(cachedBudgets)
      });
    }

    const budgets = await Budget.find({ user: req.user._id })
      .populate('category', 'name icon')
      .populate('shared.user', 'name email');

    // Calculate current spending for each budget
    for (let budget of budgets) {
      const startDate = budget.startDate;
      const endDate = budget.endDate || new Date();
      
      const totalSpent = await Expense.aggregate([
        {
          $match: {
            user: req.user._id,
            category: budget.category._id,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      budget = budget.toObject();
      budget.currentSpending = totalSpent[0]?.total || 0;
      budget.remainingAmount = budget.amount - budget.currentSpending;
      budget.percentageUsed = (budget.currentSpending / budget.amount) * 100;
    }

    // Set cache
    await redisClient.setEx(
      `budgets:${req.user._id}`,
      3600, // 1 hour
      JSON.stringify(budgets)
    );

    res.json({
      success: true,
      count: budgets.length,
      data: budgets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching budgets',
      error: error.message
    });
  }
};

// @desc    Get single budget
// @route   GET /api/budgets/:id
// @access  Private
exports.getBudget = async (req, res) => {
  try {
    let budget = await Budget.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user._id },
        { 'shared.user': req.user._id }
      ]
    })
    .populate('category', 'name icon')
    .populate('shared.user', 'name email');

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Calculate current spending
    const startDate = budget.startDate;
    const endDate = budget.endDate || new Date();
    
    const totalSpent = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          category: budget.category._id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    budget = budget.toObject();
    budget.currentSpending = totalSpent[0]?.total || 0;
    budget.remainingAmount = budget.amount - budget.currentSpending;
    budget.percentageUsed = (budget.currentSpending / budget.amount) * 100;

    res.json({
      success: true,
      data: budget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching budget',
      error: error.message
    });
  }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
exports.updateBudget = async (req, res) => {
  try {
    let budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    budget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
    .populate('category', 'name icon')
    .populate('shared.user', 'name email');

    // Invalidate cache
    await redisClient.del(`budgets:${req.user._id}`);

    res.json({
      success: true,
      data: budget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating budget',
      error: error.message
    });
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    await budget.remove();

    // Invalidate cache
    await redisClient.del(`budgets:${req.user._id}`);

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting budget',
      error: error.message
    });
  }
};
