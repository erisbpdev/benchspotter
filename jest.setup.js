/* eslint-disable no-undef */
/**
 * Jest setup file
 *
 * This file runs before each test file and sets up the test environment.
 * Currently configured for pure JavaScript unit tests (validation, utils).
 *
 * Component testing with React Native Testing Library requires additional
 * setup for Expo SDK 54+. See:
 * https://docs.expo.dev/develop/unit-testing/
 */

// Global test timeout
jest.setTimeout(10000);

// Silence console warnings during tests
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  // Filter out known harmless warnings
  if (typeof args[0] === 'string' && args[0].includes('Animated')) return;
  if (typeof args[0] === 'string' && args[0].includes('useNativeDriver')) return;
  originalWarn(...args);
};

console.error = (...args) => {
  // Filter out expected test errors
  if (typeof args[0] === 'string' && args[0].includes('Test error')) return;
  originalError(...args);
};
