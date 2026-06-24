# @granit/react-background-jobs

React Query hooks and a config provider for **monitoring and steering recurring
background jobs** — the headless React layer over the framework-agnostic
[`@granit/background-jobs`](../background-jobs) core, which mirrors the
`Granit.BackgroundJobs` .NET contract (`contracts/openapi/background-jobs.json`).

This package sits in the middle of the three-package split: the
[`@granit/background-jobs`](../background-jobs) core holds the DTOs, Axios calls
and permission constants; **this package** wraps those calls in `@tanstack/react-query`
hooks plus a `BackgroundJobsProvider` that resolves the Axios client and base path;
and [`@granit/react-ui-background-jobs`](../react-ui-background-jobs) composes these
hooks into the admin monitoring page (list + kanban, status badges, per-job actions,
cron rendering). Keep view code out of this layer — it is headless by design.

Jobs are addressed by **name**, not by id, and the list/detail queries poll every
15 seconds to reflect live scheduler state. Background jobs are **not** a query-engine
resource: the backend exposes plain `page`/`pageSize` pagination with no `/meta`,
filtering or sorting endpoint.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
for app consumption. A consumer must declare these peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) the provider injects into every call.
- `@granit/background-jobs` — the core DTOs and HTTP calls these hooks wrap.
- `@granit/react-api-client` — provides `<GranitClientProvider>` / the optional
  ambient client the provider falls back to when `config.client` is absent.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).

Optional peers: `@granit/query-engine` (the `PagedResult` / pagination types) and
`msw` (only for the `/testing` MSW handlers).

## Quick start

```tsx
import { GranitClientProvider } from '@granit/react-api-client';
import {
  BackgroundJobsProvider,
  useBackgroundJobs,
  usePauseJob,
  useResumeJob,
  useTriggerJob,
} from '@granit/react-background-jobs';

function App() {
  return (
    <GranitClientProvider client={apiClient}>
      {/* basePath defaults to /api/v1/background-jobs; client falls back to the ambient one */}
      <BackgroundJobsProvider config={{}}>
        <JobsTable />
      </BackgroundJobsProvider>
    </GranitClientProvider>
  );
}

function JobsTable() {
  const { data } = useBackgroundJobs({ page: 1, pageSize: 20 });
  const { mutate: pause } = usePauseJob();
  const { mutate: resume } = useResumeJob();
  const { mutate: trigger } = useTriggerJob();

  return (
    <table>
      <tbody>
        {data?.items.map((job) => (
          <tr key={job.jobName}>
            <td>{job.jobName}</td>
            <td>{job.cronExpression}</td>
            <td>{job.isEnabled ? 'enabled' : 'paused'}</td>
            <td>
              <button onClick={() => trigger(job.jobName)}>Run now</button>
              {job.isEnabled ? (
                <button onClick={() => pause(job.jobName)}>Pause</button>
              ) : (
                <button onClick={() => resume(job.jobName)}>Resume</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

`useBackgroundJobs` returns a `PagedResult<BackgroundJobStatus>` (`items`,
`totalCount`, `hasMore`). Use `useBackgroundJob(name)` for a single job; it stays
disabled while `name` is empty. Every mutation invalidates `backgroundJobKeys.all`
on success.

## Public API

| Symbol                         | Kind     | Purpose                                                  |
| ------------------------------ | -------- | -------------------------------------------------------- |
| `BackgroundJobsProvider`       | provider | Resolves the Axios client + base path into context       |
| `useBackgroundJobsConfig`      | hook     | Reads the `ResolvedBackgroundJobsConfig` from context    |
| `useBackgroundJobs`            | hook     | Paginated list of all jobs; polls 15s (`GET .../jobs`)   |
| `useBackgroundJob`             | hook     | Single job by name; polls 15s, disabled when empty       |
| `usePauseJob`                  | hook     | Pause mutation (`POST .../jobs/{name}/pause`)            |
| `useResumeJob`                 | hook     | Resume mutation (`POST .../jobs/{name}/resume`)          |
| `useTriggerJob`                | hook     | Manual-run mutation (`POST .../jobs/{name}/trigger`)     |
| `backgroundJobKeys`            | const    | Query key factory (`all` / `list(params)` / `job(name)`) |
| `BackgroundJobsConfig`         | type     | Provider input: optional `client` and `basePath`         |
| `ResolvedBackgroundJobsConfig` | type     | `BackgroundJobsConfig` with a guaranteed `client`        |
| `BackgroundJobsProviderProps`  | type     | `{ config, children }` for the provider                  |

### `/testing` subpath

Re-exported from `@granit/react-background-jobs/testing` for unit/integration tests:

| Symbol                        | Kind  | Purpose                                                   |
| ----------------------------- | ----- | --------------------------------------------------------- |
| `createBackgroundJobHandlers` | fn    | Stateful MSW handlers for the five job routes             |
| `mockBackgroundJobs`          | const | Seed `BackgroundJobStatus[]` the handlers mutate in place |

The handlers are stateful: pause/resume/trigger calls mutate `mockBackgroundJobs`,
so subsequent GET calls reflect the new state. Import them, never hand-roll the DTOs.

## Out of scope / caveats

- **Permission constants live in the core, not here.** Use
  `BackgroundJobsPermissions` from [`@granit/background-jobs`](../background-jobs)
  (`Jobs.Read` for monitoring, `Jobs.Manage` for pause/resume/trigger). As with any
  client-side check, this gates UX only — the `Granit.BackgroundJobs` backend
  re-enforces every call. Never ship the action buttons as the security boundary.
- **No query-engine surface.** Despite the optional `@granit/query-engine` peer
  (used only for the `PagedResult` / `PaginationParams` types), there is no `/meta`,
  filter or sort endpoint. Do not wire these hooks into a `MapGranitQuery` grid.
- **Polling, not real-time.** Status freshness comes from the 15-second
  `refetchInterval`, not an SSE/WebSocket transport. There is no live push channel.
- **Headless only.** No components, locales or styles ship here — those belong to
  [`@granit/react-ui-background-jobs`](../react-ui-background-jobs).

## License

Apache-2.0
