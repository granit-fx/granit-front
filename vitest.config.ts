import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@granit/api-client/test-utils': path.resolve(
        __dirname,
        'packages/@granit/api-client/src/test-utils.ts'
      ),
      '@granit/api-client': path.resolve(__dirname, 'packages/@granit/api-client/src/index.ts'),
      '@granit/auditing': path.resolve(__dirname, 'packages/@granit/auditing/src/index.ts'),
      '@granit/account': path.resolve(__dirname, 'packages/@granit/account/src/index.ts'),
      '@granit/ai': path.resolve(__dirname, 'packages/@granit/ai/src/index.ts'),
      '@granit/background-jobs': path.resolve(
        __dirname,
        'packages/@granit/background-jobs/src/index.ts'
      ),
      '@granit/blob-storage': path.resolve(__dirname, 'packages/@granit/blob-storage/src/index.ts'),
      '@granit/authentication-api-keys': path.resolve(
        __dirname,
        'packages/@granit/authentication-api-keys/src/index.ts'
      ),
      '@granit/authentication': path.resolve(
        __dirname,
        'packages/@granit/authentication/src/index.ts'
      ),
      '@granit/authorization': path.resolve(
        __dirname,
        'packages/@granit/authorization/src/index.ts'
      ),
      '@granit/cookies': path.resolve(__dirname, 'packages/@granit/cookies/src/index.ts'),
      '@granit/cookies-klaro': path.resolve(
        __dirname,
        'packages/@granit/cookies-klaro/src/index.ts'
      ),
      '@granit/data-exchange': path.resolve(
        __dirname,
        'packages/@granit/data-exchange/src/index.ts'
      ),
      '@granit/error-boundary': path.resolve(
        __dirname,
        'packages/@granit/error-boundary/src/index.ts'
      ),
      '@granit/features': path.resolve(__dirname, 'packages/@granit/features/src/index.ts'),
      '@granit/idempotency': path.resolve(__dirname, 'packages/@granit/idempotency/src/index.ts'),
      '@granit/identity': path.resolve(__dirname, 'packages/@granit/identity/src/index.ts'),
      '@granit/localization': path.resolve(__dirname, 'packages/@granit/localization/src/index.ts'),
      '@granit/logger': path.resolve(__dirname, 'packages/@granit/logger/src/index.ts'),
      '@granit/multi-tenancy': path.resolve(
        __dirname,
        'packages/@granit/multi-tenancy/src/index.ts'
      ),
      '@granit/logger-otlp': path.resolve(__dirname, 'packages/@granit/logger-otlp/src/index.ts'),
      '@granit/openiddict-admin': path.resolve(
        __dirname,
        'packages/@granit/openiddict-admin/src/index.ts'
      ),
      '@granit/notifications-mobile-push': path.resolve(
        __dirname,
        'packages/@granit/notifications-mobile-push/src/index.ts'
      ),
      '@granit/notifications-signalr': path.resolve(
        __dirname,
        'packages/@granit/notifications-signalr/src/index.ts'
      ),
      '@granit/notifications-sse': path.resolve(
        __dirname,
        'packages/@granit/notifications-sse/src/index.ts'
      ),
      '@granit/notifications-web-push': path.resolve(
        __dirname,
        'packages/@granit/notifications-web-push/src/index.ts'
      ),
      '@granit/notifications': path.resolve(
        __dirname,
        'packages/@granit/notifications/src/index.ts'
      ),
      '@granit/privacy': path.resolve(__dirname, 'packages/@granit/privacy/src/index.ts'),
      '@granit/query-engine': path.resolve(__dirname, 'packages/@granit/query-engine/src/index.ts'),
      '@granit/validation': path.resolve(__dirname, 'packages/@granit/validation/src/index.ts'),
      '@granit/react-reference-data': path.resolve(
        __dirname,
        'packages/@granit/react-reference-data/src/index.ts'
      ),
      '@granit/reference-data': path.resolve(
        __dirname,
        'packages/@granit/reference-data/src/index.ts'
      ),
      '@granit/react-ai': path.resolve(__dirname, 'packages/@granit/react-ai/src/index.ts'),
      '@granit/react-auditing': path.resolve(
        __dirname,
        'packages/@granit/react-auditing/src/index.ts'
      ),
      '@granit/react-account': path.resolve(
        __dirname,
        'packages/@granit/react-account/src/index.ts'
      ),
      '@granit/react-authentication-api-keys': path.resolve(
        __dirname,
        'packages/@granit/react-authentication-api-keys/src/index.ts'
      ),
      '@granit/react-background-jobs': path.resolve(
        __dirname,
        'packages/@granit/react-background-jobs/src/index.ts'
      ),
      '@granit/react-blob-storage': path.resolve(
        __dirname,
        'packages/@granit/react-blob-storage/src/index.ts'
      ),
      '@granit/react-authentication': path.resolve(
        __dirname,
        'packages/@granit/react-authentication/src/index.ts'
      ),
      '@granit/react-authorization': path.resolve(
        __dirname,
        'packages/@granit/react-authorization/src/index.ts'
      ),
      '@granit/react-cookies': path.resolve(
        __dirname,
        'packages/@granit/react-cookies/src/index.ts'
      ),
      '@granit/react-data-exchange': path.resolve(
        __dirname,
        'packages/@granit/react-data-exchange/src/index.ts'
      ),
      '@granit/react-error-boundary': path.resolve(
        __dirname,
        'packages/@granit/react-error-boundary/src/index.ts'
      ),
      '@granit/react-features': path.resolve(
        __dirname,
        'packages/@granit/react-features/src/index.ts'
      ),
      '@granit/react-identity': path.resolve(
        __dirname,
        'packages/@granit/react-identity/src/index.ts'
      ),
      '@granit/react-multi-tenancy': path.resolve(
        __dirname,
        'packages/@granit/react-multi-tenancy/src/index.ts'
      ),
      '@granit/react-localization': path.resolve(
        __dirname,
        'packages/@granit/react-localization/src/index.ts'
      ),
      '@granit/react-openiddict-admin': path.resolve(
        __dirname,
        'packages/@granit/react-openiddict-admin/src/index.ts'
      ),
      '@granit/react-notifications': path.resolve(
        __dirname,
        'packages/@granit/react-notifications/src/index.ts'
      ),
      '@granit/react-notifications-mobile-push': path.resolve(
        __dirname,
        'packages/@granit/react-notifications-mobile-push/src/index.ts'
      ),
      '@granit/react-notifications-web-push': path.resolve(
        __dirname,
        'packages/@granit/react-notifications-web-push/src/index.ts'
      ),
      '@granit/react-privacy': path.resolve(
        __dirname,
        'packages/@granit/react-privacy/src/index.ts'
      ),
      '@granit/react-query-engine': path.resolve(
        __dirname,
        'packages/@granit/react-query-engine/src/index.ts'
      ),
      '@granit/react-validation': path.resolve(
        __dirname,
        'packages/@granit/react-validation/src/index.ts'
      ),
      '@granit/react-templating': path.resolve(
        __dirname,
        'packages/@granit/react-templating/src/index.ts'
      ),
      '@granit/react-testing': path.resolve(
        __dirname,
        'packages/@granit/react-testing/src/index.ts'
      ),
      '@granit/react-settings': path.resolve(
        __dirname,
        'packages/@granit/react-settings/src/index.ts'
      ),
      '@granit/react-storage': path.resolve(
        __dirname,
        'packages/@granit/react-storage/src/index.ts'
      ),
      '@granit/react-timeline': path.resolve(
        __dirname,
        'packages/@granit/react-timeline/src/index.ts'
      ),
      '@granit/react-tracing': path.resolve(
        __dirname,
        'packages/@granit/react-tracing/src/index.ts'
      ),
      '@granit/react-workflow': path.resolve(
        __dirname,
        'packages/@granit/react-workflow/src/index.ts'
      ),
      '@granit/settings': path.resolve(__dirname, 'packages/@granit/settings/src/index.ts'),
      '@granit/storage': path.resolve(__dirname, 'packages/@granit/storage/src/index.ts'),
      '@granit/templating': path.resolve(__dirname, 'packages/@granit/templating/src/index.ts'),
      '@granit/testing': path.resolve(__dirname, 'packages/@granit/testing/src/index.ts'),
      '@granit/timeline': path.resolve(__dirname, 'packages/@granit/timeline/src/index.ts'),
      '@granit/tracing': path.resolve(__dirname, 'packages/@granit/tracing/src/index.ts'),
      '@granit/utils': path.resolve(__dirname, 'packages/@granit/utils/src/index.ts'),
      '@granit/webhooks': path.resolve(__dirname, 'packages/@granit/webhooks/src/index.ts'),
      '@granit/react-webhooks': path.resolve(
        __dirname,
        'packages/@granit/react-webhooks/src/index.ts'
      ),
      '@granit/workflow': path.resolve(__dirname, 'packages/@granit/workflow/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
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
        '**/types/**',
        '**/src/index.ts',
        '**/__tests__/setup.ts',
        '**/__tests__/test-utils.tsx',
        '**/api-client/src/test-utils.ts',
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
