# @granit/data-exchange

Module-agnostic **tabular import/export** SDK — the framework-level TypeScript
counterpart of the .NET `Granit.DataExchange` module. It mirrors the
`contracts/openapi/data-exchange.json` contract: DTO types, the Axios HTTP
client, and the permission catalog needed to drive bulk export and import flows
from any client.

This is the **framework-agnostic core**: it holds no React, DOM or Node-only
dependency — only `AxiosInstance` from `@granit/api-client` and the
`PagedResult` / `PaginationParams` shapes from `@granit/query-engine`. The React
Query hooks, providers and query-key factories live in
[`@granit/react-data-exchange`](../react-data-exchange); the shadcn-based admin
feature kit (list pages, dialogs, mapping table, history columns) lives in
[`@granit/react-ui-data-exchange`](../react-ui-data-exchange).

Two flows share one base path:

- **Export** — list definitions → pick fields (or a saved preset) → create a job
  → poll status → download the generated file.
- **Import** — upload a file → preview headers + suggested column mappings →
  confirm mappings → dry-run (validate, no persist) or execute (async) → read the
  report → download the error-rows-only correction file.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. A consumer
must declare these peers (all `workspace:*`):

- `@granit/api-client` — the centralized Axios client (CSRF, auth, tenant
  interceptors); every call takes an injected `AxiosInstance`.
- `@granit/query-engine` — `PagedResult<T>` / `PaginationParams` for the
  job-listing endpoints.
- `@granit/utils`.

## Quick start

Every function takes the resolved `AxiosInstance` plus a `basePath` — the
module's collection root (e.g. `/api/v1/parties`), which encodes the entity, so
the same calls work for any export/import-enabled aggregate.

```ts
import {
  createExportJob,
  downloadExportFile,
  getExportJobStatus,
  uploadImportFile,
  previewImport,
  confirmMappings,
  dryRunImport,
  executeImport,
} from '@granit/data-exchange';

const basePath = '/api/v1/parties';

// --- Export: create a job, poll, download ---------------------------------
const job = await createExportJob(client, basePath, {
  definitionName: 'Party',
  format: 'xlsx',
  selectedFields: ['displayName', 'email'],
  includeIdForImport: true,
  sort: null,
  filter: null,
  presets: null,
  search: null,
});

const status = await getExportJobStatus(client, basePath, job.id);
if (status.status === 'Completed') {
  const { blob, fileName } = await downloadExportFile(client, basePath, job.id);
  // → trigger a browser download from the Blob + Content-Disposition file name
}

// --- Import: upload, preview, map, execute ---------------------------------
const imported = await uploadImportFile(client, basePath, file, 'Party');
const preview = await previewImport(client, basePath, imported.id);

await confirmMappings(client, basePath, imported.id, {
  mappings: preview.suggestions, // accept the auto-suggested column → property map
  concurrencyStamp: imported.concurrencyStamp,
});

const report = await dryRunImport(client, basePath, imported.id); // validate only
if (report.failedRows === 0) {
  await executeImport(client, basePath, imported.id); // async persist
}
```

## Public API

### Export

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `ExportDefinitionResponse` | type | Registered export definition (entity, supported formats) |
| `ExportFieldResponse` | type | One exportable field (property path, CLR type, header, order) |
| `ExportField` | type | **Deprecated** alias of `ExportFieldResponse` |
| `ExportJobResponse` | type | Export job state (status, row count, file name, concurrency stamp) |
| `ExportJobStatus` | type | `'Queued' \| 'Exporting' \| 'Completed' \| 'Failed'` |
| `CreateExportJobRequest` | type | `POST .../export/jobs` body (fields, format, filter, sort, search) |
| `ExportPresetResponse` | type | A saved field-selection preset for a definition |
| `SaveExportPresetRequest` | type | `POST .../metadata/presets` body |
| `ExportJobListParams` | type | `PaginationParams & { status? }` for job listing |
| `listExportDefinitions` | fn | `GET {basePath}/metadata/definitions` |
| `getExportFields` | fn | `GET {basePath}/metadata/definitions/{name}/fields` |
| `createExportJob` | fn | `POST {basePath}/export/jobs` |
| `getExportJobStatus` | fn | `GET {basePath}/export/jobs/{jobId}` |
| `listExportJobs` | fn | `GET {basePath}/export/jobs` → `PagedResult<ExportJobResponse>` |
| `downloadExportFile` | fn | `GET {basePath}/export/jobs/{jobId}/download` → `{ blob, fileName }` |
| `listExportPresets` | fn | `GET {basePath}/metadata/presets/{definitionName}` |
| `saveExportPreset` | fn | `POST {basePath}/metadata/presets` |
| `deleteExportPreset` | fn | `DELETE {basePath}/metadata/presets/{definitionName}/{presetName}` |

### Import

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `ImportJobResponse` | type | Import job state (entity, file metadata, status, concurrency stamp) |
| `ImportJobStatus` | type | `Created`…`Completed` / `PartiallyCompleted` / `Failed` / `Cancelled` |
| `ImportColumnMapping` | type | Source column → target property mapping with a `confidence` |
| `MappingConfidence` | type | `'Manual' \| 'Saved' \| 'Exact' \| 'Fuzzy' \| 'Semantic'` |
| `ImportFieldMetadata` | type | Target field descriptor (path, CLR type, display name, `isRequired`) |
| `ImportPreviewResponse` | type | Parsed headers, sample rows, mapping suggestions, field metadata |
| `ConfirmMappingsRequest` | type | `PUT .../mappings` body (mappings + concurrency stamp) |
| `ImportReportResponse` | type | Per-job execution report (row counts, duration, errors) |
| `ImportRowError` | type | One failed row (number, kind, error codes, message) |
| `ImportRowErrorKind` | type | `'Conversion' \| 'Validation' \| 'Persistence' \| 'Identity'` |
| `ImportJobListParams` | type | `PaginationParams & { status? }` for job listing |
| `uploadImportFile` | fn | `POST {basePath}/import/jobs` (multipart: file + definition) |
| `previewImport` | fn | `POST {basePath}/import/{jobId}/preview` |
| `confirmMappings` | fn | `PUT {basePath}/import/{jobId}/mappings` (concurrency-checked) |
| `dryRunImport` | fn | `POST {basePath}/import/{jobId}/dry-run` → `ImportReportResponse` |
| `executeImport` | fn | `POST {basePath}/import/{jobId}/execute` (async persist) |
| `getImportJob` | fn | `GET {basePath}/import/{jobId}` |
| `getImportReport` | fn | `GET {basePath}/import/{jobId}/report` |
| `listImportJobs` | fn | `GET {basePath}/import/jobs` → `PagedResult<ImportJobResponse>` |
| `cancelImportJob` | fn | `DELETE {basePath}/import/{jobId}` |
| `downloadCorrectionFile` | fn | `GET {basePath}/import/{jobId}/correction-file` → `{ blob, fileName }` |

### Permissions

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `DataExchangePermissions` | const | Permission string catalog mirroring the .NET backend resource |

`DataExchangePermissions` splits read vs. execute per resource:
`Imports.Read` / `Imports.Execute` and `Exports.Read` / `Exports.Execute`.

## Caveats

- **Concurrency.** `ImportJobResponse` / `ExportJobResponse` carry a
  `concurrencyStamp`. Echo the last-read stamp in `ConfirmMappingsRequest`; a
  mismatch yields HTTP 409 (lost-update protection). Never use `If-Match`.
- **Permission checks are a UX hint, not enforcement.** The backend re-checks
  `DataExchangePermissions` on every endpoint; use the catalog to hide controls,
  not as a security boundary.
- **Download safety.** `downloadExportFile` / `downloadCorrectionFile` return a
  `Blob` plus the file name parsed from `Content-Disposition`. Treat the returned
  name as untrusted input — never interpolate it into a DOM script sink; pass it
  to an `<a download>` / object-URL flow.
- **`ExportField` is deprecated** — it is a kept alias of `ExportFieldResponse`
  (renamed to mirror the .NET DTO) and will be removed in a future release.
- **No React, no hooks here.** Caching, polling, query keys and providers belong
  to [`@granit/react-data-exchange`](../react-data-exchange); the admin screens
  live in [`@granit/react-ui-data-exchange`](../react-ui-data-exchange).

## License

Apache-2.0
