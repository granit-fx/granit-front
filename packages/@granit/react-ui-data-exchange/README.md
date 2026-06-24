# @granit/react-ui-data-exchange

Admin **UI feature kit** for the Granit **Data Exchange** module — the import and
export wizards, the import/export history pages, the shared history column
factories, a status badge, the history filter bar and the import-report dialog.
This is the **rendering** layer: it composes the headless
[`@granit/react-data-exchange`](../react-data-exchange) (TanStack Query hooks +
`ExportProvider`/`ImportProvider`) with the foundation UI packages
([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit)). It bakes in no Axios
client — the client is resolved from a `GranitClientProvider` higher in the host
tree and handed to the headless providers.

The split is three packages over the same .NET `Granit.DataExchange` backend
(contract: `contracts/openapi/data-exchange.json`):

- [`@granit/data-exchange`](../data-exchange) — framework-agnostic core: DTOs +
  Axios functions (`downloadExportFile`, the import/export job calls, the
  `ExportJobStatus` / `ImportJobStatus` / `MappingConfidence` unions).
- [`@granit/react-data-exchange`](../react-data-exchange) — React Query hooks +
  providers (`ExportProvider`, `ImportProvider`, `useExportJobs`,
  `useImportJob`, `useImportPreview`, `useImportReport`, …).
- `@granit/react-ui-data-exchange` (this package) — the admin UI feature kit.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/data-exchange` — core DTOs + the `downloadExportFile` call used by the
  export history page.
- `@granit/react-data-exchange` — the headless providers + hooks this kit renders.
- `@granit/react-api-client` — `useGranitClient`, the Axios client resolved from a
  `GranitClientProvider` in the host tree.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter` (all labels
  and dates are localized; no hard-coded strings on the page surfaces).
- `@granit/react-ui` — shadcn/ui primitives (`Dialog`, `Select`, `Badge`,
  `Spinner`, …).
- `@granit/react-ui-admin-kit` — `QueryDataTable`, the paginated history grid.
- `@granit/utils` — `cn` class merge helper.
- `@tanstack/react-table` (`^8.21`) — `ColumnDef` for the column factories.
- `lucide-react` (`^1.21`) — action/status icons.
- `react` and `react-dom` (`^19`).

## Quick start

Mount the page components under a router; each one wires its own
`ExportProvider` / `ImportProvider` internally, so the only host requirement is a
`GranitClientProvider` above them and the registered i18n bundle.

```tsx
import {
  ExportListPage,
  ImportListPage,
  dataExchangeTranslationsEn,
} from '@granit/react-ui-data-exchange';
import { Route, Routes } from 'react-router-dom';

// Register the DataExchange.* strings once at app bootstrap. Common.* keys
// (Save/Cancel/Close/…) are app-global and assumed already present.
i18n.addResourceBundle('en', 'translation', dataExchangeTranslationsEn, true, true);

function DataExchangeRoutes() {
  return (
    <Routes>
      <Route path="export" element={<ExportListPage />} />
      <Route path="import" element={<ImportListPage />} />
    </Routes>
  );
}
```

The export and import dialogs drive the full job lifecycle from a toolbar. Pair an
`ExportButton` with an `ExportDialog` (field selection, format, presets, roundtrip
toggle), or an `ImportButton` with the four-step `ImportDialog` (upload → map →
execute → report):

```tsx
import {
  ExportButton,
  ExportDialog,
  ImportButton,
  ImportDialog,
} from '@granit/react-ui-data-exchange';
import { ExportProvider, ImportProvider } from '@granit/react-data-exchange';
import { useGranitClient } from '@granit/react-api-client';
import { useState } from 'react';

function PartiesToolbar() {
  const client = useGranitClient();
  const basePath = '/api/v1/data-exchange';
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <ExportProvider config={{ client, basePath }}>
      <ImportProvider config={{ client, basePath }}>
        <ExportButton onExport={() => setExportOpen(true)} />
        <ImportButton onImport={() => setImportOpen(true)} />

        <ExportDialog
          definitionName="Party"
          open={exportOpen}
          onOpenChange={setExportOpen}
        />
        <ImportDialog
          definitionName="Party"
          open={importOpen}
          onOpenChange={setImportOpen}
        />
      </ImportProvider>
    </ExportProvider>
  );
}
```

To build a bespoke history grid, compose the column factories instead of using the
page components. They are generic over any row satisfying `{ createdAt,
definitionName, status }`:

```tsx
import {
  createJobDateColumn,
  createJobEntityColumn,
  createJobStatusColumn,
  createJobActionColumn,
} from '@granit/react-ui-data-exchange';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { Eye } from 'lucide-react';

function useImportColumns(onViewReport: (job: ImportJobResponse) => void) {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  return [
    createJobDateColumn<ImportJobResponse>(t, formatDateTime),
    createJobEntityColumn<ImportJobResponse>(t),
    createJobStatusColumn<ImportJobResponse>(t),
    createJobActionColumn<ImportJobResponse>({
      icon: <Eye className="size-4" />,
      ariaLabel: t('DataExchange.ViewReport'),
      onAction: onViewReport,
    }),
  ];
}
```

## Public API

| Symbol                       | Kind      | Purpose                                                       |
| ---------------------------- | --------- | ------------------------------------------------------------ |
| `ExportListPage`             | component | Self-wiring export history page (provider + filters + grid)   |
| `ImportListPage`             | component | Self-wiring import history page (+ filters, grid, report)     |
| `ExportButton`               | component | Toolbar button that triggers an export (`onExport`)           |
| `ExportDialog`               | component | Field/format/preset/roundtrip config + start + progress      |
| `ImportButton`               | component | Toolbar button that triggers an import (`onImport`)           |
| `ImportDialog`               | component | Four-step wizard: upload, map, execute, report               |
| `HistoryFilters`             | component | Status filter bar; `mode` picks import vs export status set   |
| `ImportReportDialog`         | component | Read-only import report modal (counts, errors, correction)    |
| `JobStatusBadge`             | component | Localized status pill for an import/export job status         |
| `ColumnMappingTable`         | component | Source-to-target property mapping editor with previews       |
| `FileDropZone`               | component | Drag-and-drop file picker with click-to-browse fallback       |
| `ImportRowErrors`            | component | Table of per-row import errors (`maxDisplay` cap, default 50) |
| `ImportReportSummary`        | component | Result card: total/succeeded/failed/skipped/inserted/updated  |
| `MappingConfidenceBadge`     | component | Badge for a mapping's `MappingConfidence` level               |
| `createExportHistoryColumns` | fn        | `ColumnDef[]` for the export grid (+ format, rows, download)  |
| `createImportHistoryColumns` | fn        | `ColumnDef[]` for the import grid (+ file name, view-report)  |
| `createJobDateColumn`        | fn        | Shared created-at column (generic over the job row)           |
| `createJobEntityColumn`      | fn        | Shared definition-name ("entity") column                      |
| `createJobStatusColumn`      | fn        | Shared `JobStatusBadge` column                                |
| `createJobActionColumn`      | fn        | Trailing action column (`onAction`, optional `visible`)       |
| `DEFAULT_PAGE_SIZE`          | const     | `20` — history grid page size                                 |
| `IMPORT_STATUSES`            | const     | Ordered `ImportJobStatus[]` for the import filter dropdown    |
| `IMPORT_TERMINAL_STATUSES`   | const     | Import statuses with no further transitions                   |
| `EXPORT_STATUSES`            | const     | Ordered `ExportJobStatus[]` for the export filter dropdown    |
| `EXPORT_TERMINAL_STATUSES`   | const     | Export statuses with no further transitions                   |
| `dataExchangeTranslationsEn` | const     | English `DataExchange.*` i18next bundle (flat keys)           |
| `dataExchangeTranslationsFr` | const     | French `DataExchange.*` i18next bundle (flat keys)            |
| `DataExchangeTranslations`   | type      | Shape of the `…En` bundle (the translation-key contract)      |

## Out of scope / caveats

- **Headless data layer.** Job fetching, polling, mutations and the
  `ExportProvider` / `ImportProvider` themselves live in
  [`@granit/react-data-exchange`](../react-data-exchange); DTOs, the
  `downloadExportFile` call and the status/confidence unions live in
  [`@granit/data-exchange`](../data-exchange). This package only renders them.
- **i18n is registration-only.** The page surfaces, dialogs, columns and badges
  read `DataExchange.*` keys via `useTranslation`; the host must register
  `dataExchangeTranslationsEn` / `dataExchangeTranslationsFr` (`translation` ns).
  `Common.*` keys (Save/Cancel/Close) are app-global and assumed present. A few
  leaf helpers (`ImportRowErrors`, `ImportReportSummary`,
  `MappingConfidenceBadge`) currently render literal English labels rather than
  i18n keys.
- **No authorization gating.** These are presentation components; they do not
  check permissions. Gate the toolbar buttons and routes with
  [`@granit/react-authorization`](../react-authorization) and rely on the backend
  to enforce — every `Granit.DataExchange` endpoint re-checks authorization.
- **Client-driven download.** The export history page streams the file blob via
  `downloadExportFile` and triggers a browser download through a transient
  object-URL anchor (`URL.createObjectURL` → `<a download>` →
  `revokeObjectURL`); the file name falls back to the job's `fileName` then
  `export-{id}`. No write to a DOM script sink — no Trusted-Types/CSP policy is
  required for this package.
- **`QueryDataTable` page-size is fixed.** The history pages render with
  `DEFAULT_PAGE_SIZE` and a no-op `onPageSizeChange`; only the page index is
  user-controllable.

## License

Apache-2.0
