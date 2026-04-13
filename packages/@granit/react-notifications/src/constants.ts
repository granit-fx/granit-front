export const API_VERSION = 'v1';
export const MODULE = 'notifications';
export const DEFAULT_BASE_PATH = `/api/${API_VERSION}/${MODULE}`;

/**
 * API-compatible base path for `@granit/notifications` functions.
 * Those functions append `/${MODULE}` internally, so the base they
 * receive must NOT include the module segment.
 */
export const API_BASE_PATH = `/api/${API_VERSION}`;
