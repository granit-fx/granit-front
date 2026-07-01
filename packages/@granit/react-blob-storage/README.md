# @granit/react-blob-storage

React hooks, provider and headless components for the Granit **blob-storage**
module — the direct-to-cloud upload/download/delete lifecycle wrapped in
React Query. This is the **React hooks+providers** layer over the
framework-agnostic core [`@granit/blob-storage`](../blob-storage), which owns the
DTOs, the Axios calls (`initiateUpload`, `confirmUpload`, `getBlob`,
`getDownloadUrl`, `deleteBlob`, `cancelPendingUpload`, `cleanupOrphans`) and the
`BlobStoragePermissions` constants. It is the TypeScript counterpart of the .NET
`Granit.BlobStorage` module (contract: `contracts/openapi/blob-storage.json`).

The sibling split is:

- [`@granit/blob-storage`](../blob-storage) — framework-agnostic core (types, API
  client, permissions).
- `@granit/react-blob-storage` (this package) — hooks, `BlobStorageProvider`, and
  the headless `BlobImage` / `BlobUploadField` components.
- [`@granit/react-ui-blob-storage`](../react-ui-blob-storage) — the admin feature
  kit (query-driven blobs grid, orphan-cleanup and crypto-shred delete dialogs).
- [`@granit/react-ai-chat-blob-storage`](../react-ai-chat-blob-storage) — glue
  adapting this package's upload flow to the AI-chat composer's attachment slot.

The upload is **direct-to-cloud**: the API hands back a pre-signed URL, the
browser `PUT`s the bytes straight to S3/Azure, then a confirm call runs the
server-side validation pipeline. The application API never proxies the file body.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption. Declare these peers in the consuming app:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call.
- `@granit/blob-storage` — the core DTOs and HTTP client this layer wraps.
- `@granit/react-api-client` — resolves the host's Axios client from context
  (`useGranitClient` / `useOptionalGranitClient`).
- `@granit/query-engine` — query-key builder used by `blobListQueryKey`.
- `@granit/logger` — `createLogger` for runtime logging.
- `@granit/types` — shared branded types (e.g. `ISODateString`).
- `@tanstack/react-query` (`^5`) — the cache/mutation runtime.
- `react` (`^19`).

`@granit/react-query-engine` and `msw` are **optional** peers (only needed when
wiring the admin list grid or the `./testing` MSW handlers, respectively).

## Quick start

Wrap the subtree in a `BlobStorageProvider`. With a `<GranitClientProvider>` above
it the client is resolved from context; otherwise pass `config.client` explicitly.

```tsx
import {
  BlobStorageProvider,
  BlobUploadField,
  BlobImage,
  useBlobUpload,
  useDownloadUrl,
} from '@granit/react-blob-storage';

function App() {
  return (
    <BlobStorageProvider config={{ basePath: '/api/v1/blob-storage' }}>
      <AvatarField />
    </BlobStorageProvider>
  );
}

// Headless form field — orchestrates initiate -> PUT -> confirm and stores the
// resulting blob id as its value. Renders an unstyled, data-attribute scaffold.
function AvatarField() {
  const [blobId, setBlobId] = useState<string | null>(null);
  return <BlobUploadField value={blobId} onChange={setBlobId} containerName="avatars" />;
}

// Or drive the three-step flow manually.
function ManualUploader() {
  const { upload, state, reset } = useBlobUpload();

  const onPick = async (file: File) => {
    const result = await upload({ file, containerName: 'documents' });
    if (result.isValid) {
      // result.blobId is the confirmed, validated blob id.
    }
  };

  return state.phase === 'error' ? (
    <button onClick={reset}>Retry</button>
  ) : (
    <input type="file" onChange={(e) => void onPick(e.target.files![0]!)} />
  );
}

// Download URLs are ephemeral pre-signed URLs, so this is a mutation (no cache).
function DownloadButton({ id }: { id: string }) {
  const { mutateAsync: presign } = useDownloadUrl();
  return (
    <button
      onClick={async () => {
        const { downloadUrl } = await presign({ id, request: { containerName: 'documents' } });
        window.open(downloadUrl);
      }}
    >
      Download
    </button>
  );
}

// Render a stored blob id as an <img>, with auth + URL composition handled.
function Avatar({ blobId }: { blobId: string | null }) {
  return <BlobImage blobId={blobId} fallback={<UserIcon />} alt="Avatar" />;
}
```

## Public API

| Symbol                      | Kind      | Purpose                                                                          |
| --------------------------- | --------- | -------------------------------------------------------------------------------- |
| `BlobStorageProvider`       | provider  | Supplies the resolved client + `basePath` to descendant hooks/components         |
| `useBlobStorageConfig`      | hook      | Reads the `ResolvedBlobStorageConfig` from the nearest provider                  |
| `useBlobUpload`             | hook      | Full direct-to-cloud flow (initiate -> XHR `PUT` -> confirm) with progress       |
| `useBlob`                   | hook      | `GET {basePath}/blobs/{id}` descriptor query (`useBlob(id, containerName)`)      |
| `useInitiateUpload`         | hook      | Mutation: `POST .../blobs/upload` -> pre-signed URL ticket                       |
| `useConfirmUpload`          | hook      | Mutation: `POST .../blobs/{id}/confirm` -> runs server validation pipeline       |
| `useCancelPendingUpload`    | hook      | Mutation: `DELETE .../blobs/{id}/pending` -> short-circuits orphan cleanup       |
| `useDeleteBlob`             | hook      | Mutation: `DELETE .../blobs/{id}` -> crypto-shredding delete (RGPD Art. 17)      |
| `useDownloadUrl`            | hook      | Mutation: `POST .../blobs/{id}/download` -> ephemeral pre-signed URL             |
| `useCleanupOrphans`         | hook      | Mutation: `POST .../blobs/cleanup-orphans` -> sweep stuck `Pending` blobs        |
| `BlobImage`                 | component | Headless `<img>` for a blob id (default BFF/cookie URL or `resolveUrl`)          |
| `BlobUploadField`           | component | Headless upload field; stores the confirmed blob id as its value                 |
| `buildBlobStorageQueryKey`  | fn        | Query key factory `(config, ...segments)` for single-descriptor `useBlob` reads  |
| `blobListQueryKey`          | fn        | Query-engine key of the blobs **list**, for cross-invalidation                   |
| `BlobStorageConfig`         | type      | Provider input (`client?`, `basePath?`, `queryKeyPrefix?`)                       |
| `ResolvedBlobStorageConfig` | type      | `BlobStorageConfig` with `client` + `basePath` guaranteed                        |
| `BlobStorageProviderProps`  | type      | `{ config, children }`                                                           |
| `BlobImageProps`            | type      | `BlobImage` props (omits native `src`)                                           |
| `BlobUploadFieldProps`      | type      | `BlobUploadField` props (`value`/`onChange`, validators, render slots)           |
| `BlobUploadParams`          | type      | `{ file, containerName, onProgress? }` passed to `upload`                        |
| `BlobUploadPhase`           | type      | `'idle' \| 'initiating' \| 'uploading' \| 'confirming' \| 'complete' \| 'error'` |
| `BlobUploadState`           | type      | `{ phase, progress, blobId, result, error }` from `useBlobUpload`                |

Wire DTOs (`BlobDescriptorResponse`, `BlobUploadInitiateRequest`, …) and the
`BlobStoragePermissions` constants are re-exported from
[`@granit/blob-storage`](../blob-storage), not from this package.

### Testing subpath (`@granit/react-blob-storage/testing`)

| Symbol                      | Kind  | Purpose                                                     |
| --------------------------- | ----- | ----------------------------------------------------------- |
| `createBlobStorageHandlers` | fn    | MSW handlers for the blob-storage routes (CRUD + query)     |
| `blobQueryMetadata`         | const | Mock `/meta` payload mirroring the backend query definition |
| `mockBlobs`                 | const | Seed `BlobDescriptorResponse[]` fixtures                    |
| `S`                         | const | Alias of `BlobStatus` for terse fixture construction        |

## Out of scope / caveats

- **Client checks are a UX hint, not a security boundary.** Container access,
  per-blob authorization and validation are enforced by `Granit.BlobStorage` on
  every endpoint. Gate UI with `BlobStoragePermissions` (from the core package)
  to hide controls; never treat a hidden control as protection.
- **Deletion is crypto-shredding (irreversible).** `useDeleteBlob` destroys the
  blob's encryption key — pass a meaningful `deletionReason` (e.g. RGPD Art. 17
  erasure). There is no undelete.
- **Download URLs are ephemeral.** `useDownloadUrl` is a _mutation_ by design so
  the pre-signed URL is never cached; presign on demand, don't store the URL.
- **Direct-to-cloud PUT bypasses Axios.** `useBlobUpload` uploads the file body
  with `XMLHttpRequest` against the pre-signed URL (for progress events). Only the
  initiate/confirm/cancel calls go through `@granit/api-client`. If the PUT fails,
  the hook best-effort-cancels the `Pending` blob; orphan cleanup is the backstop.
- **`BlobImage` resolves blob ids, not arbitrary URLs.** The default strategy
  builds `{baseURL}{basePath}/blobs/{id}/download` (BFF/cookie hosts); bearer or
  direct-S3 hosts must pass `resolveUrl` (e.g. wrapping `useDownloadUrl`). A
  `null`/`undefined` blob id or a load error renders the `fallback`.
- **Headless components are unstyled.** `BlobUploadField` emits a
  `data-granit-blob-upload-*` scaffold with `data-phase` / `data-busy` hooks; the
  polished admin chrome lives in [`@granit/react-ui-blob-storage`](../react-ui-blob-storage).

## License

Apache-2.0
