const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');
const { DEFAULT_CATEGORIES } = require('../utils/constants');
const { logger } = require('../middleware/logger');

dotenv.config();

const initializeDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logger.info('MongoDB Connected');

    // Create default categories
    for (const category of DEFAULT_CATEGORIES) {
      await Category.findOneAndUpdate(
        { name: category.name },
        { ...category, isDefault: true },
        { upsert: true, new: true }
      );
    }

    logger.info('Default categories created');
    process.exit(0);
  } catch (error) {
    logger.error('Error initializing database:', error);
    process.exit(1);
  }
};

initializeDb(); 