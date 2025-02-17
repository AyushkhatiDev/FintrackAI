const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../utils/constants');

const limiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Use IP and user ID (if authenticated) for rate limiting
    return req.user ? `${req.ip}-${req.user._id}` : req.ip;
  }
});

module.exports = limiter; 

