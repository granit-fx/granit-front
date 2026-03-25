# @granit/react-blob-storage

React hooks for `@granit/blob-storage` -- upload, download, delete, cleanup orchestration.

## Installation

```bash
pnpm add @granit/react-blob-storage
```

## API

### Hooks

- `useBlob(blobId, options?)` -- fetch blob metadata
- `useInitiateUpload()` -- initiate a blob upload
- `useConfirmUpload()` -- confirm an uploaded blob
- `useDeleteBlob()` -- delete a blob
- `useDownloadUrl(blobId)` -- get a signed download URL
- `useCleanupOrphans()` -- remove unconfirmed blobs
- `useBlobUpload()` -- full upload orchestration (initiate + upload + confirm)

### Types

- `BlobStorageOptions` -- hook configuration
- `BlobUploadParams`, `BlobUploadPhase`, `BlobUploadState` -- upload orchestration types

## Usage

```tsx
import { useBlobUpload, useDownloadUrl } from '@granit/react-blob-storage';

function FileUploader() {
  const { upload, phase, progress } = useBlobUpload();

  return <input type="file" onChange={(e) => upload({ file: e.target.files![0] })} />;
}

function FileDownload({ blobId }: { blobId: string }) {
  const { data: url } = useDownloadUrl(blobId);
  return <a href={url}>Download</a>;
}
```

## License

Apache-2.0
