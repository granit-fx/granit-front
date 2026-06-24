# @granit/react-api-client

React context provider for sharing a single Axios instance across every Granit
framework provider and hook. This is the thin **React hooks/providers** layer
over the framework-agnostic **core** package
[`@granit/api-client`](../api-client) — the Axios factory (`createApiClient`)
that wires the Bearer/BFF auth, tenant, CSRF and idempotency interceptors. There
is no `react-ui-api-client` admin feature kit, and no backend counterpart: this
package is pure browser infrastructure with no HTTP calls of its own.

`@granit/api-client` builds the instance; this package makes that one instance
available by context so domain providers (`QueryProvider`,
`DataExchangeProvider`, …) and hooks resolve it from the tree instead of
threading a `client` through every config object. It is the seam behind the
`config.client ?? context` fallback pattern used throughout the framework.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare these peers:

- `@granit/api-client` — supplies the `AxiosInstance` (auth, tenant, CSRF,
  idempotency, 401 interceptors) that you mount on the provider.
- `react` — `^19.0.0`; the provider uses React 19 context-as-component.

## Quick start

Mount `GranitClientProvider` once at the application root, above any Granit
domain provider, with the instance returned by `createApiClient`:

```tsx
import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';

const api = createApiClient({ baseURL: '/api' });

export function Root() {
  return (
    <GranitClientProvider client={api}>
      <App />
    </GranitClientProvider>
  );
}
```

Consume the shared client inside framework packages or application code:

```tsx
import type { AxiosInstance } from '@granit/api-client';
import { useGranitClient, useOptionalGranitClient } from '@granit/react-api-client';

function useThings() {
  // Throws when no <GranitClientProvider> is mounted — use in app code where
  // the provider is guaranteed to exist.
  const client = useGranitClient();
  return () => client.get('/things');
}

function resolveClient(configClient?: AxiosInstance): AxiosInstance | null {
  // Returns null when no provider is mounted — the `config.client ?? context`
  // fallback every Granit hook relies on.
  const fromContext = useOptionalGranitClient();
  return configClient ?? fromContext;
}
```

## Public API

| Symbol                      | Kind     | Purpose                                                          |
| --------------------------- | -------- | ---------------------------------------------------------------- |
| `GranitClientProvider`      | provider | Publishes one `AxiosInstance` to the React tree via context      |
| `GranitClientProviderProps` | type     | `{ client: AxiosInstance; children: ReactNode }`                 |
| `useGranitClient`           | hook     | Returns the context client; **throws** when no provider is found |
| `useOptionalGranitClient`   | hook     | Returns the context client, or `null` when no provider is found  |

## Out of scope / caveats

- **No instance creation here.** This package never calls `createApiClient`; it
  only distributes an instance you build with [`@granit/api-client`](../api-client).
  All interceptor behaviour (Bearer/BFF auth, `X-Tenant-Id`, `X-CSRF-Token`,
  `Idempotency-Key`, the 401 handler) is configured on the core factory, not
  here.
- **`useGranitClient` throws when unmounted.** Reach for
  `useOptionalGranitClient` inside reusable framework packages that must degrade
  to a `config.client` override; reserve `useGranitClient` for application code
  where the provider is guaranteed.
- **Single instance per subtree.** Nesting two providers shadows the outer
  client for descendants — useful for tests and isolated subtrees, but a common
  foot-gun when wiring an app, where exactly one root provider is the norm.
- **No security boundary.** This is transport plumbing: it neither authenticates
  nor authorizes. The browser is hostile territory; every protected route MUST
  re-check auth on the .NET backend regardless of which client made the call.

## Documentation

See the [HTTP client guide](https://granit-fx.dev/frontend/api/http-client/).

## License

Apache-2.0
