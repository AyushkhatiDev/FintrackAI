const Redis = require('ioredis');
const { logger } = require('../middleware/logger');

let redisClient;

const initializeRedis = () => {
  // Skip Redis in development if not available
  if (process.env.NODE_ENV === 'development' && !process.env.REDIS_REQUIRED) {
    logger.info('Running in development mode without Redis (using mock implementation)');
    return {
      get: async () => null,
      set: async () => true,
      setEx: async () => true,
      del: async () => true,
      ping: async () => true,
      quit: async () => true,
      on: () => {} // Add mock 'on' method to prevent event binding errors
    };
  }

  try {
    const client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      lazyConnect: true, // Only connect when needed
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('Redis connection failed after 3 retries');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      }
    });

    // Only log connection status once
    let hasLogged = false;
    client.on('connect', () => {
      if (!hasLogged) {
        logger.info('Redis connected successfully');
        hasLogged = true;
      }
    });

    client.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    return client;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    // Fall back to mock implementation
    logger.info('Falling back to mock Redis implementation');
    return {
      get: async () => null,
      set: async () => true,
      setEx: async () => true,
      del: async () => true,
      ping: async () => true,
      quit: async () => true,
      on: () => {}
    };
  }
};

redisClient = initializeRedis();

module.exports = { redisClient };
