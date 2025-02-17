const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a budget name'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add a budget amount'],
    min: [0, 'Budget amount cannot be negative']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  currency: {
    type: String,
    default: 'USD'
  },
  alerts: {
    enabled: {
      type: Boolean,
      default: true
    },
    thresholds: [{
      percentage: {
        type: Number,
        min: 0,
        max: 100
      },
      notified: {
        type: Boolean,
        default: false
      }
    }]
  },
  shared: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for current spending
budgetSchema.virtual('currentSpending', {
  ref: 'Expense',
  localField: '_id',
  foreignField: 'budget',
  sum: 'amount'
});

module.exports = mongoose.model('Budget', budgetSchema);