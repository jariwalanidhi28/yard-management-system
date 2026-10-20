const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { csrfProtection } = require('./middleware/csrf');

const app = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible API usage
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

// Serve built React frontend static assets FIRST before CORS & API middleware
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

// CORS configuration
const clientOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...clientOrigins,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, tests)
      if (!origin) return callback(null, true);

      // Allow configured origins, any Render deployment origin, or local dev
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.onrender.com') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1');

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'X-XSRF-Token',
    ],
  })
);

// Logging in dev
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser(process.env.COOKIE_SECRET || 'cookie_secret_fallback'));

// CSRF Protection
app.use(csrfProtection);

// Global API rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// CSRF token retrieval helper endpoint
app.get('/api/v1/auth/csrf-token', (req, res) => {
  const token = req.cookies['XSRF-TOKEN'] || 'token-generated';
  res.status(200).json({ success: true, csrfToken: token });
});

// Versioned API routes
app.use('/api/v1', apiRoutes);

// SPA routing fallback: serve index.html for non-API navigation
if (fs.existsSync(frontendDistPath)) {
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    const indexPath = path.join(frontendDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

// Catch-all 404 handler for API routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}. Route not found.`,
  });
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
