# @granit/diagnostics

Framework-agnostic **monitoring health** SDK — the TypeScript counterpart of the
.NET `Granit.Diagnostics` module. It mirrors the
[`contracts/openapi/diagnostics.json`](../../../contracts/openapi/diagnostics.json)
contract and exposes the DTO types, the Axios HTTP call and the permission
constants needed to read the aggregated health status of a Granit backend from
any client — React, React Native, a CLI, tests.

It holds **no** React, DOM or Node-only dependency. The React Query layer lives
in [`@granit/react-diagnostics`](../react-diagnostics) (the `useMonitoringHealth`
hook), and the admin monitoring page — service-health cards, auto-refresh
indicator — lives in [`@granit/react-ui-diagnostics`](../react-ui-diagnostics).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
these peers:

- `@granit/api-client` — supplies the `AxiosInstance` passed to the API call
  (CSRF, auth and tenant interceptors).
- `@granit/types` — supplies the branded `ISODateString` used by `checkedAt`.

## Quick start

```ts
import {
  getMonitoringHealth,
  DEFAULT_DIAGNOSTICS_BASE_PATH,
  DiagnosticsPermissions,
} from '@granit/diagnostics';
import type { MonitoringHealthResponse } from '@granit/diagnostics';

// `GET {basePath}/health` — defaults to /api/v1/diagnostics/health.
const health: MonitoringHealthResponse = await getMonitoringHealth(
  client,
  DEFAULT_DIAGNOSTICS_BASE_PATH
);

for (const service of health.services) {
  // status is 'healthy' | 'degraded' | 'down'
  logger.info(`${service.name}: ${service.status} (${service.responseTimeMs ?? '—'} ms)`);
}

// Gate the call behind the backend-owned permission key.
const canRead = DiagnosticsPermissions.Monitoring.Read; // 'Diagnostics.Monitoring.Read'
```

## Public API

| Symbol                          | Kind  | Purpose                                                                      |
| ------------------------------- | ----- | ---------------------------------------------------------------------------- |
| `MonitoringHealthResponse`      | type  | `GET .../health` body — `services[]` + `checkedAt` timestamp                 |
| `ServiceHealthResponse`         | type  | One service: `id`, `name`, `status`, `responseTimeMs`, `description`, `tags` |
| `ServiceStatus`                 | type  | `'healthy' \| 'degraded' \| 'down'`                                          |
| `getMonitoringHealth`           | fn    | `GET {basePath}/health` → `MonitoringHealthResponse`                         |
| `DEFAULT_DIAGNOSTICS_BASE_PATH` | const | `'/api/v1/diagnostics'` — default collection root                            |
| `DiagnosticsPermissions`        | const | Permission keys (`Monitoring.Read`), mirrors the .NET backend                |

`responseTimeMs` and `description` are nullable (`number | null` /
`string | null`); `checkedAt` is a branded `ISODateString` from `@granit/types`,
not a plain string.

## Out of scope / caveats

- **Read-only.** This module mirrors a single `GET .../health` endpoint; there
  are no mutations, no per-service detail route and no history. Liveness /
  readiness probes are backend infrastructure, not part of this contract.
- **Not a security boundary.** `DiagnosticsPermissions.Monitoring.Read` is a UX
  hint for hiding the monitoring page; the `Granit.Diagnostics` backend
  re-checks authorization on every request.
- **No React here.** Do not add hooks, providers or query keys to this package —
  they belong in [`@granit/react-diagnostics`](../react-diagnostics).

## License

Apache-2.0
