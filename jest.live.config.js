module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/live/**/*.test.js'],
  verbose: true,
  // No setupFiles here — unlike the default config, this one does NOT
  // load tests/setupEnv.js (which sets fake JWT secrets for the mocked
  // suite). This suite is meant to run against your real .env instead.
};
