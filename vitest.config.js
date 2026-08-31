import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    exclude: ['tests/build-smoke.test.js', 'node_modules'],
    setupFiles: ['tests/setup.js'],
  },
});
