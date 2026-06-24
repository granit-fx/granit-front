# @granit/react-ai-chat-blob-storage

Glue package that wires **blob storage** as the attachment backend for the AI
chat composer. It bridges two otherwise-independent React feature packages:
[`@granit/react-ai-chat`](../react-ai-chat) (which defines the
`UploadAttachment` contract that `ChatComposer.uploadAttachment` expects) and
[`@granit/react-blob-storage`](../react-blob-storage) (which owns the
direct-to-cloud upload flow). Neither knows about the other; this package is the
seam.

This is a thin **React hooks** layer — no provider, no components, no DTOs of its
own. It has no backend module: it composes the wire contracts of its two
neighbours (`blob-storage.json` + `ai-chat.json` under `contracts/openapi/`). The
single hook turns the blob-storage upload orchestration into the small
file-in → reference-out adapter the chat composer consumes, applies a client-side
size guard, and maps the confirmation response into the composer's attachment
shape. Sibling split: data/orchestration lives in
[`@granit/react-blob-storage`](../react-blob-storage) (over the framework-agnostic
[`@granit/blob-storage`](../blob-storage) core); the chat UI lives in
[`@granit/react-ai-chat`](../react-ai-chat) and
[`@granit/react-ui-ai-chat`](../react-ui-ai-chat); this package only glues them.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption. Declare these peers (all are required at runtime):

- `@granit/react-ai-chat` — supplies the `UploadAttachment` type and the
  `ChatComposer` that consumes this hook's return value.
- `@granit/react-blob-storage` — supplies `useBlobUpload` and the
  `BlobStorageProvider` that must wrap the tree.
- `@granit/blob-storage` — the framework-agnostic core (upload contracts /
  `BlobConfirmUploadResponse`) re-exported through `react-blob-storage`.
- `react` (`^19`).

## Quick start

`useAIChatBlobUpload` must run inside a `BlobStorageProvider` (it calls
`useBlobUpload` internally). Pass its return value straight to
`ChatComposer.uploadAttachment`, and reuse `CHAT_ATTACHMENT_ACCEPT` for the file
picker filter:

```tsx
import { ChatComposer } from '@granit/react-ai-chat';
import { BlobStorageProvider } from '@granit/react-blob-storage';
import {
  useAIChatBlobUpload,
  CHAT_ATTACHMENT_ACCEPT,
} from '@granit/react-ai-chat-blob-storage';

function ChatComposerWithAttachments() {
  // The container name routes blobs to the right storage bucket/scope.
  const uploadAttachment = useAIChatBlobUpload('chat-attachments');

  return (
    <ChatComposer
      onSubmit={sendMessage}
      uploadAttachment={uploadAttachment}
      attachAccept={CHAT_ATTACHMENT_ACCEPT}
    />
  );
}

// `client` comes from a <GranitClientProvider>, or pass it explicitly here.
export function ChatPanel() {
  return (
    <BlobStorageProvider config={{}}>
      <ChatComposerWithAttachments />
    </BlobStorageProvider>
  );
}
```

The returned adapter runs the blob-storage three-step flow (initiate → pre-signed
`PUT` → confirm), then maps the `BlobConfirmUploadResponse` to the composer's
`{ reference, fileName, contentType, sizeBytes }` shape. `reference` is the
server-assigned `blobId` — the opaque handle the chat backend reads back. It
**throws** (which the composer surfaces as an error chip) when the file exceeds
`maxBytes`, or when the server marks the blob invalid (using `rejectionReason`,
falling back to `Blob validation failed`).

## Public API

| Symbol                           | Kind  | Purpose                                                                                       |
| -------------------------------- | ----- | --------------------------------------------------------------------------------------------- |
| `useAIChatBlobUpload`            | hook  | `(containerName, options?) → UploadAttachment` blob-backed adapter for `ChatComposer`         |
| `UseAIChatBlobUploadOptions`     | type  | `{ maxBytes?: number }` — override the default size guard                                     |
| `CHAT_ATTACHMENT_MAX_BYTES`      | const | Default max attachment size (10 MiB); mirrors the `AI:Chat:Attachments` backend default       |
| `CHAT_ATTACHMENT_ACCEPTED_TYPES` | const | Readonly tuple of accepted MIME types (PDF, Office, text, JSON, CSV, HTML, Markdown, `.eml`)  |
| `CHAT_ATTACHMENT_ACCEPT`         | const | The above joined into a comma-separated string for `<input accept>` / `attachAccept`          |

## Caveats

- **Provider required.** The hook calls `useBlobUpload`, which reads the nearest
  `BlobStorageProvider`. Rendering it outside one throws
  `useBlobStorageConfig must be used within a <BlobStorageProvider>`.
- **Size guard is a UX hint, not enforcement.** The `maxBytes` check rejects
  oversized files before the network round-trip to spare the user, but the
  authoritative limit and content-type validation run server-side in the
  blob-storage confirm pipeline (`isValid` / `rejectionReason`). An adapter that
  passed the client check can still be rejected on confirm.
- **`containerName` is not validated here.** It is forwarded verbatim to
  `useBlobUpload`; the backend owns container authorization and routing.
- **Accept list vs. validation are decoupled.** `CHAT_ATTACHMENT_ACCEPTED_TYPES`
  only pre-filters the file picker; it does not gate the upload. Keep it in sync
  with the backend's accepted-types policy, but never treat it as the security
  boundary.

## License

Apache-2.0
