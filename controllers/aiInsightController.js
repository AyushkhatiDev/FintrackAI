const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { redisClient } = require('../config/redis');

// @desc    Get spending patterns and insights
// @route   GET /api/insights/spending-patterns
// @access  Private
exports.getSpendingPatterns = async (req, res) => {
  try {
    const cacheKey = `insights:spending:${req.user._id}`;
    const cachedInsights = await redisClient.get(cacheKey);

    if (cachedInsights) {
      return res.json({
        success: true,
        data: JSON.parse(cachedInsights)
      });
    }

    // Get last 6 months of expenses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const expenses = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            year: { $year: '$date' },
            category: '$category.name'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': -1,
          '_id.month': -1
        }
      }
    ]);

    // Process data for insights
    const insights = {
      monthlyTrends: {},
      topCategories: [],
      unusualSpending: [],
      recommendations: []
    };

    // Calculate monthly trends
    expenses.forEach(expense => {
      const monthYear = `${expense._id.year}-${expense._id.month}`;
      if (!insights.monthlyTrends[monthYear]) {
        insights.monthlyTrends[monthYear] = {
          total: 0,
          categories: {}
        };
      }
      insights.monthlyTrends[monthYear].total += expense.totalAmount;
      insights.monthlyTrends[monthYear].categories[expense._id.category] = expense.totalAmount;
    });

    // Calculate top spending categories
    const categoryTotals = {};
    expenses.forEach(expense => {
      if (!categoryTotals[expense._id.category]) {
        categoryTotals[expense._id.category] = 0;
      }
      categoryTotals[expense._id.category] += expense.totalAmount;
    });

    insights.topCategories = Object.entries(categoryTotals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Generate recommendations based on spending patterns
    insights.recommendations = generateRecommendations(insights);

    // Cache the insights
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(insights));

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating insights',
      error: error.message
    });
  }
};

// @desc    Get budget analysis
// @route   GET /api/insights/budget-analysis
// @access  Private
exports.getBudgetAnalysis = async (req, res) => {
  try {
    const cacheKey = `insights:budget:${req.user._id}`;
    const cachedAnalysis = await redisClient.get(cacheKey);

    if (cachedAnalysis) {
      return res.json({
        success: true,
        data: JSON.parse(cachedAnalysis)
      });
    }

    const budgets = await Budget.find({ user: req.user._id })
      .populate('category', 'name');

    const analysis = {
      overallStatus: 'good',
      budgetStatuses: [],
      recommendations: []
    };

    for (const budget of budgets) {
      const expenses = await Expense.find({
        user: req.user._id,
        category: budget.category._id,
        date: { $gte: budget.startDate, $lte: budget.endDate || new Date() }
      });

      const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const percentageUsed = (totalSpent / budget.amount) * 100;

      const status = {
        budgetId: budget._id,
        category: budget.category.name,
        allocated: budget.amount,
        spent: totalSpent,
        remaining: budget.amount - totalSpent,
        percentageUsed,
        status: percentageUsed > 90 ? 'critical' : percentageUsed > 75 ? 'warning' : 'good'
      };

      analysis.budgetStatuses.push(status);

      if (status.status === 'critical') {
        analysis.overallStatus = 'critical';
      } else if (status.status === 'warning' && analysis.overallStatus === 'good') {
        analysis.overallStatus = 'warning';
      }
    }

    // Generate budget-specific recommendations
    analysis.recommendations = generateBudgetRecommendations(analysis.budgetStatuses);

    // Cache the analysis
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(analysis));

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error analyzing budget',
      error: error.message
    });
  }
};

// @desc    Get savings opportunities
// @route   GET /api/insights/savings-opportunities
// @access  Private
exports.getSavingsOpportunities = async (req, res) => {
  try {
    const cacheKey = `insights:savings:${req.user._id}`;
    const cachedOpportunities = await redisClient.get(cacheKey);

    if (cachedOpportunities) {
      return res.json({
        success: true,
        data: JSON.parse(cachedOpportunities)
      });
    }

    // Analyze recurring expenses
    const recurringTransactions = await Transaction.find({
      user: req.user._id,
      isRecurring: true,
      type: 'expense'
    }).populate('category', 'name');

    const opportunities = {
      recurringExpenses: recurringTransactions.map(transaction => ({
        id: transaction._id,
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category.name,
        frequency: transaction.recurringFrequency
      })),
      potentialSavings: [],
      recommendations: []
    };

    // Generate savings recommendations
    opportunities.recommendations = generateSavingsRecommendations(opportunities.recurringExpenses);

    // Cache the opportunities
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(opportunities));

    res.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error finding savings opportunities',
      error: error.message
    });
  }
};

// Helper functions
function generateRecommendations(insights) {
  const recommendations = [];
  
  // Analyze monthly trends
  const months = Object.keys(insights.monthlyTrends);
  if (months.length >= 2) {
    const currentMonth = insights.monthlyTrends[months[0]];
    const previousMonth = insights.monthlyTrends[months[1]];
    
    if (currentMonth.total > previousMonth.total * 1.2) {
      recommendations.push({
        type: 'warning',
        message: 'Your spending has increased by more than 20% compared to last month'
      });
    }
  }

  // Analyze top categories
  if (insights.topCategories.length > 0) {
    const topCategory = insights.topCategories[0];
    recommendations.push({
      type: 'info',
      message: `Your highest spending category is ${topCategory.category}`
    });
  }

  return recommendations;
}

function generateBudgetRecommendations(budgetStatuses) {
  const recommendations = [];

  budgetStatuses.forEach(status => {
    if (status.percentageUsed > 90) {
      recommendations.push({
        type: 'critical',
        category: status.category,
        message: `You've used ${status.percentageUsed.toFixed(1)}% of your ${status.category} budget`
      });
    } else if (status.percentageUsed < 20) {
      recommendations.push({
        type: 'success',
        category: status.category,
        message: `Great job keeping ${status.category} expenses low!`
      });
    }
  });

  return recommendations;
}

function generateSavingsRecommendations(recurringExpenses) {
  const recommendations = [];

  // Analyze recurring expenses
  if (recurringExpenses.length > 0) {
    const totalRecurring = recurringExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    recommendations.push({
      type: 'info',
      message: `You have ${recurringExpenses.length} recurring expenses totaling ${totalRecurring}`
    });

    // Find potential duplicate subscriptions
    const subscriptionCategories = {};
    recurringExpenses.forEach(expense => {
      if (!subscriptionCategories[expense.category]) {
        subscriptionCategories[expense.category] = [];
      }
      subscriptionCategories[expense.category].push(expense);
    });

    Object.entries(subscriptionCategories).forEach(([category, expenses]) => {
      if (expenses.length > 1) {
        recommendations.push({
          type: 'warning',
          message: `You have multiple subscriptions in ${category}. Consider consolidating them.`
        });
      }
    });
  }

  return recommendations;
}

// Export all functions
module.exports = {
  getSpendingPatterns: exports.getSpendingPatterns,
  getBudgetAnalysis: exports.getBudgetAnalysis,
  getSavingsOpportunities: exports.getSavingsOpportunities
};
