# @granit/metering

Usage **metering** SDK — the framework-level TypeScript counterpart of the .NET
`Granit.Metering` module (backend in `granit-business`, contract in
[`contracts/openapi/metering.json`](../../../contracts/openapi/metering.json)).

This is the framework-agnostic **core** layer: it exposes the DTO types, HTTP
client functions, permission keys and generated validation constraints needed to
drive metering from any client — React, React Native, a CLI, tests. It holds **no**
React, DOM or Node-only dependency. The React hooks/providers layer lives in
[`@granit/react-metering`](../react-metering); the admin feature kit (catalog list,
meter detail, usage explorer) lives in
[`@granit/react-ui-metering`](../react-ui-metering).

Metering models a **meter definition** (a named, unit-bearing counter with an
aggregation strategy) that ingests **usage events** and rolls them up into
period-bucketed **usage aggregates**, against which **quotas** are checked. Meter
definitions follow a `Draft → Published → Archived` lifecycle (the reachable subset
of the shared `Granit.Workflow` state machine); only `Published` meters accept
ingestion. Two read surfaces coexist: realtime CRUD/quota endpoints returning
projected DTOs, and QueryEngine grids (`GET /meters`, `GET /usage-aggregates`)
returning the raw audited entities for admin tables.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
to a public registry for app consumption. Declare these peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call.
- `@granit/query-engine` — paged-grid driver (`getPage` / `getQueryMeta`) behind the
  meter-definition and usage-aggregate list functions.
- `@granit/types` — branded scalars (`ISODateString`, `TenantId`) used by the DTOs.
- `@granit/validation` — `SchemaConstraints` shape backing the generated
  `meteringConstraints`.

## Quick start

```ts
import {
  listActiveMeters,
  createMeterDefinition,
  publishMeterDefinition,
  recordUsageEvents,
  checkMeteringQuota,
  MeteringPermissions,
} from '@granit/metering';

// `basePath` is the metering module root; sub-resources (/meters, /events,
// /usage, /quota, …) hang off it.
const basePath = '/api/v1/metering';

// Tenant-facing catalog: Published meters only (plain array, no paged envelope).
const meters = await listActiveMeters(client, basePath);

// Admin: create a Draft meter, then publish so it starts accepting ingestion.
const meter = await createMeterDefinition(client, basePath, {
  name: 'API calls',
  unit: 'request',
  aggregationType: 'Sum',
});
await publishMeterDefinition(client, basePath, meter.id);

// Ingest events. Pass an Idempotency-Key to make batch replay safe.
await recordUsageEvents(
  client,
  basePath,
  {
    events: [
      {
        meterDefinitionId: meter.id,
        idempotencyKey: crypto.randomUUID(),
        quantity: 1,
        timestamp: new Date().toISOString(),
        metadata: null,
      },
    ],
  },
  crypto.randomUUID() // sent as the `Idempotency-Key` header
);

// Check quota state for gating / banners.
const quota = await checkMeteringQuota(client, basePath, meter.id);
if (quota.isExceeded) {
  // permission key for the manage surface: MeteringPermissions.Meters.Manage
}
```

> Every function takes the `AxiosInstance` first and the metering module `basePath`
> second; the specific sub-resource (`/meters`, `/events`, `/usage`, `/quota`,
> `/usage-aggregates`) is appended internally.

## Public API

| Symbol                          | Kind  | Purpose                                                     |
| ------------------------------- | ----- | ----------------------------------------------------------- |
| `MeterDefinitionResponse`       | type  | Projected meter DTO from the CRUD endpoints                 |
| `MeterDefinition`               | type  | Raw audited meter entity from the QueryEngine grid          |
| `MeterDefinitionCreateRequest`  | type  | `POST /meters` body (starts in `Draft`)                     |
| `MeterDefinitionUpdateRequest`  | type  | `PUT /meters/{id}` body (name / unit / description)         |
| `MeterEventRequest`             | type  | One usage event (meter id, idempotency key, quantity, ts)   |
| `RecordUsageRequest`            | type  | `POST /events` batch body                                   |
| `BackfillUsageRequest`          | type  | `POST /events/backfill` batch (timestamps ≤ 365 days old)   |
| `DeprecateEventRequest`         | type  | `POST /events/{id}/deprecate` reason body                   |
| `RecomputeUsageRequest`         | type  | `[from, to)` window for an aggregate rebuild                |
| `UsageAggregateResponse`        | type  | Projected period rollup from `GET /usage`                   |
| `UsageAggregate`                | type  | Raw aggregate entity from the QueryEngine grid              |
| `MeteringQuotaStatusResponse`   | type  | Quota state (current / limit / percent / exceeded)          |
| `AggregationType`               | type  | `Sum` / `Max` / `Count` / `Last` / `CountDistinct`          |
| `AggregationPeriod`             | type  | `Hourly` / `Daily` / `BillingPeriod`                        |
| `MeterLifecycleStatus`          | type  | `Draft` / `Published` / `Archived`                          |
| `MeterDefinitionPage`           | type  | `PagedResult<MeterDefinition>`                              |
| `UsageAggregatePage`            | type  | `PagedResult<UsageAggregate>`                               |
| `*ListParams`, `*Response` DTOs | type  | Backfill/recompute/deprecate responses + grid param aliases |
| `listActiveMeters`              | fn    | `GET /meters/active` — Published catalog (plain array)      |
| `getMeterDefinition`            | fn    | `GET /meters/{id}`                                          |
| `createMeterDefinition`         | fn    | `POST /meters` (creates a `Draft`)                          |
| `updateMeterDefinition`         | fn    | `PUT /meters/{id}` (Draft only)                             |
| `publishMeterDefinition`        | fn    | `POST /meters/{id}/publish` (`Draft → Published`)           |
| `archiveMeterDefinition`        | fn    | `POST /meters/{id}/archive` (`Published → Archived`)        |
| `recomputeMeterUsage`           | fn    | `POST /meters/{id}/recompute` over a window                 |
| `recordUsageEvents`             | fn    | `POST /events` (+ optional `Idempotency-Key`)               |
| `backfillUsageEvents`           | fn    | `POST /events/backfill` (+ optional `Idempotency-Key`)      |
| `deprecateMeterEvent`           | fn    | `POST /events/{id}/deprecate` (soft, audit-safe)            |
| `getUsageForPeriod`             | fn    | `GET /usage?meterId&periodStart&periodEnd` (404 if none)    |
| `checkMeteringQuota`            | fn    | `GET /quota/{meterId}`                                      |
| `listMeterDefinitions`          | fn    | `GET /meters` QueryEngine grid (paged, all statuses)        |
| `getMeterDefinitionsQueryMeta`  | fn    | `GET /meters/meta` — grid columns / filters / presets       |
| `listUsageAggregates`           | fn    | `GET /usage-aggregates` QueryEngine grid (paged)            |
| `getUsageAggregatesQueryMeta`   | fn    | `GET /usage-aggregates/meta` — grid metadata                |
| `MeteringPermissions`           | const | Backend permission keys (`Meters` / `Usage` / `Events`)     |
| `meteringConstraints`           | const | Validation constraints generated from `metering.json`       |

## Out of scope / caveats

- **Two meter shapes, by design.** `MeterDefinitionResponse` (CRUD projection) and
  `MeterDefinition` (raw QueryEngine entity, with `tenantId` + audit columns) are
  intentionally distinct. Pick the function that returns the shape your screen needs;
  do not cast between them.
- **Quota limits are tenant-plan state, not part of this contract.** `limit` /
  `percentUsed` are `null` when no plan limit applies; treat them as nullable and let
  `isExceeded` drive gating.
- **Idempotency is the caller's responsibility.** `recordUsageEvents` /
  `backfillUsageEvents` only forward the `Idempotency-Key` header when you pass a key;
  generate a fresh one per distinct batch to make retries safe. Each
  `MeterEventRequest` also carries its own per-event `idempotencyKey`.
- **Billing-sensitive operations are admin-gated.** Event deprecation and backfill map
  to `MeteringPermissions.Events.Manage` / `Events.Backfill` server-side because they
  can alter billable aggregates; the keys here only help the UI hide controls — the
  backend enforces.
- **Validation lives in the spec.** `meteringConstraints` is generated from
  `contracts/openapi/metering.json` (`MaxBatchSize`, `maxLength`, `uuid`/`date-time`
  formats, …) and consumed via `createConstraintsResolver` from
  `@granit/react-validation` — never hand-edit it.
- **No React here.** Hooks, query keys and providers live in
  [`@granit/react-metering`](../react-metering); admin pages/components in
  [`@granit/react-ui-metering`](../react-ui-metering).

## License

Apache-2.0
