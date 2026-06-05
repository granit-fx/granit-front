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
const REPLAY_HEADER = 'idempotent-replayed';

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

type HeaderBag = Readonly<Record<string, unknown>>;

// Extract the response header bag from either an AxiosResponse (`response.headers`)
// or an AxiosError-like wrapper (`error.response.headers`), without taking a
// direct dependency on axios's types. This lets the idempotency helpers accept
// a successful response, a raw AxiosError, or a framework-specific `HttpError`
// that preserves the original response headers — covering both the tombstone
// (always an error) and replay (success or cached error) signals.
function extractResponseHeaders(value: unknown): HeaderBag | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const direct = (value as { headers?: unknown }).headers;
  if (typeof direct === 'object' && direct !== null) {
    return direct as HeaderBag;
  }

  const nested = (value as { response?: { headers?: unknown } }).response?.headers;
  if (typeof nested === 'object' && nested !== null) {
    return nested as HeaderBag;
  }

  return undefined;
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
  const headers = extractResponseHeaders(error);
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

/**
 * `true` when the response carried the `Idempotent-Replayed: true` header —
 * the backend served a cached copy of a previously-completed request instead
 * of re-executing the handler. Useful for telemetry and UX ("already
 * processed — this was a duplicate submission").
 *
 * Accepts either a successful `AxiosResponse` (header read from
 * `response.headers`) or an `AxiosError` (header read from
 * `error.response.headers`), since a replay reproduces the original cached
 * status — which may be a success OR a cached error (e.g. 409, 422).
 */
export function isIdempotentReplay(responseOrError: unknown): boolean {
  const headers = extractResponseHeaders(responseOrError);
  if (!headers) {
    return false;
  }

  // Axios lowercases response headers by default; check the canonical casing
  // too for adapters/proxies that preserve it.
  const raw = headers[REPLAY_HEADER] ?? headers['Idempotent-Replayed'];
  return typeof raw === 'string' && raw.toLowerCase() === 'true';
}
