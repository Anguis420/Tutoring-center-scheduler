// Test setup file
require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/tutoring_test';

// Increase timeout for database operations
jest.setTimeout(30000);
