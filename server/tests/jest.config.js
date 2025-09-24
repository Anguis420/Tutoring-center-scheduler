module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/setup.js'],
  testMatch: [
    '<rootDir>/**/*.test.js'
  ],
  collectCoverageFrom: [
    '../models/**/*.js',
    '../routes/**/*.js',
    '../middleware/**/*.js',
    '../utils/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 30000,
  // Ensure each test file runs in isolation
  maxWorkers: 1,
  // Clear mocks between tests
  clearMocks: true,
  // Reset modules between tests
  resetModules: true,
  // Restore mocks between tests
  restoreMocks: true
};
