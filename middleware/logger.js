const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize } = format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Create logger instance
const logger = createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    colorize(),
    logFormat
  ),
  transports: [
    // Console logging
    new transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'error' : 'debug'
    }),
    // File logging - errors
    new transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    // File logging - all levels
    new transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Middleware to log requests
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      user: req.user ? req.user._id : 'anonymous'
    });
  });
  next();
};

module.exports = { logger, requestLogger }; 