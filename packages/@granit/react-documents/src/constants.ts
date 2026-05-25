export const API_VERSION = 'v1';
export const MODULE = '@granit/documents';
export const DEFAULT_BASE_PATH = `/api/${API_VERSION}/documents`;
export const DEFAULT_QUERY_KEY_PREFIX = ['documents'] as const;

/**
 * Custom DataTransfer MIME type used when dragging documents inside the
 * explorer. Payload shape: `{ "ids": string[] }`. FolderTree drop targets
 * recognize this and dispatch move mutations; UploadDropZone ignores it
 * so internal drags don't trigger an upload flow.
 */
export const DOCUMENT_DRAG_MIME = 'application/x-granit-documents';
