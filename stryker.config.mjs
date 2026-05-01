/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: 'pnpm',
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  mutate: [
    'packages/core/src/domain/**/*.ts',
    '!packages/core/src/domain/**/*.test.ts',
  ],
  vitest: {
    dir: 'packages/core',
    related: true,
  },
  reporters: ['clear-text', 'progress', 'html', 'json'],
  thresholds: {
    high: 100,
    low: 100,
    break: null,
  },
};
