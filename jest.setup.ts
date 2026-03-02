// Jest setup file
// Configure test environment and mocks

// Mock crypto for tests
global.crypto = require('crypto').webcrypto;

// Increase timeout for database operations
jest.setTimeout(30000);

// Clear mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});
