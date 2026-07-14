<p align="center">
  <img src="docs/images/granit-logo.svg" alt="Granit Front" height="80" />
</p>

# granit-front

Shared TypeScript/React framework — JavaScript/TypeScript counterpart of `granit-dotnet`.

Provides common building blocks for Digital Dynamics front-end applications: logger,
utilities, Axios HTTP client, Keycloak authentication, notifications, querying, and more.

## Packages

| Package                                                                                    | Description                                                             |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| [`@granit/api-client`](packages/@granit/api-client/)                                       | Axios factory with Bearer token interceptor and shared response types   |
| [`@granit/authentication`](packages/@granit/authentication/)                               | Keycloak/OIDC authentication types and configuration                    |
| [`@granit/authentication-api-keys`](packages/@granit/authentication-api-keys/)             | API key management types                                                |
| [`@granit/authorization`](packages/@granit/authorization/)                                 | Permission and role authorization types                                 |
| [`@granit/background-jobs`](packages/@granit/background-jobs/)                             | Background job monitoring types                                         |
| [`@granit/cookies`](packages/@granit/cookies/)                                             | Cookie consent abstraction with React context and hooks                 |
| [`@granit/data-exchange`](packages/@granit/data-exchange/)                                 | Tabular data import/export hooks and providers                          |
| [`@granit/error-boundary`](packages/@granit/error-boundary/)                               | Structured error capture with React error boundary and global listeners |
| [`@granit/idempotency`](packages/@granit/idempotency/)                                     | Automatic `Idempotency-Key` header injection for mutation requests      |
| [`@granit/localization`](packages/@granit/localization/)                                   | i18next helpers and localization hooks                                  |
| [`@granit/logger`](packages/@granit/logger/)                                               | Configurable logger factory (`createLogger`)                            |
| [`@granit/logger-otlp`](packages/@granit/logger-otlp/)                                     | OTLP transport for `@granit/logger`                                     |
| [`@granit/notifications`](packages/@granit/notifications/)                                 | Transport-agnostic notification hooks and providers                     |
| [`@granit/notifications-mobile-push`](packages/@granit/notifications-mobile-push/)         | Mobile push (FCM/APNs) device token registration via Capacitor          |
| [`@granit/notifications-signalr`](packages/@granit/notifications-signalr/)                 | SignalR transport adapter for `@granit/notifications`                   |
| [`@granit/notifications-sse`](packages/@granit/notifications-sse/)                         | SSE transport adapter for `@granit/notifications`                       |
| [`@granit/notifications-web-push`](packages/@granit/notifications-web-push/)               | Web Push VAPID subscription management                                  |
| [`@granit/query-engine`](packages/@granit/query-engine/)                                   | Headless data grid hooks with TanStack Query integration                |
| [`@granit/react-authentication`](packages/@granit/react-authentication/)                   | React hooks for Keycloak init, auth context factory, mock provider      |
| [`@granit/react-authentication-api-keys`](packages/@granit/react-authentication-api-keys/) | React hooks for API key CRUD operations                                 |
| [`@granit/react-authorization`](packages/@granit/react-authorization/)                     | React hooks for permissions, definitions, role grants                   |
| [`@granit/react-background-jobs`](packages/@granit/react-background-jobs/)                 | React hooks for background job monitoring and control                   |
| [`@granit/react-reference-data`](packages/@granit/react-reference-data/)                   | React hooks for reference data (countries) CRUD                         |
| [`@granit/reference-data`](packages/@granit/reference-data/)                               | Reference data types (countries)                                        |
| [`@granit/settings`](packages/@granit/settings/)                                           | User settings hooks and providers                                       |
| [`@granit/storage`](packages/@granit/storage/)                                             | File upload and storage management hooks                                |
| [`@granit/templating`](packages/@granit/templating/)                                       | Template editing and preview hooks                                      |
| [`@granit/timeline`](packages/@granit/timeline/)                                           | Unified activity feed hooks for audit trails                            |
| [`@granit/tracing`](packages/@granit/tracing/)                                             | OpenTelemetry distributed tracing for the browser                       |
| [`@granit/utils`](packages/@granit/utils/)                                                 | Shared utilities (`cn`, `formatDate`, `formatNumber`, ...)              |
| [`@granit/workflow`](packages/@granit/workflow/)                                           | Workflow lifecycle hooks (status, transitions, history)                 |

## Documentation

| Section                              | Description                                        |
| ------------------------------------ | -------------------------------------------------- |
| [Framework](docs/framework/index.md) | Reference documentation for each module            |
| [Guide](docs/guide/index.md)         | Step-by-step tutorials, quick start                |
| [Tests](docs/testing/index.md)       | Conventions, Vitest stack, mock patterns, coverage |
| [CI/CD](docs/deployment/index.md)    | CI pipeline, quality analysis, release workflow    |
| [Patterns](docs/patterns/index.md)   | Design patterns used in granit-front               |

## Integration

Packages are consumed directly as TypeScript source — no separate build step.

### 1. `package.json`

```json
{
  "dependencies": {
    "@granit/logger": "link:../../../granit-front/packages/@granit/logger",
    "@granit/utils": "link:../../../granit-front/packages/@granit/utils",
    "@granit/api-client": "link:../../../granit-front/packages/@granit/api-client",
    "@granit/authentication": "link:../../../granit-front/packages/@granit/authentication",
    "@granit/react-authentication": "link:../../../granit-front/packages/@granit/react-authentication"
  }
}
```

### 2. `vite.config.ts`

```typescript
import path from 'path';

const GRANIT = path.resolve(__dirname, '../../../granit-front/packages/@granit');

export default defineConfig({
  resolve: {
    alias: {
      '@granit/logger': path.join(GRANIT, 'logger/src/index.ts'),
      '@granit/utils': path.join(GRANIT, 'utils/src/index.ts'),
      '@granit/api-client': path.join(GRANIT, 'api-client/src/index.ts'),
      '@granit/authentication': path.join(GRANIT, 'authentication/src/index.ts'),
      '@granit/react-authentication': path.join(GRANIT, 'react-authentication/src/index.ts'),
    },
  },
});
```

### 3. `tsconfig.json` (paths)

```json
{
  "compilerOptions": {
    "paths": {
      "@granit/logger": ["../../../granit-front/packages/@granit/logger/src/index.ts"],
      "@granit/utils": ["../../../granit-front/packages/@granit/utils/src/index.ts"],
      "@granit/api-client": ["../../../granit-front/packages/@granit/api-client/src/index.ts"],
      "@granit/authentication": [
        "../../../granit-front/packages/@granit/authentication/src/index.ts"
      ],
      "@granit/react-authentication": [
        "../../../granit-front/packages/@granit/react-authentication/src/index.ts"
      ]
    }
  }
}
```

Repeat in each app tsconfig: `tsconfig.app.json`, `tsconfig.test.json`, `tsconfig.storybook.json`.

## Workspace Commands

```bash
# All packages
pnpm lint               # ESLint (zero warnings)
pnpm tsc                # TypeScript check (all packages)
pnpm test               # Vitest — watch mode
pnpm test:coverage      # Vitest — v8 coverage (lcov + html)

# Target a specific package
pnpm --filter @granit/utils lint
pnpm --filter @granit/authentication test
```

## Conventions

- **Source-direct**: packages export `.ts` files — `"exports": { ".": "./src/index.ts" }`, no `dist/`
- **Peer deps**: third-party dependencies (`axios`, `clsx`, `keycloak-js`, ...) are declared in `peerDependencies` and provided by the consumer application
- **Stable API**: any public export change requires coordinated updates to consumer apps
- **No app-specific code**: no application-specific logic in packages

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding conventions, and
submission guidelines.

## License

Licensed under the [Apache License 2.0](LICENSE).
