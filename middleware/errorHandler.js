const ErrorResponse = require('../utils/errorResponse');
const constants = require('../utils/constants');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error(err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = constants.ERROR_MESSAGES.RESOURCE.NOT_FOUND;
        error = new ErrorResponse(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = constants.ERROR_MESSAGES.RESOURCE.ALREADY_EXISTS;
        error = new ErrorResponse(message, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = new ErrorResponse(message, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = constants.ERROR_MESSAGES.AUTH.TOKEN_INVALID;
        error = new ErrorResponse(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
        const message = constants.ERROR_MESSAGES.AUTH.TOKEN_EXPIRED;
        error = new ErrorResponse(message, 401);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;