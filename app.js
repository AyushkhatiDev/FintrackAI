const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Load env vars
dotenv.config();

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');
const limiter = require('./middleware/rateLimiter');
const securityMiddleware = require('./middleware/security');

// Import routes
const auth = require('./routes/auth');
const expense = require('./routes/expense');
const budget = require('./routes/budget');
const category = require('./routes/category');
const transaction = require('./routes/transaction');
const notification = require('./routes/notification');
const report = require('./routes/report');
const aiInsight = require('./routes/aiInsight');

// Create Express app
const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Compression
app.use(compression());

// Apply security middleware
app.use(securityMiddleware);

// Request logging
app.use(requestLogger);

// Setup Swagger UI
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerDocument, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Finance Tracker API Documentation"
}));

// Rate limiting
app.use('/api/', limiter);

// Mount routes
app.use('/api/auth', auth);
app.use('/api/expenses', expense);
app.use('/api/budgets', budget);
app.use('/api/categories', category);
app.use('/api/transactions', transaction);
app.use('/api/notifications', notification);
app.use('/api/reports', report);
app.use('/api/insights', aiInsight);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Error handler
app.use(errorHandler);

module.exports = app;