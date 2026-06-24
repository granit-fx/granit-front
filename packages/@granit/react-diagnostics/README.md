# @granit/react-diagnostics

React Query hooks for the Granit **diagnostics** module — the live monitoring
health surface (aggregated service health for the admin dashboard). This is the
**React hooks layer**: it wraps the framework-agnostic Axios call and DTOs from
[`@granit/diagnostics`](../diagnostics) in a TanStack Query hook with a
self-polling `useMonitoringHealth` and a query-key factory. It holds no
rendering — cards, status badges, and the refresh indicator live one layer up.

The split is three packages over the same .NET `Granit.Diagnostics` backend
(contract: `contracts/openapi/diagnostics.json`, single route
`GET /diagnostics/health`):

- [`@granit/diagnostics`](../diagnostics) — framework-agnostic core: DTOs
  (`MonitoringHealthResponse`, `ServiceHealthResponse`, `ServiceStatus`), the
  `getMonitoringHealth` Axios call, and `DiagnosticsPermissions`.
- `@granit/react-diagnostics` (this package) — React Query hook + query-key
  factory, plus MSW testing fixtures.
- [`@granit/react-ui-diagnostics`](../react-ui-diagnostics) — admin UI kit: the
  monitoring/health page, service-health cards, and the auto-refresh indicator.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/diagnostics` — core DTOs + the `getMonitoringHealth` Axios call this
  layer wraps, plus `DEFAULT_DIAGNOSTICS_BASE_PATH`.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed to the hook.
- `@granit/types` — shared base types (`ISODateString` on the health DTOs).
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-diagnostics/testing`
  subpath.

## Quick start

The hook takes the Axios client explicitly (there is no provider in this
package) and polls every 30 seconds by default to keep the dashboard live.

```tsx
import { useMonitoringHealth } from '@granit/react-diagnostics';
import { useGranitClient } from '@granit/react-api-client';

function HealthDashboard() {
  const client = useGranitClient();
  const { data, isLoading } = useMonitoringHealth({ client });

  if (isLoading) return <span>Loading…</span>;

  return (
    <ul>
      {data?.services.map((s) => (
        <li key={s.id}>
          {s.name}: {s.status}
          {s.responseTimeMs !== null ? ` (${s.responseTimeMs} ms)` : ''}
        </li>
      ))}
    </ul>
  );
}
```

`data` is a `MonitoringHealthResponse`: a `services` array (each with `id`,
`name`, `status` of `'healthy' | 'degraded' | 'down'`, a nullable
`responseTimeMs`, a nullable `description`, and `tags`) plus a `checkedAt` ISO
timestamp. The query is cached with `staleTime: 30_000`; override the poll with
`refetchInterval`, point at a non-default mount with `basePath`, or namespace
the cache with `queryKeyPrefix`:

```tsx
const { data } = useMonitoringHealth({
  client,
  basePath: '/api/v1/diagnostics', // default
  refetchInterval: 10_000, // poll every 10 s instead of 30 s
  queryKeyPrefix: ['tenant-a', 'diagnostics'],
});
```

Build cache keys yourself (e.g. to invalidate from elsewhere) with the same
factory the hook uses:

```ts
import { buildDiagnosticsQueryKey } from '@granit/react-diagnostics';

queryClient.invalidateQueries({
  queryKey: buildDiagnosticsQueryKey({ queryKeyPrefix: ['diagnostics'] }, 'health'),
});
```

## Public API

| Symbol                     | Kind | Purpose                                                                             |
| -------------------------- | ---- | ----------------------------------------------------------------------------------- |
| `useMonitoringHealth`      | hook | Self-polling `GET {basePath}/health`; returns `MonitoringHealthResponse`            |
| `buildDiagnosticsQueryKey` | fn   | Query-key factory honoring an optional `queryKeyPrefix` (default `['diagnostics']`) |
| `MonitoringHealthOptions`  | type | Hook input: `client`, optional `basePath` / `refetchInterval` / `queryKeyPrefix`    |

`./testing` subpath (requires the optional `msw` peer):

- `createDiagnosticsHandlers(baseUrl?)` — MSW handler for `GET {baseUrl}/health`
  (default `/api/v1/diagnostics`); refreshes `checkedAt` to "now" on each request
  to simulate a live check.
- `mockDiagnosticsHealth` — a representative `MonitoringHealthResponse` fixture
  spanning `healthy` / `degraded` / `down` services.

## Out of scope

- **Rendering** — the monitoring page, service-health cards, and the auto-refresh
  indicator live in [`@granit/react-ui-diagnostics`](../react-ui-diagnostics).
  This package is headless.
- **DTOs and HTTP transport** — owned by [`@granit/diagnostics`](../diagnostics)
  (mirror of `Granit.Diagnostics`); the hook only adapts the `getMonitoringHealth`
  call to React Query. Permission constants (`DiagnosticsPermissions`, e.g.
  `Diagnostics.Monitoring.Read`) live there too.
- **Permission enforcement** — `Diagnostics.Monitoring.Read` is checked
  authoritatively by the .NET backend on every request; gate the dashboard's
  visibility client-side only as a UX hint, never as a security boundary.

## License

Apache-2.0
