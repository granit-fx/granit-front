# @granit/documents

Framework-agnostic **document management** SDK — the TypeScript counterpart of
the .NET `Granit.Documents` module (Phase 1). It mirrors the wire contract
(`contracts/openapi/documents.json` plus the satellite specs
`documents-properties.json`, `documents-renditions.json`,
`documents-resolution.json`, `documents-public-links.json`) as fully `readonly`
types and exposes thin Axios HTTP wrappers for every endpoint, plus the
permission catalogue.

It holds **no** React, DOM or Node-only dependency — every function takes an
`AxiosInstance` and a `basePath` so the same calls drive a React app, the CMS
renderer (SSR), a CLI, or tests. The React Query layer (providers, hooks,
query-key factories) lives in [`@granit/react-documents`](../react-documents);
the admin feature kit (explorer, inspector, upload, quota badge) lives in
[`@granit/react-ui-documents`](../react-ui-documents).

The module models a per-tenant folder tree of documents with versioned blobs,
a share-based ACL, soft-delete (trash) with retention, taxonomy tags, extracted
metadata, generated renditions, public links, batch asset resolution, and a
tenant storage quota.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not a
registry install. Declare the runtime peers a consumer must provide:

- `@granit/api-client` — the centralised Axios client (CSRF, auth, tenant
  interceptors); every function takes its `AxiosInstance`.
- `@granit/query-engine` — `serializeQueryRequest` / `PagedResult`, used by the
  grid-backed `queryDocuments` listing.
- `@granit/types` — branded `ISODateString` for timestamp fields.

## Quick start

```ts
import {
  requestUploadTicket,
  finalizeUpload,
  queryDocuments,
  getDocumentDownloadUrl,
  DocumentsPermissions,
} from '@granit/documents';
import type { AxiosInstance } from '@granit/api-client';

declare const client: AxiosInstance;

// `basePath` is the module's collection root; all calls hang off it.
const basePath = '/api/v1/documents';

// 1. Two-phase upload: presigned ticket → direct blob PUT → finalize.
const ticket = await requestUploadTicket(client, basePath, {
  fileName: 'contract.pdf',
  contentType: 'application/pdf',
  maxAllowedBytes: 10_000_000,
});
await fetch(ticket.uploadUrl, {
  method: ticket.httpMethod, // "PUT"
  headers: ticket.requiredHeaders,
  body: file,
});
const doc = await finalizeUpload(client, basePath, {
  blobId: ticket.blobId,
  name: 'contract.pdf',
  folderId: null, // tenant root
  description: null,
  commitMessage: 'Initial upload',
});

// 2. Grid listing — filter / sort / page via the shared QueryEngine encoding.
const page = await queryDocuments(client, basePath, {
  status: 'Active',
  sort: '-name',
  page: 1,
  pageSize: 20,
});

// 3. Presigned download URL for the current version.
const { url } = await getDocumentDownloadUrl(client, basePath, doc.id);

// Permission strings for client-side gating (UX hint, not enforcement).
DocumentsPermissions.Documents.Manage; // 'Documents.Documents.Manage'
```

## Public API

Functions all share the `(client, basePath, …)` shape and return the response
body. Types are the `readonly` wire mirror.

### Folders

| Symbol                | Kind | Purpose                                                  |
| --------------------- | ---- | -------------------------------------------------------- |
| `listFolders`         | fn   | `GET /folders` — children of a parent (or tenant root)   |
| `getFolder`           | fn   | `GET /folders/{id}` — single folder + path + depth       |
| `getFolderBreadcrumb` | fn   | `GET /folders/{id}/breadcrumb` — root-first ancestors    |
| `createFolder`        | fn   | `POST /folders`                                          |
| `renameFolder`        | fn   | `PATCH /folders/{id}`                                    |
| `moveFolder`          | fn   | `POST /folders/{id}/move` (rejects cycles, cross-tenant) |
| `transferFolderOwner` | fn   | `PUT /folders/{id}/owner`                                |
| `trashFolder`         | fn   | `DELETE /folders/{id}` — cascade soft-delete             |
| `restoreFolder`       | fn   | `POST /folders/{id}/restore` (non-cascading)             |

### Documents

| Symbol                       | Kind | Purpose                                                   |
| ---------------------------- | ---- | --------------------------------------------------------- |
| `requestUploadTicket`        | fn   | `POST /documents/upload-ticket` — presigned PUT ticket    |
| `finalizeUpload`             | fn   | `POST /documents/finalize` — create doc + first version   |
| `getDocument`                | fn   | `GET /documents/{id}`                                     |
| `renameDocument`             | fn   | `PATCH /documents/{id}` — rename / description            |
| `moveDocument`               | fn   | `POST /documents/{id}/move`                               |
| `transferDocumentOwner`      | fn   | `PUT /documents/{id}/owner`                               |
| `trashDocument`              | fn   | `DELETE /documents/{id}` — soft-delete                    |
| `restoreDocument`            | fn   | `POST /documents/{id}/restore`                            |
| `permanentlyDeleteDocument`  | fn   | `DELETE /documents/{id}/permanent` — tombstone            |
| `getDocumentDownloadUrl`     | fn   | `GET /documents/{id}/download` (optional `versionId`)     |
| `appendDocumentVersion`      | fn   | `POST /documents/{id}/versions`                           |
| `listDocumentVersions`       | fn   | `GET /documents/{id}/versions` (paged, latest first)      |
| `listTrashedDocuments`       | fn   | `GET /documents/trash` (paged)                            |
| `queryDocuments`             | fn   | `GET /documents` — QueryEngine grid (`PagedResult`)       |
| `QueryDocumentsParams`       | type | `queryDocuments` filter / sort / page args                |

### Shares (ACL)

| Symbol                | Kind | Purpose                                              |
| --------------------- | ---- | ---------------------------------------------------- |
| `listFolderShares`    | fn   | `GET /folders/{id}/shares` — direct grants only      |
| `grantFolderShare`    | fn   | `POST /folders/{id}/shares` (inherits when default)  |
| `listDocumentShares`  | fn   | `GET /documents/{id}/shares` — direct grants only    |
| `grantDocumentShare`  | fn   | `POST /documents/{id}/shares`                        |
| `revokeShare`         | fn   | `DELETE /shares/{id}` (share ids tenant-global)      |

### Tags, quota, properties, public links, renditions, resolution

| Symbol                          | Kind | Purpose                                                    |
| ------------------------------- | ---- | ---------------------------------------------------------- |
| `listDocumentTags`              | fn   | `GET /documents/{id}/tags` — Taxonomy proxy                |
| `assignDocumentTag`             | fn   | `POST /documents/{id}/tags/{tagId}` (idempotent)           |
| `unassignDocumentTag`           | fn   | `DELETE /documents/{id}/tags/{tagId}`                      |
| `getTenantStorageQuota`         | fn   | `GET /quota` — tenant limit / usage / percent              |
| `getDocumentProperties`         | fn   | `GET /documents/{id}/metadata` — extracted metadata        |
| `getDocumentVersionProperties`  | fn   | `GET /documents/{id}/versions/{versionId}/metadata`        |
| `createDocumentPublicLink`      | fn   | `POST /documents/{id}/public-links` — one-time token       |
| `listDocumentPublicLinks`       | fn   | `GET /documents/{id}/public-links`                         |
| `revokeDocumentPublicLink`      | fn   | `DELETE /public-links/{id}` (optional reason)              |
| `listDocumentRenditions`        | fn   | `GET /documents/{id}/renditions`                           |
| `getRenditionDownloadUrl`       | fn   | `GET /documents/{id}/renditions/{type}/download`           |
| `batchResolveDocumentAssets`    | fn   | `POST /resolution/resolve` — batch presigned CDN URLs      |

### Permissions and shared re-exports

| Symbol                 | Kind  | Purpose                                                |
| ---------------------- | ----- | ------------------------------------------------------ |
| `DocumentsPermissions` | const | Permission-string catalogue (`Documents.*`)            |
| `PagedResult`          | type  | QueryEngine page wrapper, re-exported for consumers    |

### Types

The barrel re-exports the full `readonly` wire mirror grouped by area — folders
(`FolderResponse`, `ListFoldersResponse`, `FolderBreadcrumbResponse`,
`CreateFolderRequest`, `RenameFolderRequest`, `MoveFolderRequest`,
`ListFoldersFilter`, `FolderStatus`), documents (`DocumentResponse`,
`DocumentStatus`, `UploadTicketRequest`/`Response`, `FinalizeUploadRequest`,
`AppendVersionRequest`, `RenameDocumentRequest`, `MoveDocumentRequest`,
`TransferOwnerRequest`, `DownloadUrlResponse`, `DocumentVersionResponse`,
`ListDocumentVersionsResponse`, `TrashedDocumentResponse`,
`ListTrashedDocumentsResponse`, `PageFilter`), shares (`ShareResponse`,
`ListSharesResponse`, `GrantShareRequest`, `ShareGranteeType`,
`SharePermissionLevel`, `ShareTargetType`, `EffectivePermissionLevel`), tags
(`DocumentTagResponse`, `ListDocumentTagsResponse`,
`DocumentTagAssignmentResponse`), quota (`TenantStorageQuotaResponse`),
properties (`DocumentPropertiesResponse`, `DocumentPropertiesStatus`), public
links (`PublicLinkResponse`, `CreatePublicLinkRequest`/`Response`,
`RevokePublicLinkRequest`, `PublicLinkScope`), renditions (`RenditionResponse`,
`ListRenditionsResponse`, `RenditionDownloadUrlResponse`, `RenditionType`,
`RenditionStatus`) and resolution (`ResolveItemRequest`, `BatchResolveRequest`,
`ResolvedDocumentResponse`).

## Notes & caveats

- **No `Idempotency-Key`, no concurrency wiring here.** This package is a thin
  request layer. `DocumentResponse` / `PublicLinkResponse` carry a
  `concurrencyStamp` (echo it back on edits to detect 409s), but the package
  does not inject it — that is the caller's responsibility, per the framework's
  body-field optimistic-concurrency convention (never `If-Match`).
- **Two-phase upload.** Bytes never proxy through the API: `requestUploadTicket`
  returns a presigned `uploadUrl` the client PUTs to directly (using
  `httpMethod` + `requiredHeaders`), then `finalizeUpload` /
  `appendDocumentVersion` confirm with the returned `blobId`. Over-quota
  finalize returns `403` with a `quota-exceeded` problem URI.
- **Download / rendition / resolution URLs are short-lived presigned URLs.**
  Treat them as bearer capabilities — do not log them or persist them beyond
  their `expiresAt`. Public-link `token` and `url` from
  `createDocumentPublicLink` are returned **once** and grant unauthenticated
  access within their scope (`Download` / `View`), TTL and use-count limits.
- **Tags are a proxy over `Granit.Taxonomy`.** The canonical store lives there;
  these endpoints are a UX shortcut on the Documents surface.
- **Permissions are UX hints, not enforcement.** `DocumentsPermissions`
  strings gate controls client-side; the backend re-checks every call. The
  per-resource `permission` field (`EffectivePermissionLevel`) is `null` unless
  resolution was requested, and `Read < Edit < Manage` with highest-wins (no
  deny-override in Phase 1). Share grants are PII-adjacent in multi-tenant
  contexts — do not over-expose them.
- **`sizeBytes` / `*Bytes` are .NET `long`s wired as JSON numbers.** Realistic
  tenants stay well under `Number.MAX_SAFE_INTEGER` (~9 PB); the types do not
  use `bigint`.
- **`fetchOptions` (SSR).** `queryDocuments` and `batchResolveDocumentAssets`
  forward `RequestFetchOptions` verbatim to the fetch adapter for SSR caching
  hints (e.g. `{ next: { revalidate: 3600 } }`) — primarily for the CMS
  renderer.

## License

Apache-2.0
