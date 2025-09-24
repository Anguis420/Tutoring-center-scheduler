module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/server/tests/**/*.test.js',
    '**/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/tests/**',
    '!**/node_modules/**',
    '!jest.config.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/server/tests/setup.js'],
  testTimeout: 30000,
  roots: ['<rootDir>/server', '<rootDir>/tests']
};
