const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 20000,
    setupFiles: ['./tests/setup.js'],
  },
});
