/** Default maximum attachment size (10 MiB). Mirrors the AI:Chat:Attachments backend default. */
export const CHAT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

/**
 * Default MIME types accepted by the AI chat blob attachment backend.
 * Pass {@link CHAT_ATTACHMENT_ACCEPT} to `ChatComposer.attachAccept` to filter the file picker.
 */
export const CHAT_ATTACHMENT_ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/json',
  'text/csv',
  'text/html',
  'text/markdown',
  'message/rfc822',
] as const;

/** Comma-separated MIME string ready for `<input accept="...">`. */
export const CHAT_ATTACHMENT_ACCEPT = CHAT_ATTACHMENT_ACCEPTED_TYPES.join(',');
