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

/** Default heartbeat cadence (ms) for `useResourcePresence`. */
export const DEFAULT_RESOURCE_HEARTBEAT_INTERVAL_MS = 15_000;

/**
 * Default age (ms) beyond which a room participant is considered stale and
 * excluded from the returned list in `useResourcePresence`.
 */
export const DEFAULT_RESOURCE_STALE_THRESHOLD_MS = 45_000;
