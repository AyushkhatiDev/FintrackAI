module.exports = {
  // Authentication
  JWT_EXPIRE: '30d',
  COOKIE_EXPIRE: 30,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // Cache durations (in seconds)
  CACHE_DURATION: {
    SHORT: 300,    // 5 minutes
    MEDIUM: 3600,  // 1 hour
    LONG: 86400,   // 24 hours
  },

  // Transaction types
  TRANSACTION_TYPES: {
    EXPENSE: 'expense',
    INCOME: 'income',
    TRANSFER: 'transfer'
  },

  // Payment methods
  PAYMENT_METHODS: {
    CASH: 'cash',
    CREDIT_CARD: 'credit_card',
    DEBIT_CARD: 'debit_card',
    BANK_TRANSFER: 'bank_transfer',
    DIGITAL_WALLET: 'digital_wallet',
    CRYPTOCURRENCY: 'cryptocurrency'
  },

  // Recurring frequencies
  RECURRING_FREQUENCIES: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    YEARLY: 'yearly'
  },

  // Budget periods
  BUDGET_PERIODS: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly'
  },

  // Notification types
  NOTIFICATION_TYPES: {
    BUDGET_ALERT: 'budget_alert',
    PAYMENT_REMINDER: 'payment_reminder',
    SAVINGS_GOAL: 'savings_goal',
    UNUSUAL_ACTIVITY: 'unusual_activity',
    SYSTEM: 'system'
  },

  // Notification severity levels
  SEVERITY_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
    INFO: 'info'
  },

  // Financial health thresholds
  FINANCIAL_HEALTH: {
    SAVINGS_RATE: {
      EXCELLENT: 30,
      GOOD: 20,
      FAIR: 10,
      POOR: 5
    },
    EXPENSE_RATIO: {
      EXCELLENT: 0.5,
      GOOD: 0.7,
      FAIR: 0.8,
      POOR: 0.9
    }
  },

  // API Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },

  // Default categories
  DEFAULT_CATEGORIES: [
    { name: 'Housing', type: 'expense', icon: '🏠', color: '#FF5733' },
    { name: 'Transportation', type: 'expense', icon: '🚗', color: '#33FF57' },
    { name: 'Food', type: 'expense', icon: '🍕', color: '#5733FF' },
    { name: 'Utilities', type: 'expense', icon: '💡', color: '#33B5FF' },
    { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#FF33E9' },
    { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#FFB533' },
    { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#33FFC1' },
    { name: 'Salary', type: 'income', icon: '💰', color: '#33FF33' },
    { name: 'Investment', type: 'income', icon: '📈', color: '#3357FF' },
    { name: 'Other', type: 'expense', icon: '📦', color: '#808080' }
  ],

  // Error messages
  ERROR_MESSAGES: {
    AUTH: {
      INVALID_CREDENTIALS: 'Invalid credentials',
      NOT_AUTHORIZED: 'Not authorized to access this route',
      TOKEN_INVALID: 'Invalid token',
      TOKEN_EXPIRED: 'Token has expired'
    },
    VALIDATION: {
      REQUIRED_FIELD: 'This field is required',
      INVALID_EMAIL: 'Please include a valid email',
      PASSWORD_LENGTH: 'Password must be at least 6 characters',
      INVALID_AMOUNT: 'Amount must be a positive number',
      INVALID_DATE: 'Please provide a valid date'
    },
    RESOURCE: {
      NOT_FOUND: 'Resource not found',
      ALREADY_EXISTS: 'Resource already exists',
      CREATE_FAILED: 'Failed to create resource',
      UPDATE_FAILED: 'Failed to update resource',
      DELETE_FAILED: 'Failed to delete resource'
    }
  }
};
