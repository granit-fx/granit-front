# @granit/blob-storage

Framework-agnostic **blob storage** SDK — the TypeScript counterpart of the .NET
`Granit.BlobStorage` module. It mirrors that contract
(`contracts/openapi/blob-storage.json`) as hand-written DTOs and exposes the typed
HTTP client for the direct-to-cloud upload/download lifecycle.

The flow is **initiate → client-side PUT to a pre-signed URL → confirm**: the server
hands back a short-lived upload URL, the browser streams the bytes straight to object
storage, and a confirm call runs the server validation pipeline (content-type sniffing,
size check) before the blob becomes `Valid`. Downloads work the same way — the server
mints a pre-signed download URL, never proxying the bytes. This package holds **no**
React, DOM or Node-only dependency; it is consumed from any client. The React Query
layer lives in [`@granit/react-blob-storage`](../react-blob-storage), the admin feature
kit in [`@granit/react-ui-blob-storage`](../react-ui-blob-storage), and the chat-composer
attachment glue in [`@granit/react-ai-chat-blob-storage`](../react-ai-chat-blob-storage).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare these
peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant interceptors).
- `@granit/types` — the branded `ISODateString` used on timestamp fields.

## Quick start

```ts
import { initiateUpload, confirmUpload, getDownloadUrl } from '@granit/blob-storage';

// `basePath` is the module's collection root.
const basePath = '/api/v1/blob-storage/blobs';
const containerName = 'documents';

// 1. Initiate — get a pre-signed PUT target and the headers it requires.
const ticket = await initiateUpload(client, basePath, {
  containerName,
  fileName: 'report.pdf',
  contentType: 'application/pdf',
  sizeBytes: file.size,
});

// 2. Upload the bytes straight to object storage (not through the API).
await fetch(ticket.uploadUrl, {
  method: ticket.httpMethod,
  headers: ticket.requiredHeaders,
  body: file,
});

// 3. Confirm — runs server-side validation; blob is `Valid` only if `isValid`.
const result = await confirmUpload(client, basePath, ticket.blobId, { containerName });
if (!result.isValid) {
  throw new Error(result.rejectionReason ?? 'Upload rejected');
}

// Later: mint a short-lived download URL (optionally renaming on download).
const { downloadUrl } = await getDownloadUrl(client, basePath, ticket.blobId, {
  containerName,
  fileName: 'monthly-report.pdf',
});
```

## Public API

| Symbol                       | Kind  | Purpose                                                             |
| ---------------------------- | ----- | ------------------------------------------------------------------- |
| `BlobStatus`                 | type  | Lifecycle union: `Pending` `Uploading` `Valid` `Rejected` `Deleted` |
| `BlobStatus`                 | const | Frozen value map mirroring the same enum                            |
| `BlobUploadInitiateRequest`  | type  | `POST {basePath}/upload` body (container, name, type, size)         |
| `BlobUploadInitiateResponse` | type  | Pre-signed `uploadUrl`, `httpMethod`, `requiredHeaders`, expiry     |
| `BlobConfirmUploadRequest`   | type  | `POST {basePath}/{id}/confirm` body                                 |
| `BlobConfirmUploadResponse`  | type  | Validation verdict: `isValid`, verified type/size, rejection        |
| `BlobDownloadUrlRequest`     | type  | `POST {basePath}/{id}/download-url` body (optional rename)          |
| `BlobDownloadUrlResponse`    | type  | Pre-signed `downloadUrl` + `expiresAt`                              |
| `BlobDeleteRequest`          | type  | `DELETE {basePath}/{id}` body (container + reason)                  |
| `BlobCancelPendingRequest`   | type  | `DELETE {basePath}/{id}/pending` body (container + reason)          |
| `BlobDescriptorResponse`     | type  | Full `getBlob` descriptor (declared vs. actual size split)          |
| `BlobDescriptorListItem`     | type  | Query/list row projection (tenant + storage-key audit fields)       |
| `BlobCleanupOrphansResponse` | type  | `cleanedCount` from the orphan sweep                                |
| `initiateUpload`             | fn    | `POST {basePath}/upload` - get the pre-signed upload ticket         |
| `confirmUpload`              | fn    | `POST {basePath}/{id}/confirm` - run the validation pipeline        |
| `getDownloadUrl`             | fn    | `POST {basePath}/{id}/download-url` - mint a signed URL             |
| `getBlob`                    | fn    | `GET {basePath}/{id}?containerName=` - fetch the descriptor         |
| `deleteBlob`                 | fn    | `DELETE {basePath}/{id}` - crypto-shred (audit record retained)     |
| `cancelPendingUpload`        | fn    | `DELETE {basePath}/{id}/pending` - abort a failed pending PUT       |
| `cleanupOrphans`             | fn    | `POST {basePath}/cleanup-orphans` - sweep stuck uploads             |
| `BlobStoragePermissions`     | const | `BlobStorage.Administration.{Read,Manage}` permission strings       |

`BlobDescriptorResponse` (the `getBlob` DTO) and `BlobDescriptorListItem` (the query/list
row) are deliberately different shapes: the descriptor keeps a `declaredSizeBytes` /
`actualSizeBytes` split, while the list row carries a single `sizeBytes` (null until
`Valid`) plus tenant and storage-key audit fields.

## Out of scope / caveats

- **Byte transfer is direct-to-cloud.** The API only hands out pre-signed URLs; the
  actual upload PUT and download GET hit object storage, not `@granit/api-client`. Send
  exactly the `requiredHeaders` returned by `initiateUpload` on the PUT, or the storage
  provider rejects the request.
- **`confirm` is the source of truth, not the client.** A `BlobConfirmUploadResponse`
  with `isValid: false` means the server sniffed a different content type or size than
  declared — surface `rejectionReason` and treat the blob as `Rejected`. Never trust a
  client-declared `contentType`/`sizeBytes` as validated.
- **`deleteBlob` is crypto-shredding, not erasure of the record.** The audit descriptor
  is retained (status → `Deleted`, `deletedAt`/`deletionReason` set) for RGPD
  accountability; only the key material is destroyed. Pass a meaningful `deletionReason`.
- **`cancelPendingUpload` only applies in `Pending`.** It short-circuits the
  orphan-cleanup window by jumping a failed pre-signed PUT straight to `Rejected`, and
  returns `409 Conflict` if the blob has already left `Pending`.
- **Permissions are a UX hint, not a boundary.** `BlobStoragePermissions` strings let an
  app hide admin controls; `Granit.BlobStorage` re-checks authorization on every
  endpoint. Pre-signed URLs are themselves the access grant for the bytes — never log or
  cache them past `expiresAt`.
- **No React, hooks or query keys here.** For React Query wiring
  (`useInitiateUpload`, `useConfirmUpload`, `useBlobUpload`, `useDownloadUrl`, …) use
  [`@granit/react-blob-storage`](../react-blob-storage).

## License

Apache-2.0
