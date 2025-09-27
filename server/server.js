const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: __dirname + '/../.env' });

const app = express();

// Trust proxy for Heroku (fixes rate limiting with X-Forwarded-For headers)
app.set('trust proxy', 1);

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const scheduleRoutes = require('./routes/schedules');
const appointmentRoutes = require('./routes/appointments');
const studentRoutes = require('./routes/students');

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    // Parse ALLOWED_ORIGINS environment variable
    const allowedOrigins = process.env.ALLOWED_ORIGINS;
    if (!allowedOrigins) {
      console.warn('WARNING: ALLOWED_ORIGINS environment variable not set in production. CORS will be disabled.');
      return [];
    }
    
    // Split by comma, trim whitespace, and filter out empty strings
    return allowedOrigins
      .split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0);
  } else {
    // Development fallback
    return ['http://localhost:3000'];
  }
};

const allowedOrigins = getAllowedOrigins();

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 10;

const connectDB = async () => {
  try {
    connectionAttempts++;
    await mongoose.connect(
      process.env.MONGODB_URI ||
        'mongodb://localhost:27017/tutoring-center-scheduler',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000, // 30 seconds
        socketTimeoutMS: 45000,           // 45 seconds
      }
    );
    console.log('MongoDB connected successfully');
    connectionAttempts = 0; // Reset on successful connection
  } catch (err) {
    console.error('MongoDB connection error:', err);
    if (connectionAttempts >= MAX_RETRY_ATTEMPTS) {
      console.error(
        `Failed to connect after ${MAX_RETRY_ATTEMPTS} attempts. Exiting...`
      );
      process.exit(1);
    }
    console.log(
      `Retrying connection (attempt ${connectionAttempts}/${MAX_RETRY_ATTEMPTS})...`
    );
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/students', studentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Tutoring Center Scheduler API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      schedules: '/api/schedules',
      appointments: '/api/appointments',
      students: '/api/students'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler - only for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/users',
      'GET /api/schedules',
      'GET /api/appointments',
      'GET /api/students'
    ]
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; 