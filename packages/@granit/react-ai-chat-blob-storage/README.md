# @granit/react-ai-chat-blob-storage

Glue package that wires blob storage as the attachment backend for `@granit/react-ai-chat`.

Exports `useAIChatBlobUpload` — a hook that returns an `UploadAttachment` adapter backed by
`@granit/react-blob-storage`. Inject it into `ChatComposer` via the `uploadAttachment` prop.

Also re-exports `CHAT_ATTACHMENT_ACCEPT`, `CHAT_ATTACHMENT_ACCEPTED_TYPES`, and
`CHAT_ATTACHMENT_MAX_BYTES` for use in `<input accept>` and size-guard UI.
