module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: ['<rootDir>/tests/live/'],
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  verbose: true,
};
