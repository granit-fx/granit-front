# @granit/react-metering

React hooks + provider for the Granit **metering** module — the meter catalog,
meter CRUD + lifecycle, usage-event ingestion, period usage aggregates and quota
checks. This is the **React hooks layer**: it wraps the framework-agnostic Axios
calls and DTOs from [`@granit/metering`](../metering) in TanStack Query hooks
behind a shared `MeteringProvider` for client / base-path / query-key
configuration. It holds no rendering — catalog lists, detail pages, and the usage
explorer live one layer up.

The split is three packages over the same .NET `Granit.Metering` backend (in
`granit-business`, contract: `contracts/openapi/metering.json`):

- [`@granit/metering`](../metering) — framework-agnostic core: DTOs, Axios
  functions (`listActiveMeters`, `recordUsageEvents`, …), permission keys, and
  generated validation constraints.
- `@granit/react-metering` (this package) — React Query hooks + provider.
- [`@granit/react-ui-metering`](../react-ui-metering) — admin UI kit: meter
  catalog list, meter detail page, and the cross-tenant usage-aggregates explorer.

A **meter definition** is a named, unit-bearing counter with an aggregation
strategy that ingests **usage events** and rolls them into period-bucketed **usage
aggregates**, against which **quotas** are checked. Definitions follow a
`Draft → Published → Archived` lifecycle; only `Published` meters accept ingestion.
The hooks here cover the realtime CRUD / quota / usage surfaces; the paged
QueryEngine grids (`GET /meters`, `GET /usage-aggregates`) are driven directly by
[`@granit/react-query-engine`](../react-query-engine) from the react-ui layer.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/metering` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@granit/types` — branded scalars (`ISODateString`, `TenantId`, entity ids) used
  by the DTOs and testing fixtures.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `@granit/query-engine` and `@granit/react-query-engine` (**optional**) — only the
  `./testing` subpath uses them, for the QueryEngine grid-metadata fixtures.
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-metering/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it.

```tsx
import { MeteringProvider, useActiveMeters } from '@granit/react-metering';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <MeteringProvider config={{ client: useGranitClient() }}>
      {children}
    </MeteringProvider>
  );
}

function MeterCatalog() {
  const { data: meters, isLoading } = useActiveMeters();
  if (isLoading) return null;
  return (
    <ul>
      {meters?.map((m) => (
        <li key={m.id}>
          {m.name} ({m.unit})
        </li>
      ))}
    </ul>
  );
}
```

`useActiveMeters()` lists `Published` meters only. Admin screens combine the read
hooks with the lifecycle mutations; each mutation invalidates the relevant
`metering` query keys on success:

```tsx
import {
  useCreateMeterDefinition,
  usePublishMeterDefinition,
  useRecordUsageEvents,
  useUsageForPeriod,
} from '@granit/react-metering';

function MeterAdmin({ meterId }: { meterId: string }) {
  const create = useCreateMeterDefinition();
  const publish = usePublishMeterDefinition();
  const record = useRecordUsageEvents();
  const { data: usage } = useUsageForPeriod({
    meterId,
    periodStart: '2026-04-01T00:00:00Z',
    periodEnd: '2026-05-01T00:00:00Z',
  });

  async function onCreate() {
    const meter = await create.mutateAsync({
      name: 'API Calls',
      unit: 'calls',
      aggregationType: 'Count',
      description: null,
    });
    await publish.mutateAsync(meter.id); // Draft → Published
  }

  // A fresh Idempotency-Key is generated per call to survive network replay.
  function onIngest() {
    record.mutate({
      events: [
        {
          meterDefinitionId: meterId,
          idempotencyKey: crypto.randomUUID(),
          quantity: 1,
          timestamp: new Date().toISOString(),
          metadata: null,
        },
      ],
    });
  }

  return <output>{usage?.aggregatedValue ?? 0}</output>;
}
```

## Public API

| Symbol                           | Kind     | Purpose                                                            |
| -------------------------------- | -------- | ------------------------------------------------------------------ |
| `MeteringProvider`               | provider | Supplies client, base path, query-key prefix to all hooks below    |
| `useMeteringConfig`              | hook     | Read the resolved config; throws outside a provider                |
| `buildMeteringQueryKey`          | fn       | Query-key factory honoring the configured `queryKeyPrefix`         |
| `useActiveMeters`                | hook     | `GET .../meters/active` — the `Published` meter catalog (array)    |
| `useMeterDefinition`             | hook     | `GET .../meters/{id}` — one meter; disabled when `id` empty        |
| `useUsageForPeriod`              | hook     | `GET .../usage` aggregate for a meter + period; disabled until set |
| `useMeteringQuota`               | hook     | `GET .../quota/{meterId}` — quota status; disabled when empty      |
| `useCreateMeterDefinition`       | hook     | `POST .../meters` — create (starts `Draft`); invalidates meters    |
| `useUpdateMeterDefinition`       | hook     | `PUT .../meters/{id}` — edit a `Draft`; invalidates meters         |
| `usePublishMeterDefinition`      | hook     | `POST .../meters/{id}/publish` — `Draft → Published`               |
| `useArchiveMeterDefinition`      | hook     | `POST .../meters/{id}/archive` — `Published → Archived`            |
| `useRecordUsageEvents`           | hook     | `POST .../events` — batch ingest; invalidates usage + quota        |
| `MeteringConfig`                 | type     | Provider input (optional client / basePath / queryKeyPrefix)       |
| `MeteringProviderProps`          | type     | `{ config, children }`                                             |
| `UsageForPeriodParams`           | type     | `{ meterId, periodStart, periodEnd }` (ISO 8601 bounds)            |
| `UpdateMeterDefinitionVariables` | type     | `{ id, request }` for `useUpdateMeterDefinition`                   |

DTO types (`MeterDefinitionResponse`, `UsageAggregateResponse`,
`MeteringQuotaStatusResponse`, the request bodies, …) and the `MeteringPermissions`
keys are owned by [`@granit/metering`](../metering) — import them from there, not
from this package.

`./testing` subpath (requires the optional `msw`, `@granit/query-engine`, and
`@granit/react-query-engine` peers): `createMeteringHandlers` (stateful MSW
handlers — meter create / update / publish / archive persist in an in-memory list;
default base `/api/v1/metering`), the `meterQueryMetadata` /
`usageAggregateQueryMetadata` grid-metadata fixtures, and the `sampleMeters`,
`sampleMeterDefinitions`, `sampleUsage`, `sampleUsageAggregates`, and `sampleQuota`
data fixtures.

## Caveats

- **Idempotent ingestion.** `useRecordUsageEvents` generates a fresh request-level
  `Idempotency-Key` header per `mutate` call so a network retry of the same batch is
  deduplicated server-side. Each event additionally carries its own
  `idempotencyKey` for per-event dedup; supply a stable one if you may resubmit the
  same logical event.
- **Disabled-until-ready queries.** `useMeterDefinition`, `useMeteringQuota` and
  `useUsageForPeriod` self-disable until their identifiers are present (`id` /
  `meterId` non-empty, `params` non-null), so they are safe to call before a
  selection exists without a flash of a failed request.
- **Lifecycle gating is the backend's job.** The mutation hooks issue the lifecycle
  transition requests; the `Draft → Published → Archived` rules and the "only
  `Published` meters accept events" invariant are enforced by `Granit.Metering`, not
  the client.

## Out of scope

- **Rendering** — catalog lists, the meter detail page, and the usage-aggregates
  explorer live in [`@granit/react-ui-metering`](../react-ui-metering). This package
  is headless.
- **QueryEngine grids** — the paged `GET /meters` and `GET /usage-aggregates` admin
  surfaces are driven directly by
  [`@granit/react-query-engine`](../react-query-engine) (with metadata fixtures in
  this package's `./testing` subpath), not by the hooks here.
- **DTOs, HTTP transport, permissions, and validation constraints** — owned by
  [`@granit/metering`](../metering) (mirror of `Granit.Metering`); hooks here only
  adapt the Axios calls to React Query.

## License

Apache-2.0
