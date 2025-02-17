const Expense = require('../models/Expense');
const Transaction = require('../models/Transaction');
const { redisClient } = require('../config/redis');

class AnalyticsService {
  static async getFinancialHealth(userId) {
    try {
      const cacheKey = `analytics:health:${userId}`;
      const cachedHealth = await redisClient.get(cacheKey);

      if (cachedHealth) {
        return JSON.parse(cachedHealth);
      }

      // Get last 6 months data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const [expenses, income] = await Promise.all([
        Expense.find({
          user: userId,
          date: { $gte: sixMonthsAgo }
        }),
        Transaction.find({
          user: userId,
          type: 'income',
          date: { $gte: sixMonthsAgo }
        })
      ]);

      const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const monthlySavings = (totalIncome - totalExpenses) / 6;
      const savingsRate = (totalIncome > 0) ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

      const health = {
        score: this.calculateHealthScore({
          savingsRate,
          expenseToIncomeRatio: totalExpenses / totalIncome,
          monthlySavings
        }),
        metrics: {
          savingsRate: savingsRate.toFixed(2),
          monthlySavings: monthlySavings.toFixed(2),
          expenseToIncomeRatio: ((totalExpenses / totalIncome) * 100).toFixed(2),
          averageMonthlyExpense: (totalExpenses / 6).toFixed(2),
          averageMonthlyIncome: (totalIncome / 6).toFixed(2)
        },
        recommendations: []
      };

      // Generate recommendations based on metrics
      health.recommendations = this.generateHealthRecommendations(health.metrics);

      // Cache the results
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(health));

      return health;
    } catch (error) {
      console.error('Error calculating financial health:', error);
      throw error;
    }
  }

  static calculateHealthScore(metrics) {
    let score = 100;

    // Deduct points for low savings rate
    if (metrics.savingsRate < 20) score -= 20;
    if (metrics.savingsRate < 10) score -= 20;

    // Deduct points for high expense to income ratio
    if (metrics.expenseToIncomeRatio > 0.9) score -= 20;
    if (metrics.expenseToIncomeRatio > 0.8) score -= 10;

    // Deduct points for negative monthly savings
    if (metrics.monthlySavings <= 0) score -= 30;

    return Math.max(0, Math.min(100, score));
  }

  static generateHealthRecommendations(metrics) {
    const recommendations = [];

    if (metrics.savingsRate < 20) {
      recommendations.push({
        type: 'warning',
        message: 'Your savings rate is below recommended levels. Try to save at least 20% of your income.'
      });
    }

    if (metrics.expenseToIncomeRatio > 0.8) {
      recommendations.push({
        type: 'warning',
        message: 'Your expenses are high relative to your income. Look for areas to reduce spending.'
      });
    }

    if (metrics.monthlySavings <= 0) {
      recommendations.push({
        type: 'critical',
        message: 'You are not saving money monthly. Review your budget and find ways to cut expenses.'
      });
    }

    return recommendations;
  }

  static async getPredictiveAnalysis(userId) {
    try {
      const cacheKey = `analytics:predictions:${userId}`;
      const cachedPredictions = await redisClient.get(cacheKey);

      if (cachedPredictions) {
        return JSON.parse(cachedPredictions);
      }

      // Get historical data for predictions
      const expenses = await Expense.find({ user: userId })
        .sort({ date: 1 })
        .populate('category', 'name');

      const predictions = {
        nextMonth: {
          expectedExpenses: {},
          totalPredicted: 0
        },
        trends: {},
        alerts: []
      };

      // Group expenses by category
      const categoryExpenses = {};
      expenses.forEach(expense => {
        const category = expense.category.name;
        if (!categoryExpenses[category]) {
          categoryExpenses[category] = [];
        }
        categoryExpenses[category].push(expense.amount);
      });

      // Calculate predictions for each category
      Object.entries(categoryExpenses).forEach(([category, amounts]) => {
        const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
        const trend = this.calculateTrend(amounts);
        
        predictions.nextMonth.expectedExpenses[category] = average + trend;
        predictions.nextMonth.totalPredicted += average + trend;
        
        predictions.trends[category] = {
          trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
          percentage: ((trend / average) * 100).toFixed(2)
        };

        // Generate alerts for significant trends
        if (Math.abs(trend / average) > 0.1) {
          predictions.alerts.push({
            category,
            message: `${category} expenses are ${trend > 0 ? 'increasing' : 'decreasing'} significantly`
          });
        }
      });

      // Cache the predictions
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(predictions));

      return predictions;
    } catch (error) {
      console.error('Error generating predictive analysis:', error);
      throw error;
    }
  }

  static calculateTrend(amounts) {
    if (amounts.length < 2) return 0;
    
    const recentAvg = amounts.slice(-3).reduce((sum, amount) => sum + amount, 0) / 3;
    const oldAvg = amounts.slice(0, 3).reduce((sum, amount) => sum + amount, 0) / 3;
    
    return recentAvg - oldAvg;
  }
}

module.exports = AnalyticsService; 