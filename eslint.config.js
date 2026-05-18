import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

// XSS sink bans — applied everywhere in the framework, including allow-listed
// files. Kept as a const so the console allow-list block can re-declare
// `no-restricted-syntax` with these rules only (omitting the console bans).
const XSS_SINK_BANS = [
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
];

// Console bans — applied to every package EXCEPT the allow-list (fallback
// shims that run before any Logger can be wired). `no-console` catches
// direct `console.foo` calls; these selectors also catch the
// `globalThis.console.foo` / `window.console.foo` workarounds.
const CONSOLE_BANS = [
  {
    selector:
      "CallExpression[callee.object.object.name='globalThis'][callee.object.property.name='console']",
    message:
      'globalThis.console.* is banned. Inject a Logger from `@granit/logger` instead. If this is a bootstrap-time fallback (no logger wired yet), add the file to the eslint allow-list with a justification.',
  },
  {
    selector:
      "CallExpression[callee.object.object.name='window'][callee.object.property.name='console'], CallExpression[callee.object.object.name='self'][callee.object.property.name='console']",
    message:
      'window.console / self.console is banned. Inject a Logger from `@granit/logger`.',
  },
];

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
      // Native `fetch()` bypasses the centralized Axios client (interceptors,
      // auth, CSRF, ProblemDetails). Allowed only in infra packages that sit
      // below the Axios client in the dependency graph — see override below.
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            "Native fetch() bypasses @granit/api-client. Use the centralized Axios client; for streaming, configure axios with adapter: 'fetch'.",
        },
      ],
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
      // Ban DOM-XSS sinks + console.* framework-wide. Allow-list for
      // bootstrap-time fallback shims at the bottom of this file.
      'no-restricted-syntax': ['error', ...XSS_SINK_BANS, ...CONSOLE_BANS],
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
    rules: { 'no-restricted-imports': 'off', 'no-restricted-globals': 'off' },
  },

  // Test files — relax some rules
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },

  // Allow-list for legitimate `globalThis.console.*` fallback shims — these
  // sites run BEFORE any Logger can be wired (config bootstrap, default
  // renderer shim) or are explicitly the fallback path when the consumer
  // omits the optional `logger` config. Every entry here must stay tightly
  // scoped to a single file. Other migrations are tracked in the /security
  // audit Tactical roadmap (VULN-302). XSS sink bans remain active.
  {
    files: [
      'packages/@granit/api-client/src/index.ts',
      'packages/@granit/react-bff/src/providers/bff-provider.tsx',
      'packages/@granit/react-entities/src/providers/entity-renderer-provider.tsx',
      // Tactical migration pending (VULN-302):
      'packages/@granit/react-authentication-entraid/src/hooks/use-entraid-init.ts',
    ],
    rules: {
      'no-restricted-syntax': ['error', ...XSS_SINK_BANS],
      'no-console': 'off',
    },
  },

);
