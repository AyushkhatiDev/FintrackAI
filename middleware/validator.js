const { validationResult } = require('express-validator');
const ErrorResponse = require('../utils/errorResponse');

const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      errors: extractedErrors
    });
  };
};

// Common validation rules
const commonValidations = {
  id: {
    in: ['params'],
    isMongoId: true,
    errorMessage: 'Invalid ID format'
  },
  pagination: {
    page: {
      in: ['query'],
      optional: true,
      isInt: { min: 1 },
      errorMessage: 'Page must be a positive integer'
    },
    limit: {
      in: ['query'],
      optional: true,
      isInt: { min: 1, max: 100 },
      errorMessage: 'Limit must be between 1 and 100'
    }
  },
  dateRange: {
    startDate: {
      in: ['query'],
      optional: true,
      isISO8601: true,
      errorMessage: 'Start date must be a valid date'
    },
    endDate: {
      in: ['query'],
      optional: true,
      isISO8601: true,
      errorMessage: 'End date must be a valid date'
    }
  }
};

module.exports = {
  validate,
  commonValidations
};
