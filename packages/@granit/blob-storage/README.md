# @granit/blob-storage

Blob storage types and API functions -- upload, download, confirm, delete, cleanup. Mirrors `Granit.BlobStorage` .NET contract.

## Installation

```bash
pnpm add @granit/blob-storage
```

## API

### Types

- `BlobUploadInitiateRequest`, `BlobUploadInitiateResponse` -- upload initiation
- `BlobConfirmUploadRequest`, `BlobConfirmUploadResponse` -- upload confirmation
- `BlobDownloadUrlRequest`, `BlobDownloadUrlResponse` -- download URLs
- `BlobDescriptorResponse` -- blob metadata
- `BlobDeleteRequest` -- deletion
- `BlobCleanupOrphansResponse` -- orphan cleanup
- `BlobStatus`, `BlobStatusValue` -- blob status enum

### Functions

- `initiateUpload(...)` -- start a new upload
- `confirmUpload(...)` -- confirm an uploaded blob
- `getDownloadUrl(...)` -- get a signed download URL
- `getBlob(...)` -- fetch blob metadata
- `deleteBlob(...)` -- delete a blob
- `cleanupOrphans(...)` -- remove unconfirmed blobs

## Usage

```ts
import { initiateUpload, confirmUpload } from '@granit/blob-storage';

const { uploadUrl, blobId } = await initiateUpload(client, basePath, {
  fileName: 'report.pdf',
  contentType: 'application/pdf',
});
// Upload file to uploadUrl, then confirm:
await confirmUpload(client, basePath, { blobId });
```

## License

Apache-2.0
