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
      // Ban DOM-XSS sinks framework-wide. Use `@granit/utils/assertSafeUrl`
      // for any server-controlled URL, and prefer React text rendering over
      // raw HTML injection. If a package genuinely needs to render HTML
      // (markdown viewer, etc.), it must sanitize with DOMPurify and add a
      // file-local eslint-disable with a justification.
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            'dangerouslySetInnerHTML is banned in framework code. Render text via JSX (auto-escaped) or sanitize with DOMPurify and disable this rule locally with a justification.',
        },
        {
          selector: "AssignmentExpression[left.property.name='innerHTML']",
          message:
            'Assigning to .innerHTML is banned (XSS sink). Use textContent, JSX, or sanitize with DOMPurify.',
        },
        {
          selector: "AssignmentExpression[left.property.name='outerHTML']",
          message: 'Assigning to .outerHTML is banned (XSS sink).',
        },
        {
          selector: "CallExpression[callee.name='eval']",
          message: 'eval() is banned (CSP-incompatible, RCE risk).',
        },
        {
          selector: "NewExpression[callee.name='Function']",
          message: 'new Function() is banned (CSP-incompatible, eval-equivalent).',
        },
        {
          selector: "CallExpression[callee.object.name='document'][callee.property.name='write']",
          message: 'document.write is banned (XSS sink, blocks parser).',
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
