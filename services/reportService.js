const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { redisClient } = require('../config/redis');

class ReportService {
  static async generateMonthlyReport(userId, month, year) {
    try {
      const cacheKey = `report:monthly:${userId}:${year}-${month}`;
      const cachedReport = await redisClient.get(cacheKey);

      if (cachedReport) {
        return JSON.parse(cachedReport);
      }

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Get expenses for the month
      const expenses = await Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: startDate, $lte: endDate }
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
            _id: '$category.name',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            transactions: { $push: '$$ROOT' }
          }
        }
      ]);

      // Get income for the month
      const income = await Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'income',
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

      const report = {
        period: {
          month,
          year
        },
        summary: {
          totalIncome: income[0]?.total || 0,
          totalExpenses: expenses.reduce((sum, cat) => sum + cat.total, 0),
          totalTransactions: expenses.reduce((sum, cat) => sum + cat.count, 0)
        },
        categoryBreakdown: expenses,
        savingsRate: 0
      };

      // Calculate savings rate
      if (report.summary.totalIncome > 0) {
        report.savingsRate = ((report.summary.totalIncome - report.summary.totalExpenses) / 
                            report.summary.totalIncome * 100).toFixed(2);
      }

      // Cache the report
      await redisClient.setEx(cacheKey, 86400, JSON.stringify(report)); // Cache for 24 hours

      return report;
    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw error;
    }
  }

  static async generateAnnualReport(userId, year) {
    try {
      const cacheKey = `report:annual:${userId}:${year}`;
      const cachedReport = await redisClient.get(cacheKey);

      if (cachedReport) {
        return JSON.parse(cachedReport);
      }

      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      // Get monthly breakdown
      const monthlyData = await Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { $month: '$date' },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Get category breakdown
      const categoryData = await Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: startDate, $lte: endDate }
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
            _id: '$category.name',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { total: -1 }
        }
      ]);

      const report = {
        year,
        summary: {
          totalExpenses: monthlyData.reduce((sum, month) => sum + month.total, 0),
          totalTransactions: monthlyData.reduce((sum, month) => sum + month.count, 0),
          averageMonthlyExpense: 0
        },
        monthlyBreakdown: monthlyData,
        categoryBreakdown: categoryData,
        trends: {}
      };

      // Calculate average monthly expense
      report.summary.averageMonthlyExpense = report.summary.totalExpenses / 12;

      // Calculate trends
      if (monthlyData.length > 1) {
        const monthlyTotals = monthlyData.map(m => m.total);
        report.trends.highestMonth = Math.max(...monthlyTotals);
        report.trends.lowestMonth = Math.min(...monthlyTotals);
        report.trends.monthlyVariance = this.calculateVariance(monthlyTotals);
      }

      // Cache the report
      await redisClient.setEx(cacheKey, 86400, JSON.stringify(report)); // Cache for 24 hours

      return report;
    } catch (error) {
      console.error('Error generating annual report:', error);
      throw error;
    }
  }

  static calculateVariance(numbers) {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squareDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return Math.sqrt(squareDiffs.reduce((sum, sq) => sum + sq, 0) / numbers.length);
  }
}

module.exports = ReportService; 