import { defineConfig } from 'vitest/config';

import { granitWorkspaceAliases } from './scripts/workspace-aliases';

export default defineConfig({
  resolve: {
    // Auto-discovered from every package's `exports` map — see
    // scripts/workspace-aliases.ts. Do not add manual entries here; declare
    // the entry point in the package's own package.json instead.
    alias: granitWorkspaceAliases(__dirname),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // RTL + userEvent component tests are timing-sensitive; the 5s default flakes
    // under heavy parallel load (WSL / contended CI shards). A passing test never
    // waits this out, so a larger ceiling only affects genuinely stuck tests.
    testTimeout: 15_000,
    setupFiles: ['packages/@granit/testing/src/setup.ts'],
    include: ['packages/@granit/*/src/**/*.test.ts', 'packages/@granit/*/src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'cobertura'],
      reportsDirectory: './coverage',
      include: ['packages/@granit/*/src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        // Storybook stories are dev-time documentation, not runtime code under
        // test — exclude them so they don't dilute package coverage.
        '**/*.stories.ts',
        '**/*.stories.tsx',
        '**/types/**',
        '**/src/index.ts',
        '**/__tests__/setup.ts',
        '**/__tests__/test-utils.tsx',
        '**/api-client/src/test-utils.ts',
        '**/src/testing/**',
        // @granit/testing is the framework's test-infra package — its source is
        // tooling for other packages' tests, not runtime code under coverage.
        'packages/@granit/testing/**',
        'packages/@granit/react-testing/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
