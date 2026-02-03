/**
 * Jest Configuration for BenchSpotter
 *
 * Note: Due to Expo SDK 54's new ESM runtime, component testing
 * with React Native requires additional setup. This config is
 * optimized for unit testing pure JavaScript logic (validation, utils).
 *
 * For full component testing, see:
 * https://docs.expo.dev/develop/unit-testing/
 */
module.exports = {
  // Use Node.js environment for pure unit tests
  testEnvironment: 'node',

  // Setup file
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Only run tests in __tests__ directories
  testMatch: ['**/__tests__/**/*.test.js'],

  // Don't transform node_modules
  transformIgnorePatterns: ['node_modules/(?!(zod)/)'],

  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/__tests__/**',
    '!src/**/index.js',
  ],

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],

  // Global variables
  globals: {
    __DEV__: true,
  },

  // Verbose output
  verbose: true,
};
