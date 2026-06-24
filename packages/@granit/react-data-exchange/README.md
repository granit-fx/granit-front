# @granit/react-data-exchange

React hooks + providers for the Granit **data-exchange** module — bulk tabular
**export** (definition → fields/preset → job → poll → download) and **import**
(upload → preview/map → dry-run → execute → report → correction file). This is
the **React hooks layer**: it wraps the framework-agnostic Axios calls and DTOs
from [`@granit/data-exchange`](../data-exchange) in TanStack Query hooks, with
`ExportProvider` / `ImportProvider` (and a combined `DataExchangeProvider`) for
client/base-path/query-key configuration. It holds no rendering — list pages,
dialogs, the mapping table, and status badges live one layer up.

The split is three packages over the same .NET `Granit.DataExchange` backend
(contract: `contracts/openapi/data-exchange.json`):

- [`@granit/data-exchange`](../data-exchange) — framework-agnostic core: DTOs +
  Axios functions (`createExportJob`, `uploadImportFile`, `confirmMappings`, …)
  and the `DataExchangePermissions` catalog.
- `@granit/react-data-exchange` (this package) — React Query hooks + providers.
- [`@granit/react-ui-data-exchange`](../react-ui-data-exchange) — admin UI kit:
  export/import history pages, history column factories, status badge, filter
  bar, and the import-report dialog.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/data-exchange` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@granit/logger` — `createLogger`, used to report a failed auto-download.
- `@granit/utils`.
- `@tanstack/react-query` (`^5`), `react` (`^19`), and `react-dom` (`^19`).
- `@granit/query-engine` + `@granit/react-query-engine` (**optional**) — only for
  the `PagedResult` job-list shapes and the `/testing` query-metadata handlers.
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-data-exchange/testing`
  subpath.

## Quick start

Wire a provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it. `DataExchangeProvider`
mounts both `ExportProvider` and `ImportProvider` from one shared config and
auto-suffixes `queryKeyPrefix` with `'export'` / `'import'` so keys never collide.

```tsx
import { DataExchangeProvider, useExportJob } from '@granit/react-data-exchange';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <DataExchangeProvider config={{ client: useGranitClient() }}>
      {children}
    </DataExchangeProvider>
  );
}

function ExportButton() {
  // create job → poll status → auto-download the file on completion.
  const { startExport, isExporting, error } = useExportJob();

  if (error) return <p role="alert">{error.message}</p>;
  return (
    <button
      type="button"
      disabled={isExporting}
      onClick={() => startExport({ definitionName: 'Admin.CountryExport', format: 'csv' })}
    >
      {isExporting ? 'Exporting…' : 'Export CSV'}
    </button>
  );
}
```

The import flow is a multi-step state machine driven by `useImportJob`
(orchestration) and `useImportPreview` (headers, suggested mappings, dry-run):

```tsx
import { useImportJob, useImportPreview } from '@granit/react-data-exchange';

function ImportWizard() {
  const { upload, confirmMap, execute, job, isTerminal } = useImportJob();
  const { preview, headers, mappings, updateMapping, dryRun } = useImportPreview();

  // 1. upload → 2. preview(job.id) → edit mappings → 3. confirmMap(mappings) →
  // 4. (optional) dryRun(job.id) → 5. execute() → poll until isTerminal.
  // confirmMap re-reads the job to attach the fresh concurrency stamp itself.
  return (
    <ImportSteps
      onUpload={(file) => upload(file, 'Admin.CountryExport')}
      onPreview={() => job && preview(job.id)}
      headers={headers}
      mappings={mappings}
      onRemap={updateMapping}
      onConfirm={() => confirmMap(mappings)}
      onExecute={execute}
      done={isTerminal}
    />
  );
}
```

## Public API

| Symbol                   | Kind     | Purpose                                                                  |
| ------------------------ | -------- | ------------------------------------------------------------------------ |
| `DataExchangeProvider`   | provider | Mounts both child providers from one shared config (prefix auto-split)   |
| `ExportProvider`         | provider | Supplies client / base path / query-key prefix to the export hooks       |
| `ImportProvider`         | provider | Supplies client / base path / query-key prefix to the import hooks       |
| `useExportConfig`        | hook     | Read the resolved export config; throws outside an `ExportProvider`      |
| `useImportConfig`        | hook     | Read the resolved import config; throws outside an `ImportProvider`      |
| `useExportDefinitions`   | hook     | `GET .../metadata/definitions` — registered export definitions           |
| `useExportFields`        | hook     | `GET .../definitions/{name}/fields` — exportable fields for a definition |
| `useExportPresets`       | hook     | `presets` query + `save` / `remove` mutations for a definition           |
| `useExportJob`           | hook     | Create job → poll status → auto-download the file on completion          |
| `useExportJobs`          | hook     | `GET .../export/jobs` — paginated/filterable export-job history          |
| `useImportJob`           | hook     | Upload → confirm mappings → execute → cancel; polls to a terminal state  |
| `useImportPreview`       | hook     | Preview headers/rows, editable mappings, dry-run validation              |
| `useImportReport`        | hook     | Fetch the execution report + download the correction file                |
| `useImportJobs`          | hook     | `GET .../import/jobs` — paginated/filterable import-job history          |
| `buildExportQueryKey`    | fn       | Export query-key factory honoring the configured `queryKeyPrefix`        |
| `buildImportQueryKey`    | fn       | Import query-key factory honoring the configured `queryKeyPrefix`        |
| `ExportConfig`           | type     | `ExportProvider` input (optional client / basePath / queryKeyPrefix)     |
| `ImportConfig`           | type     | `ImportProvider` input (optional client / basePath / queryKeyPrefix)     |
| `DataExchangeConfig`     | type     | Shared input for `DataExchangeProvider`                                  |
| `*ProviderProps`         | type     | `{ config?, children }` for each provider                                |
| `UseExportJobReturn`     | type     | `{ startExport, job, isExporting, isCreating, error, reset }`            |
| `UseExportPresetsReturn` | type     | `{ presets, save, remove }` query + mutations                            |
| `UseImportJobReturn`     | type     | `{ upload, confirmMap, execute, cancel, job, isTerminal, … }`            |
| `UseImportPreviewReturn` | type     | `{ preview, headers, mappings, updateMapping, dryRun, … }`               |
| `UseImportReportReturn`  | type     | `{ report, downloadCorrection }`                                         |

DTO types (`CreateExportJobRequest`, `ImportColumnMapping`, `ImportReportResponse`,
the job/status unions, …) are re-exported by the core
[`@granit/data-exchange`](../data-exchange), not this package — import them from
there.

`./testing` subpath (requires the optional `msw` peer): `createDataExchangeHandlers`
(stateful MSW handlers covering the full export/import lifecycle; configurable
metadata / import / export-jobs base paths) plus the `exportJobQueryMetadata` /
`importJobQueryMetadata` query-metadata payloads and the `mockExportHistory` /
`mockImportHistory` fixtures.

## Caveats

- **Concurrency stamp on confirm.** The preview transition regenerates the
  optimistic-concurrency stamp, so `confirmMap` re-reads the job to attach the
  current stamp before `PUT .../mappings` (avoids a `409`). Callers pass only the
  mappings; never cache and resend a stale stamp.
- **Auto-download side effect.** `useExportJob` (on completion) and
  `useImportReport.downloadCorrection` create an object URL and synthesize an
  `<a download>` click. This requires a DOM and a user-gesture-adjacent context;
  it is a no-op outside the browser. A failed export download is logged via
  `@granit/logger` and surfaced through `error`, not thrown.
- **Terminal-state polling.** Status polling runs every 2s until a terminal state
  (`Completed` / `Failed` for export; plus `PartiallyCompleted` / `Cancelled` for
  import) and then stops. `PartiallyCompleted` is terminal — inspect the report's
  `failedRows` / `rowErrors` rather than treating it as success.

## Out of scope

- **Rendering** — history pages, the mapping table, status badge, filter bar, and
  the import-report dialog live in
  [`@granit/react-ui-data-exchange`](../react-ui-data-exchange). This package is
  headless.
- **DTOs, HTTP transport, and permissions** — owned by
  [`@granit/data-exchange`](../data-exchange) (mirror of `Granit.DataExchange`,
  including the `DataExchangePermissions` catalog); hooks here only adapt the
  calls to React Query.
- **Authentication** — the already-authenticated Axios client comes from
  `@granit/api-client` and the BFF; this package consumes it.

## License

Apache-2.0
