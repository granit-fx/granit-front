# @granit/react-documents

React bindings for the Granit **documents** module — a tenant-scoped DMS over
folders, documents, versions, shares, tags, public links, renditions, storage
quota and a recycle bin. This is the **React layer**: it wraps the
framework-agnostic Axios calls and DTOs from
[`@granit/documents`](../documents) in TanStack Query hooks behind a shared
`DocumentsProvider`, and ships a kit of **headless** components (explorer,
folder tree, upload, share dialog, trash bin, quota panels) keyed off
`data-granit-*` markers so apps own the visual layer.

The split is three packages over the same .NET `Granit.Documents` backend
(contracts: `contracts/openapi/documents.json` plus the `documents-properties`,
`documents-public-links`, `documents-renditions` and `documents-resolution`
sidecar specs):

- [`@granit/documents`](../documents) — framework-agnostic core: DTOs + Axios
  functions (`getDocument`, `listFolders`, `requestUploadTicket`, …).
- `@granit/react-documents` (this package) — React Query hooks, provider, and
  headless components.
- [`@granit/react-ui-documents`](../react-ui-documents) — admin feature kit:
  routed page shells (`DocumentsExplorerPage`, `TrashBinPage`,
  `StorageQuotaPage`, …) plus the `DOCUMENTS_PERMISSIONS` catalogue.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/documents` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback
  for the Axios client when `config.client` is omitted.
- `@granit/query-engine` + `@granit/react-query-engine` — the QueryEngine
  surface backing the search palette (`useQueryEndpoint`, `FilterEntry`,
  `SortEntry`).
- `@granit/logger` — `createLogger` (mutation-hook debug logging).
- `@granit/types` — shared base types (`toISODateString`, …).
- `@granit/utils` — shared helpers.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.14`, **optional**) — only for the `@granit/react-documents/testing`
  subpath.

Components are headless; pull in the optional stylesheet to apply the default
semantic-Tailwind skin (no hardcoded colors — dark mode and tenant theme tokens
flow through):

```ts
import '@granit/react-documents/styles.css';
```

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then drop the explorer or call the hooks anywhere below it.

```tsx
import { DocumentsExplorer, DocumentsProvider } from '@granit/react-documents';
import { useGranitClient } from '@granit/react-api-client';
import '@granit/react-documents/styles.css';

function DocumentsPage() {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <DocumentsProvider config={{ client: useGranitClient() }}>
      <DocumentsExplorer canManage onOpenDocument={(id) => openDocument(id)} />
    </DocumentsProvider>
  );
}
```

`<DocumentsExplorer>` is the all-in-one shell (sidebar tree + breadcrumb + list +
toolbar + inspector + upload + Cmd/Ctrl-K search). For bespoke screens, compose
the hooks and smaller components directly — uploads go through the two-phase
`useFileUpload` primitive (request a presigned ticket, `PUT` straight to blob
storage with `XMLHttpRequest` progress, then finalise):

```tsx
import { useFolders, useFileUpload } from '@granit/react-documents';

function FolderView({ folderId }: { folderId: string | null }) {
  const { data: folders } = useFolders({ parentId: folderId });
  const { uploadFile, progress } = useFileUpload();

  return (
    <input
      type="file"
      onChange={async (e) => {
        const file = e.target.files?.[0];
        if (file) await uploadFile(file, folderId); // → DocumentResponse
      }}
    />
  );
  // `progress` exposes { file, percent } during the blob PUT.
}
```

Read hooks are TanStack `useQuery` wrappers disabled on empty ids; mutation
hooks invalidate the relevant query namespaces (`documents`, `folders`,
`shares`, `quota`) on success. Presigned-URL hooks
(`useDocumentDownloadUrl`, `useRenditionDownloadUrl`) never auto-refetch
(`staleTime: Infinity`) — call `refetch()` on demand when the user clicks
"Download".

## Public API

### Provider and configuration

| Symbol                     | Kind     | Purpose                                                               |
| -------------------------- | -------- | --------------------------------------------------------------------- |
| `DocumentsProvider`        | provider | Supplies client, base path, query-key prefix to all hooks below it    |
| `useDocumentsConfig`       | hook     | Read the resolved config; throws outside a provider                   |
| `buildDocumentsQueryKey`   | fn       | Query-key factory honoring the configured `queryKeyPrefix`            |
| `DocumentsConfig`          | type     | Provider input (optional client / basePath / queryKeyPrefix)          |
| `ResolvedDocumentsConfig`  | type     | Provider output with the resolved required client + basePath          |
| `DocumentsProviderProps`   | type     | `{ config, children }`                                                |
| `API_VERSION`, `MODULE`    | const    | `'v1'`, `'@granit/documents'`                                         |
| `DEFAULT_BASE_PATH`        | const    | `/api/v1/documents`                                                   |
| `DEFAULT_QUERY_KEY_PREFIX` | const    | `['documents']`                                                       |
| `DOCUMENT_DRAG_MIME`       | const    | `application/x-granit-documents` DataTransfer type for internal drags |

### Hooks — folders

| Symbol                   | Kind | Purpose                                                      |
| ------------------------ | ---- | ------------------------------------------------------------ |
| `useFolders`             | hook | `GET .../folders` — child folders under a parent             |
| `useFolder`              | hook | `GET .../folders/{id}` — folder with materialised path/depth |
| `useFolderBreadcrumb`    | hook | `GET .../folders/{id}/breadcrumb` — root→leaf chain          |
| `useCreateFolder`        | hook | Create a folder (invalidates the folder-list family)         |
| `useRenameFolder`        | hook | Rename a folder                                              |
| `useMoveFolder`          | hook | Move a folder (descendant breadcrumbs change too)            |
| `useTransferFolderOwner` | hook | Transfer folder ownership (non-cascading)                    |
| `useTrashFolder`         | hook | Soft-delete a folder (cascade-trashes descendants)           |
| `useRestoreFolder`       | hook | Restore a trashed folder                                     |

### Hooks — documents and versions

| Symbol                         | Kind | Purpose                                                    |
| ------------------------------ | ---- | ---------------------------------------------------------- |
| `useDocument`                  | hook | `GET .../documents/{id}` — single document                 |
| `useDocumentVersions`          | hook | Version history, latest first (server caps `take` at 200)  |
| `useDocumentDownloadUrl`       | hook | Presigned download URL (no auto-refetch; manual `refetch`) |
| `useTrashedDocuments`          | hook | Paged trash listing for the current tenant                 |
| `useRequestUploadTicket`       | hook | Issue a presigned upload ticket (phase 1 of upload)        |
| `useFinalizeUpload`            | hook | Finalise upload → creates Document + initial version       |
| `useAppendDocumentVersion`     | hook | Append a new version (bumps `currentVersionId`, quota)     |
| `useRenameDocument`            | hook | Rename / update description                                |
| `useMoveDocument`              | hook | Move a document under another folder                       |
| `useTransferDocumentOwner`     | hook | Transfer document ownership                                |
| `useTrashDocument`             | hook | Soft-delete a document                                     |
| `useRestoreDocument`           | hook | Restore a trashed document                                 |
| `usePermanentlyDeleteDocument` | hook | Hard-delete (releases tenant quota)                        |

### Hooks — shares, tags, links, renditions, properties, quota

| Symbol                          | Kind | Purpose                                                       |
| ------------------------------- | ---- | ------------------------------------------------------------- |
| `useFolderShares`               | hook | Active share grants on a folder                               |
| `useDocumentShares`             | hook | Active share grants on a document                             |
| `useGrantFolderShare`           | hook | Grant a folder share                                          |
| `useGrantDocumentShare`         | hook | Grant a document share                                        |
| `useRevokeShare`                | hook | Revoke a share by id                                          |
| `useDocumentTagsList`           | hook | Tags on a document (Documents proxy over `Granit.Taxonomy`)   |
| `useAssignDocumentTag`          | hook | Attach a tag (idempotent)                                     |
| `useUnassignDocumentTag`        | hook | Detach a tag                                                  |
| `useDocumentPublicLinks`        | hook | List active public links for a document                       |
| `useCreateDocumentPublicLink`   | hook | Create a public link                                          |
| `useRevokeDocumentPublicLink`   | hook | Revoke a public link                                          |
| `useDocumentRenditions`         | hook | List renditions for the current version                       |
| `useRenditionDownloadUrl`       | hook | Presigned download URL for a rendition type (no auto-refetch) |
| `useBatchResolveDocumentAssets` | hook | Batch-resolve assets → presigned CDN URLs (CMS renderer)      |
| `useDocumentProperties`         | hook | Extracted metadata for the current version                    |
| `useDocumentVersionProperties`  | hook | Extracted metadata for a specific version                     |
| `useTenantStorageQuota`         | hook | Current tenant's storage quota usage                          |

### Hooks — local UI state (no network)

| Symbol                 | Kind | Purpose                                                      |
| ---------------------- | ---- | ------------------------------------------------------------ |
| `useFileUpload`        | hook | Two-phase upload primitive with progress + normalized errors |
| `useMultiSelect`       | hook | Anchor-based selection set (shift-click range, select-all)   |
| `useViewPreferences`   | hook | List/grid mode + tile size, persisted in `localStorage`      |
| `useDocumentBookmarks` | hook | Favorites + recents, persisted in `localStorage`             |

### Components — headless (`data-granit-*`)

| Symbol                    | Kind      | Purpose                                                     |
| ------------------------- | --------- | ----------------------------------------------------------- |
| `DocumentsExplorer`       | component | All-in-one shell: tree + list + inspector + upload + search |
| `DocumentsSidebar`        | component | Tabbed left pane: folders / favorites / recents             |
| `DocumentsToolbar`        | component | View-mode + tile-size + bulk-action toolbar                 |
| `DocumentsList`           | component | List/grid of documents in the current folder                |
| `FolderTree`              | component | Lazy-loading folder tree with drag-drop move targets        |
| `FolderBreadcrumb`        | component | Root→leaf breadcrumb for the active folder                  |
| `DocumentDetail`          | component | Inspector pane for the focused document                     |
| `DocumentQuickLook`       | component | Lightweight preview surface                                 |
| `DocumentSearchPalette`   | component | Cmd/Ctrl-K palette over the QueryEngine search endpoint     |
| `UploadButton`            | component | Single-file upload trigger (wraps `useFileUpload`)          |
| `UploadDropZone`          | component | Drag-and-drop upload surface (ignores internal drags)       |
| `VersionsTimeline`        | component | Version history with append/download actions                |
| `ShareDialog`             | component | Grant/revoke shares on a folder or document                 |
| `TransferOwnershipDialog` | component | Transfer ownership of a folder or document                  |
| `TrashBin`                | component | Recycle bin: restore / permanently delete                   |
| `QuotaBadge`              | component | Compact header quota indicator                              |
| `QuotaPanel`              | component | Settings-page storage quota panel                           |
| `InlineEdit`              | component | Inline rename text-field primitive                          |

### Helpers, classifiers, i18n

| Symbol                                                | Kind  | Purpose                                                  |
| ----------------------------------------------------- | ----- | -------------------------------------------------------- |
| `classifyDocumentName`                                | fn    | Extension → `DocumentKind` (`image`/`pdf`/`code`/…)      |
| `documentBadge`                                       | fn    | Short uppercase extension token for thumbnail-less tiles |
| `formatBytes`                                         | fn    | Human-readable byte size formatter                       |
| `DEFAULT_VIEW_MODE` / `DEFAULT_TILE_SIZE`             | const | View-preference defaults (`'list'`, `160`)               |
| `TILE_SIZE_STEPS`                                     | const | Discrete grid tile-size steps (px)                       |
| `documentsTranslationsEn` / `documentsTranslationsFr` | const | i18next bundles for the `documents` namespace            |

Component prop and label types (`*Props`, `*Labels`) and hook-result types
(`MultiSelectApi`, `ViewPreferences`, `DocumentBookmarksApi`,
`UseFileUploadResult`, `FileUploadProgress`, `FileUploadError`, `DocumentKind`,
`DocumentsViewMode`, `TileSizeStep`, `DocumentBookmark`, `DocumentsSidebarTab`,
`DocumentsTranslations`, …) are re-exported alongside each symbol.

### `./testing` subpath

Requires the optional `msw` peer. Exposes `createDocumentsHandlers` (stateful
in-memory MSW handlers covering every endpoint — folders, documents, versions,
shares, tags, quota, trash, the QueryEngine list, properties, public links,
renditions, resolution; default base `/api/v1/documents`), the
`documentQueryMetadata` fixture for the search surface, and the seeded
`mockDocumentsData` / `mockFoldersData` / `mockSharesData` /
`mockVersionsData` / `mockTrashedDocumentsData` / `mockQuotaData` datasets plus
their stable id constants (`DOC_*`, `FOLDER_*`, `MOCK_*`). Import these fixtures
rather than hand-rolling document DTOs in tests.

## Out of scope / caveats

- **Headless rendering.** Components emit `data-granit-*` markers and semantic
  Tailwind tokens; the optional `@granit/react-documents/styles.css` is the
  default skin, not a hard dependency. Apps own colors, icons, and final
  layout. `classifyDocumentName` / `documentBadge` only return a coarse kind +
  text badge — the icon set is the app's.
- **Permission gating is the host's job.** Components like
  `<DocumentsExplorer>` expose action flags (`canManage`,
  `canTransferOwnership`) but **do not** check permissions themselves. The host
  must gate them against the backend permission catalogue
  (`DOCUMENTS_PERMISSIONS`, owned by
  [`@granit/react-ui-documents`](../react-ui-documents)), and the .NET
  `Granit.Documents` backend re-checks authorization on every endpoint —
  client-side flags are a UX hint, never a security boundary.
- **Presigned URLs are short-lived.** Download and rendition URLs are fetched
  with `staleTime: Infinity` and `refetchOnWindowFocus: false` so a stale URL is
  never served silently; `refetch()` on the user's "Download" action.
- **Direct-to-blob uploads use `XMLHttpRequest`.** `useFileUpload` `PUT`s the
  file straight to blob storage outside the Axios client because the Fetch API
  has no upload-progress event — this is intentional and lives below the domain
  HTTP boundary. Errors are normalized into a discriminated
  `FileUploadError.code` (`too-large` / `quota-exceeded` / `http` / `network` /
  `unknown`); i18n of the message is the caller's job.
- **`localStorage` state is per-device, not synced.** `useViewPreferences` and
  `useDocumentBookmarks` persist to `localStorage` keyed by a caller-supplied
  key (pass `null` to disable). Favorites/recents denormalize document name +
  folder id and are **not** authoritative — prune them via `forget(id)` when a
  document is trashed or deleted.
- **DTOs and HTTP transport** are owned by [`@granit/documents`](../documents)
  (mirror of `Granit.Documents`); hooks here only adapt them to React Query.
  Document tags proxy `Granit.Taxonomy` through the Documents module.
- **Routed admin pages** (`DocumentsExplorerPage`, `TrashBinPage`,
  `StorageQuotaPage`, …) and the permission catalogue live one layer up in
  [`@granit/react-ui-documents`](../react-ui-documents).

## License

Apache-2.0
