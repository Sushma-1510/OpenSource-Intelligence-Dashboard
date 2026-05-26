const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const githubRoutes = require('./routes/githubRoutes');
const redditRoutes = require('./routes/redditRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Initialize Express app
const app = express();

// Security Middleware
app.use(helmet());

// CORS configuration (allow requests from the frontend client domain)
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Request body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting (100 requests per 15 minutes per IP to avoid DDoS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use('/api/', limiter);

// HTTP Traffic Logging with Morgan
app.use(morgan('combined', { stream: logger.stream }));

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'UP',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount Routes
app.use('/api/github', githubRoutes);
app.use('/api/reddit', redditRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 Route handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.originalUrl}`
  });
});

// Global Centralized Error Middleware
app.use(errorHandler);

// Establish MongoDB connection
connectDB();

// Start HTTP Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server successfully running in [${process.env.NODE_ENV || 'development'}] mode on port: ${PORT}`);
});

// Handle uncaught application failures gracefully
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection Error: ${err.message}`, err);
  // Gracefully close server and exit process
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception Error: ${err.message}`, err);
  // Gracefully close server and exit process
  server.close(() => process.exit(1));
});

module.exports = app; // Export for testing
