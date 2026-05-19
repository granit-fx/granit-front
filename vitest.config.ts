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
      '@granit/arch-tests-kit': path.resolve(
        __dirname,
        'packages/@granit/arch-tests-kit/src/index.ts'
      ),
      '@granit/testing/msw': path.resolve(__dirname, 'packages/@granit/testing/src/msw.ts'),
      '@granit/react-auditing/testing': path.resolve(
        __dirname,
        'packages/@granit/react-auditing/src/testing/index.ts'
      ),
      '@granit/react-authentication-api-keys/testing': path.resolve(
        __dirname,
        'packages/@granit/react-authentication-api-keys/src/testing/index.ts'
      ),
      '@granit/react-authentication-local/testing': path.resolve(
        __dirname,
        'packages/@granit/react-authentication-local/src/testing/index.ts'
      ),
      '@granit/react-authorization/testing': path.resolve(
        __dirname,
        'packages/@granit/react-authorization/src/testing/index.ts'
      ),
      '@granit/react-background-jobs/testing': path.resolve(
        __dirname,
        'packages/@granit/react-background-jobs/src/testing/index.ts'
      ),
      '@granit/react-blob-storage/testing': path.resolve(
        __dirname,
        'packages/@granit/react-blob-storage/src/testing/index.ts'
      ),
      '@granit/react-customer-balance/testing': path.resolve(
        __dirname,
        'packages/@granit/react-customer-balance/src/testing/index.ts'
      ),
      '@granit/react-documents/testing': path.resolve(
        __dirname,
        'packages/@granit/react-documents/src/testing/index.ts'
      ),
      '@granit/react-data-exchange/testing': path.resolve(
        __dirname,
        'packages/@granit/react-data-exchange/src/testing/index.ts'
      ),
      '@granit/react-diagnostics/testing': path.resolve(
        __dirname,
        'packages/@granit/react-diagnostics/src/testing/index.ts'
      ),
      '@granit/react-features/testing': path.resolve(
        __dirname,
        'packages/@granit/react-features/src/testing/index.ts'
      ),
      '@granit/react-identity/testing': path.resolve(
        __dirname,
        'packages/@granit/react-identity/src/testing/index.ts'
      ),
      '@granit/react-invoicing/testing': path.resolve(
        __dirname,
        'packages/@granit/react-invoicing/src/testing/index.ts'
      ),
      '@granit/react-localization/testing': path.resolve(
        __dirname,
        'packages/@granit/react-localization/src/testing/index.ts'
      ),
      '@granit/react-metering/testing': path.resolve(
        __dirname,
        'packages/@granit/react-metering/src/testing/index.ts'
      ),
      '@granit/react-notifications/testing': path.resolve(
        __dirname,
        'packages/@granit/react-notifications/src/testing/index.ts'
      ),
      '@granit/react-parties/testing': path.resolve(
        __dirname,
        'packages/@granit/react-parties/src/testing/index.ts'
      ),
      '@granit/react-payments/testing': path.resolve(
        __dirname,
        'packages/@granit/react-payments/src/testing/index.ts'
      ),
      '@granit/react-privacy/testing': path.resolve(
        __dirname,
        'packages/@granit/react-privacy/src/testing/index.ts'
      ),
      '@granit/react-scheduling/testing': path.resolve(
        __dirname,
        'packages/@granit/react-scheduling/src/testing/index.ts'
      ),
      '@granit/react-settings/testing': path.resolve(
        __dirname,
        'packages/@granit/react-settings/src/testing/index.ts'
      ),
      '@granit/react-subscriptions/testing': path.resolve(
        __dirname,
        'packages/@granit/react-subscriptions/src/testing/index.ts'
      ),
      '@granit/react-tax/testing': path.resolve(
        __dirname,
        'packages/@granit/react-tax/src/testing/index.ts'
      ),
      '@granit/react-templating/testing': path.resolve(
        __dirname,
        'packages/@granit/react-templating/src/testing/index.ts'
      ),
      '@granit/react-timeline/testing': path.resolve(
        __dirname,
        'packages/@granit/react-timeline/src/testing/index.ts'
      ),
      '@granit/react-webhooks/testing': path.resolve(
        __dirname,
        'packages/@granit/react-webhooks/src/testing/index.ts'
      ),
      '@granit/react-workflow/testing': path.resolve(
        __dirname,
        'packages/@granit/react-workflow/src/testing/index.ts'
      ),
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
      '@granit/data-lookup': path.resolve(__dirname, 'packages/@granit/data-lookup/src/index.ts'),
      '@granit/react-data-lookup': path.resolve(
        __dirname,
        'packages/@granit/react-data-lookup/src/index.ts'
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
      '@granit/react-ai/testing': path.resolve(
        __dirname,
        'packages/@granit/react-ai/src/testing/index.ts'
      ),
      '@granit/react-auditing': path.resolve(
        __dirname,
        'packages/@granit/react-auditing/src/index.ts'
      ),
      '@granit/react-api-client': path.resolve(
        __dirname,
        'packages/@granit/react-api-client/src/index.ts'
      ),
      '@granit/react-account/testing': path.resolve(
        __dirname,
        'packages/@granit/react-account/src/testing/index.ts'
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
      '@granit/react-authentication/testing': path.resolve(
        __dirname,
        'packages/@granit/react-authentication/src/testing/index.ts'
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
      '@granit/react-multi-tenancy/testing': path.resolve(
        __dirname,
        'packages/@granit/react-multi-tenancy/src/testing/index.ts'
      ),
      '@granit/react-multi-tenancy': path.resolve(
        __dirname,
        'packages/@granit/react-multi-tenancy/src/index.ts'
      ),
      '@granit/react-localization': path.resolve(
        __dirname,
        'packages/@granit/react-localization/src/index.ts'
      ),
      '@granit/react-openiddict-admin/testing': path.resolve(
        __dirname,
        'packages/@granit/react-openiddict-admin/src/testing/index.ts'
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
      '@granit/react-query-engine/testing': path.resolve(
        __dirname,
        'packages/@granit/react-query-engine/src/testing/index.ts'
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
      '@granit/csp/testing': path.resolve(__dirname, 'packages/@granit/csp/src/testing/index.ts'),
      '@granit/csp': path.resolve(__dirname, 'packages/@granit/csp/src/index.ts'),
      '@granit/react-map/csp': path.resolve(
        __dirname,
        'packages/@granit/react-map/src/csp/index.ts'
      ),
      '@granit/react-authentication-keycloak/csp': path.resolve(
        __dirname,
        'packages/@granit/react-authentication-keycloak/src/csp/index.ts'
      ),
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
