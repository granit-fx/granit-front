import { isIdempotencyTombstoned, setIdempotencyKeyGenerator } from '@granit/api-client';

import type { InternalAxiosRequestConfig } from '@granit/api-client';

// Re-export the tombstone + replay helpers so consumers only need to depend on
// `@granit/idempotency` to handle idempotency end-to-end (generation + retry).
export {
  isIdempotencyTombstoned,
  readIdempotencyTombstone,
  isIdempotentReplay,
} from '@granit/api-client';
export type { IdempotencyTombstoneInfo } from '@granit/api-client';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface IdempotencyClientOptions {
  /**
   * HTTP methods that receive an `Idempotency-Key` header.
   * Default: `['post', 'put', 'patch', 'delete']`.
   */
  methods?: string[];

  /**
   * Custom key generator. Receives the Axios request config and returns
   * the idempotency key string, or `undefined` to skip the header.
   *
   * Default: UUID v4 via `crypto.randomUUID()`.
   *
   * The backend rejects keys longer than its `MaxKeyLength` (default 256
   * characters) with HTTP 400 before any processing — keep generated keys
   * well under that bound (a UUIDv4 is 36 characters).
   */
  keyGenerator?: (config: InternalAxiosRequestConfig) => string | undefined;
}

/**
 * @deprecated Renamed to {@link IdempotencyClientOptions} to avoid colliding
 * with the unrelated server-side `IdempotencyOptions` (.NET middleware config).
 * This alias is kept for backward compatibility and will be removed in a
 * future major version.
 */
export type IdempotencyOptions = IdempotencyClientOptions;

const DEFAULT_METHODS = ['post', 'put', 'patch', 'delete'];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Enable idempotency key injection on the shared `@granit/api-client` instance.
 *
 * Call once during app initialization (e.g. in `main.ts` or the root component).
 * All subsequent mutation requests will automatically include an `Idempotency-Key` header.
 *
 * By default the key is a fresh UUIDv4 per request — UNLESS the caller already
 * set an `Idempotency-Key` header on the request, in which case that value is
 * preserved. This is what makes retries idempotent: reuse a single key across
 * every attempt of one logical operation (e.g. carry a stable key in the React
 * Query mutation variables) so the backend replays the original response
 * instead of re-executing. Random per-request keys do NOT make automatic
 * retries safe — each retry would otherwise mint a new key the backend treats
 * as a distinct operation.
 *
 * @example
 * ```typescript
 * // src/main.ts
 * import { enableIdempotency } from '@granit/idempotency';
 *
 * enableIdempotency();
 * ```
 *
 * @example
 * ```typescript
 * // Retry-safe mutation: the SAME key rides every attempt of one operation,
 * // so a retry after an ambiguous failure replays instead of double-executing.
 * api.post('/orders', body, { headers: { 'Idempotency-Key': stableKey } });
 * ```
 */
export function enableIdempotency(options?: IdempotencyClientOptions): void {
  const methods = new Set((options?.methods ?? DEFAULT_METHODS).map((m) => m.toLowerCase()));
  const generate = options?.keyGenerator ?? defaultKeyGenerator;

  setIdempotencyKeyGenerator((config: InternalAxiosRequestConfig) => {
    const method = config.method?.toLowerCase();
    if (!method || !methods.has(method)) {
      return undefined;
    }
    return generate(config);
  });
}

/**
 * Disable idempotency key injection.
 * Useful for testing or conditional feature flags.
 */
export function disableIdempotency(): void {
  setIdempotencyKeyGenerator(() => undefined);
}

// ---------------------------------------------------------------------------
// Default key generator
// ---------------------------------------------------------------------------

/**
 * Reuses a caller-provided `Idempotency-Key` header when present — so the SAME
 * key can ride every retry attempt of one logical operation (required for the
 * backend to replay the original response or return a deterministic tombstone
 * rather than re-executing). Falls back to a fresh UUIDv4 for one-shot
 * mutations that don't opt in.
 */
function defaultKeyGenerator(config: InternalAxiosRequestConfig): string {
  const existing = config.headers.get('Idempotency-Key');
  return typeof existing === 'string' && existing.length > 0 ? existing : crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// React Query retry helper
// ---------------------------------------------------------------------------

/**
 * Retry predicate compatible with TanStack Query's `retry` option.
 *
 * Returns `false` immediately when the error is a tombstoned idempotency
 * response — retrying with the same key will always return HTTP 413, so the
 * default retry-on-error strategy would burn attempts for no benefit.
 *
 * For any other error, falls back to the usual `failureCount < maxAttempts`
 * bound (default 3).
 *
 * @example
 * ```ts
 * import { shouldRetryIgnoringTombstone } from '@granit/idempotency';
 *
 * const queryClient = new QueryClient({
 *   defaultOptions: {
 *     mutations: {
 *       retry: (failureCount, error) =>
 *         shouldRetryIgnoringTombstone(failureCount, error),
 *     },
 *   },
 * });
 * ```
 */
export function shouldRetryIgnoringTombstone(
  failureCount: number,
  error: unknown,
  maxAttempts = 3
): boolean {
  if (isIdempotencyTombstoned(error)) {
    return false;
  }
  return failureCount < maxAttempts;
}
