# @granit/background-jobs

Framework-agnostic **background-job** SDK — the TypeScript counterpart of the
.NET `Granit.BackgroundJobs` module (`granit-dotnet/src/Granit.BackgroundJobs`,
contract mirrored from `contracts/openapi/background-jobs.json`).

It exposes the status type, the HTTP client and the permission constants needed
to inspect and operate the scheduled-job runner from any client — React, React
Native, a CLI, tests. It holds **no** React, DOM or Node-only dependency. The
React Query layer lives in
[`@granit/react-background-jobs`](../react-background-jobs); the admin feature
kit (list page, cards, badges, cron rendering) lives in
[`@granit/react-ui-background-jobs`](../react-ui-background-jobs).

A background job is a cron-scheduled task tracked by name. This SDK reads its
status (schedule, last/next run, failure counters, dead-letter depth) and drives
the three operator actions: **pause**, **resume**, **trigger** (run now).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
these peers:

- `@granit/api-client` — the centralized Axios instance (CSRF, auth, tenant).
- `@granit/query-engine` — `PagedResult` / `PaginationParams` envelopes.
- `@granit/types` — branded `ISODateString`.

## Quick start

```ts
import {
  listBackgroundJobs,
  getBackgroundJob,
  pauseJob,
  resumeJob,
  triggerJob,
  BackgroundJobsPermissions,
} from '@granit/background-jobs';

// `basePath` is the jobs collection root — it matches the backend route.
const basePath = '/background-jobs/jobs';

// 1. Paginated list of every registered job and its current state.
const page = await listBackgroundJobs(client, basePath, { page: 1, pageSize: 20 });

// 2. Inspect one job by name.
const job = await getBackgroundJob(client, basePath, 'cleanup-stale-sessions');
const failing = job.consecutiveFailures > 0; // job.lastError holds the detail

// 3. Operator actions (require BackgroundJobsPermissions.Jobs.Manage server-side).
await pauseJob(client, basePath, job.jobName);
await resumeJob(client, basePath, job.jobName);
await triggerJob(client, basePath, job.jobName); // run-now, out of schedule
```

## Public API

| Symbol                      | Kind  | Purpose                                                |
| --------------------------- | ----- | ------------------------------------------------------ |
| `BackgroundJobStatus`       | type  | One job's schedule, run timestamps, failure counters   |
| `BackgroundJobListParams`   | type  | List query params (alias of `PaginationParams`)        |
| `listBackgroundJobs`        | fn    | `GET {basePath}` → `PagedResult<BackgroundJobStatus>`  |
| `getBackgroundJob`          | fn    | `GET {basePath}/{name}` → `BackgroundJobStatus`        |
| `pauseJob`                  | fn    | `POST {basePath}/{name}/pause`                         |
| `resumeJob`                 | fn    | `POST {basePath}/{name}/resume`                        |
| `triggerJob`                | fn    | `POST {basePath}/{name}/trigger` (run now)             |
| `BackgroundJobsPermissions` | const | Permission keys: `Jobs.Read`, `Jobs.Manage`            |

`BackgroundJobStatus` fields mirror the .NET DTO one-for-one: `jobName`,
`cronExpression`, `isEnabled`, `lastExecutedAt` / `nextExecutionAt`
(`ISODateString | null`), `consecutiveFailures`, `deadLetterCount`, and
`lastError` (`string | null`). All fields are `readonly`.

## Security

The two permission keys map to the backend's
`Granit.BackgroundJobs.Endpoints.Permissions.BackgroundJobsPermissions`:

- `BackgroundJobs.Jobs.Read` — list and view jobs.
- `BackgroundJobs.Jobs.Manage` — list, detail, pause, resume, trigger.

These constants exist for client-side UX gating (hiding controls the user
cannot use). They are **not** a security boundary — every endpoint re-checks
authorization on the .NET backend. `pause`, `resume` and `trigger` always reach
the server, which is the authoritative gate.

## Out of scope

- **Job scheduling / registration** — jobs are declared and scheduled
  server-side (`Granit.BackgroundJobs`); this SDK only observes and operates
  already-registered jobs. It cannot create, delete or re-schedule a job, and
  `cronExpression` is read-only.
- **Dead-letter inspection / replay** — `deadLetterCount` surfaces the depth,
  but the failed-message payloads are not exposed by this contract.
- **Cron-expression rendering** — humanizing `cronExpression` (cronstrue,
  locale mapping) lives in
  [`@granit/react-ui-background-jobs`](../react-ui-background-jobs), not here.

## License

Apache-2.0
