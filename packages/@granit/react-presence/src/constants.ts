export const API_VERSION = 'v1';
/**
 * API-compatible base path for `@granit/presence` functions.
 * Those functions append `/presence` internally, so the base they receive
 * must NOT include the module segment.
 */
export const DEFAULT_BASE_PATH = `/api/${API_VERSION}`;

/** Default cadence (ms) at which `useHeartbeat` polls the server while visible. */
export const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000;

/** Stale time (ms) applied to `useMyPresence` / `useUserPresence` / `useBatchPresence`. */
export const DEFAULT_STALE_TIME_MS = 30_000;
