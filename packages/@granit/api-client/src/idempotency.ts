// ---------------------------------------------------------------------------
// Idempotency tombstone detection helpers.
//
// The Granit backend (Granit.Http.Idempotency) marks a completed idempotency
// entry as "tombstoned" when the original response cannot be cached for replay
// (e.g. exceeded MaxResponseSizeBytes). On every subsequent retry with the
// same key, the server returns HTTP 413 with:
//
//   X-Idempotency-Tombstone: ResponseTooLarge
//
// Retrying with the same key will NEVER succeed — the server cannot
// reconstruct the original response. Clients must generate a new idempotency
// key to try again. These helpers let consumers (React Query `retry`,
// custom retry wrappers, error dashboards) detect the tombstone and stop.
// ---------------------------------------------------------------------------

const TOMBSTONE_HEADER = 'x-idempotency-tombstone';

/** Reason reported by the backend for the tombstoned response. */
export interface IdempotencyTombstoneInfo {
  /**
   * Machine-readable reason as emitted by the backend. Current values:
   * - `"ResponseTooLarge"` — response exceeded `MaxResponseSizeBytes`.
   *
   * New reasons may be added by the backend without a frontend breaking
   * change; callers should treat unknown values as generic "not replayable".
   */
  readonly reason: string;
}

// Minimal shape test for an AxiosError-like object without taking a direct
// dependency on axios's error constructor. This lets the helper accept either
// a raw AxiosError or a framework-specific error wrapper that preserves
// `response.headers`.
interface ErrorWithResponseHeaders {
  response?: {
    headers?: Readonly<Record<string, unknown>>;
  };
}

function hasResponseHeaders(error: unknown): error is ErrorWithResponseHeaders {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object' &&
    (error as { response?: unknown }).response !== null
  );
}

/**
 * Inspect an error thrown from an HTTP call and return the tombstone info
 * if the response carried the `X-Idempotency-Tombstone` header. Returns
 * `undefined` for any non-tombstoned error (network error, regular 4xx/5xx,
 * or a response without the header).
 *
 * Accepts any error shape that exposes `response.headers` — AxiosError
 * natively, plus the `HttpError` thrown by framework-specific adapters
 * when they preserve the original response headers.
 */
export function readIdempotencyTombstone(error: unknown): IdempotencyTombstoneInfo | undefined {
  if (!hasResponseHeaders(error)) {
    return undefined;
  }

  const headers = error.response?.headers;
  if (!headers) {
    return undefined;
  }

  // Axios lowercases response headers by default, but some adapters preserve
  // the original casing — check both.
  const raw = headers[TOMBSTONE_HEADER] ?? headers['X-Idempotency-Tombstone'];
  if (typeof raw !== 'string' || raw.length === 0) {
    return undefined;
  }

  return { reason: raw };
}

/**
 * Convenience predicate — `true` when the error indicates the server
 * already executed the original request and its response is permanently
 * unavailable for replay. Retrying with the same idempotency key will
 * always produce the same 413 response.
 */
export function isIdempotencyTombstoned(error: unknown): boolean {
  return readIdempotencyTombstone(error) !== undefined;
}
