import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/coverage/**', 'storybook-static/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    plugins: { 'import-x': importPlugin },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-console': 'error',
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      // All Granit packages MUST go through @granit/api-client for HTTP client
      // types and instance creation. Direct `axios` imports bypass the framework
      // façade (interceptors, auth, CSRF, ProblemDetails) and are forbidden
      // outside the allow-list below.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'axios',
              message: "Import Axios types from '@granit/api-client' instead. The api-client package owns the HTTP client façade (createApiClient, AxiosInstance re-export, interceptors).",
            },
          ],
        },
      ],
    },
  },

  // Allow console.* in the logger package (it's the purpose of the package)
  {
    files: ['packages/@granit/logger/**/*.ts'],
    rules: { 'no-console': 'off' },
  },

  // The api-client package IS the façade — it must import from axios.
  // The allow-list below covers infra packages that legitimately sit below
  // the axios client in the dependency graph (auth bootstrap, telemetry,
  // Fetch-API-bound transports). Tests can mock axios freely.
  {
    files: [
      'packages/@granit/api-client/**/*.{ts,tsx}',
      'packages/@granit/bff/**/*.{ts,tsx}',
      'packages/@granit/react-bff/**/*.{ts,tsx}',
      'packages/@granit/logger-otlp/**/*.{ts,tsx}',
      'packages/@granit/react-tracing/**/*.{ts,tsx}',
      'packages/@granit/notifications-sse/**/*.{ts,tsx}',
      '**/__tests__/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },

  // Test files — relax some rules
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },

);
