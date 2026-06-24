# @granit/react-ui-blob-storage

Admin UI feature kit for the Granit **Blob Storage** module — a query-driven
blobs list (status pills, human-readable size, created-at, per-row download /
delete) plus the orphan-cleanup confirmation and the crypto-shred delete dialog.

This is the **react-ui admin feature kit** layer: it renders. It composes the
headless [`@granit/react-blob-storage`](../react-blob-storage) (provider + Query
hooks) with the foundation UI packages
([`@granit/react-ui`](../react-ui), [`@granit/react-ui-kit`](../react-ui-admin-kit)),
drives the grid through [`@granit/react-query-engine`](../react-query-engine),
and gates every management action with
[`@granit/react-authorization`](../react-authorization) `usePermissions`.

The split is four packages over the same .NET `Granit.BlobStorage` backend
(contract: `contracts/openapi/blob-storage.json`):

- [`@granit/blob-storage`](../blob-storage) — framework-agnostic core: DTOs,
  Axios functions (`getBlob`, `cleanupOrphans`, …), `BlobStoragePermissions`.
- [`@granit/react-blob-storage`](../react-blob-storage) — React Query hooks +
  `BlobStorageProvider`, plus the upload field / image components.
- `@granit/react-ui-blob-storage` (this package) — admin UI: blobs list page +
  delete / cleanup dialogs.
- [`@granit/react-ai-chat-blob-storage`](../react-ai-chat-blob-storage) — glue
  binding blob attachments into the AI chat surface.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/blob-storage` — core DTOs (`BlobDescriptorListItem`, `BlobStatus`)
  and `BlobStoragePermissions`.
- `@granit/react-blob-storage` — the headless hooks (`useDeleteBlob`,
  `useDownloadUrl`, `useCleanupOrphans`) and the `BlobStorageProvider` that must
  be mounted higher in the tree.
- `@granit/react-authorization` — `usePermissions`, gating download / delete /
  cleanup on `BlobStorage.Administration.Manage`.
- `@granit/react-localization` — `useTranslation`, `useDateFormatter`.
- `@granit/query-engine` and `@granit/react-query-engine` — the `QueryConfig` /
  `QueryProvider` / `useQueryEndpoint` that drive the list grid.
- `@granit/react-ui` and `@granit/react-ui-kit` — the shadcn-derived
  primitives and the `QueryEndpointDataTable` / filter-sort-group toolbar.
- `@granit/logger` — `createLogger` (action handlers log on failure).
- `@granit/types` — shared base types.
- `@tanstack/react-table` (`^8.21`), `lucide-react` (`^1.21`), `react` /
  `react-dom` (`^19`).

## Quick start

Register the i18n bundle, ensure a `BlobStorageProvider` (from
`@granit/react-blob-storage`) is mounted above the route, and render
`BlobListPage`. It owns its own `QueryProvider` internally — no extra wiring for
the grid.

```tsx
import { BlobStorageProvider } from '@granit/react-blob-storage';
import { BlobListPage, blobStorageTranslationsEn } from '@granit/react-ui-blob-storage';
import { useGranitClient } from '@granit/react-api-client';
import i18n from './i18n';

// Flat `BlobStorage.*` keys — register with key/namespace separators disabled
// so the dotted keys are looked up verbatim.
i18n.addResourceBundle('en', 'translation', blobStorageTranslationsEn, true, true);

function BlobStorageRoute() {
  return (
    <BlobStorageProvider config={{ client: useGranitClient() }}>
      <BlobListPage />
    </BlobStorageProvider>
  );
}
```

The list reads `GET /api/v1/blob-storage/blobs` through the query engine,
defaults to `createdAt desc`, and exposes the engine's preset / sort / group-by
toolbar. The per-row menu and the header "Cleanup orphans" button render only
when the current user holds `BlobStorage.Administration.Manage`. Download opens a
pre-signed URL (returned by `useDownloadUrl`) in a new tab so the storage
backend's `Content-Disposition` drives the save. The two dialogs are also
exported standalone for custom layouts:

```tsx
import { BlobDeleteDialog, BlobCleanupOrphansButton } from '@granit/react-ui-blob-storage';

<BlobDeleteDialog
  blob={target}
  open={target !== null}
  onOpenChange={(open) => !open && setTarget(null)}
  onConfirm={(reason) => deleteBlob(target.id, reason)}
  isPending={isDeleting}
/>;
```

## Public API

| Symbol                      | Kind      | Purpose                                                            |
| --------------------------- | --------- | ------------------------------------------------------------------ |
| `BlobListPage`              | component | Self-contained blobs list page (own `QueryProvider` + dialogs)     |
| `BlobDeleteDialog`          | component | Crypto-shred delete confirmation with an optional free-text reason |
| `BlobCleanupOrphansButton`  | component | Button + confirm dialog firing the orphan-cleanup mutation         |
| `blobStorageTranslationsEn` | const     | Flat `BlobStorage.*` English i18n bundle                           |
| `blobStorageTranslationsFr` | const     | Flat `BlobStorage.*` French i18n bundle                            |

`BlobDeleteDialog` takes `{ blob, open, onOpenChange, onConfirm, isPending }`
(`onConfirm(reason?: string)`); the dialog trims the reason and passes
`undefined` when empty. `BlobCleanupOrphansButton` is self-contained — it pulls
`useCleanupOrphans` from the headless layer and toasts the cleaned count.

## Injection

- **API client** — resolved from a `GranitClientProvider` / `BlobStorageProvider`
  higher in the tree (through the `@granit/react-blob-storage` hooks). No client
  is baked in.
- **Permissions** — `usePermissions` from `@granit/react-authorization` gates the
  download / delete / cleanup actions on `BlobStorage.Administration.Manage`.
- **i18n** — ships its `BlobStorage.*` strings (`blobStorageTranslationsEn` /
  `blobStorageTranslationsFr`); the host application registers them.

## Caveats

- **Permission gating is a UX hint, not enforcement.** The Manage check hides
  download / delete / cleanup controls; the `Granit.BlobStorage` backend remains
  the authoritative authority on every blob endpoint. See
  [`@granit/react-authorization`](../react-authorization) for the full security
  model.
- **Delete is irreversible.** Confirmed deletes crypto-shred the file content
  server-side (the dialog copy states this); the optional reason is forwarded as
  `deletionReason` for the audit trail.
- **Orphan cleanup is bulk and irreversible.** It removes blobs stuck in
  `Pending` / `Uploading` past the backend's orphan threshold — keep it behind
  the confirm dialog, never auto-trigger it.
- **Download URLs are pre-signed and short-lived.** `useDownloadUrl` returns a
  storage-backend URL opened with `noopener,noreferrer`; do not persist or log
  it.

## Out of scope

- **Upload UI and image rendering** — `BlobUploadField` / `BlobImage` live in
  [`@granit/react-blob-storage`](../react-blob-storage); this kit only lists and
  deletes existing blobs.
- **DTOs and HTTP transport** — owned by [`@granit/blob-storage`](../blob-storage)
  (mirror of `Granit.BlobStorage`); the headless hook layer adapts them to React
  Query, and this package only renders.

## License

Apache-2.0
