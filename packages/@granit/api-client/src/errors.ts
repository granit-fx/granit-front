// ---------------------------------------------------------------------------
// Domain error classes for structured error handling across @granit/* packages.
// ---------------------------------------------------------------------------

/**
 * HTTP error with status code and optional RFC 7807 ProblemDetails.
 *
 * Thrown by API functions when a request fails with a non-2xx status.
 *
 * @example
 * ```ts
 * try {
 *   await getPage(client, basePath, params);
 * } catch (err) {
 *   if (err instanceof HttpError && err.status === 404) {
 *     // handle not found
 *   }
 * }
 * ```
 */
export class HttpError extends Error {
  override readonly name: string = 'HttpError';

  /** HTTP status code (e.g. 400, 404, 500). */
  readonly status: number;
  /** RFC 7807 problem details payload, if available. */
  readonly problemDetails?: ProblemDetailsPayload;

  constructor(message: string, status: number, problemDetails?: ProblemDetailsPayload) {
    super(message);
    this.status = status;
    this.problemDetails = problemDetails;
  }
}

/**
 * Optimistic-concurrency conflict (HTTP 409).
 *
 * Thrown when a write is rejected because the resource changed since the client
 * read it. Granit's framework convention is a body-field concurrency stamp
 * (`IConcurrencyStampRequest`): the `*Response` carries `concurrencyStamp`, the
 * `Update*Request` echoes it back, and a stale stamp surfaces as a `409`
 * (`DbUpdateConcurrencyException` → `EfCoreExceptionStatusCodeMapper`). There is
 * no `If-Match`/`412` mechanism.
 *
 * @example
 * ```ts
 * try {
 *   await updateTag(client, basePath, id, { ...form, concurrencyStamp });
 * } catch (err) {
 *   if (isConcurrencyConflict(err)) {
 *     // refetch the resource, re-apply the user's edits onto the fresh stamp,
 *     // then resubmit — or surface a "someone else changed this" prompt.
 *   }
 * }
 * ```
 */
export class ConcurrencyConflictError extends HttpError {
  override readonly name = 'ConcurrencyConflictError';

  constructor(message: string, problemDetails?: ProblemDetailsPayload) {
    super(message, 409, problemDetails);
  }
}

/**
 * Type guard: did this error come from an optimistic-concurrency conflict (409)?
 * Matches a {@link ConcurrencyConflictError}, an {@link HttpError} with status
 * 409, or a raw Axios error whose response status is 409 — so it works whether
 * the caller mapped the error or let the bare Axios error propagate.
 */
export function isConcurrencyConflict(error: unknown): boolean {
  if (error instanceof HttpError) return error.status === 409;
  const response = (error as { response?: { status?: number } } | null)?.response;
  return response?.status === 409;
}

/**
 * Did the transport fail WITHOUT producing an HTTP response — i.e. the request
 * never reached a responding server (connection refused, DNS failure, TLS error,
 * or a client-side timeout/abort)? This is distinct from an HTTP error (4xx/5xx),
 * which always carries a `response`.
 *
 * Works on the raw `AxiosError` propagated by the api-client (the client does not
 * remap transport errors) under both the `xhr` and `fetch` adapters: a network /
 * DNS / timeout failure yields an `AxiosError` with no `response`, whereas any
 * HTTP status — including 5xx — populates `response`. Lets SSR consumers separate
 * "backend unreachable → maintenance" from "transient 5xx → page-level error".
 */
export function isBackendUnavailable(error: unknown): boolean {
  if (error === null || typeof error !== 'object') return false;
  const e = error as { isAxiosError?: boolean; response?: unknown };
  return e.isAxiosError === true && e.response == null;
}

/**
 * HTTP status code if the error carries an HTTP response, otherwise `undefined`.
 * `undefined` means the transport failed before any response (see
 * {@link isBackendUnavailable}). Reads the raw Axios error shape so it works
 * whether the caller mapped the error or let the bare Axios error propagate.
 */
export function getHttpStatus(error: unknown): number | undefined {
  if (error === null || typeof error !== 'object') return undefined;
  const response = (error as { response?: { status?: number } }).response;
  return typeof response?.status === 'number' ? response.status : undefined;
}

/**
 * Validation error for client-side or server-returned validation failures.
 *
 * Used by `@granit/query-engine` (filter syntax) and `@granit/data-exchange` (import mapping).
 *
 * For server-returned validation failures, prefer reading the `errors` map on
 * the `ProblemDetailsPayload` of an {@link HttpError} (sourced from
 * `Granit.Http.ExceptionHandling`).
 *
 * @example
 * ```ts
 * throw new ValidationError('Invalid filter syntax', {
 *   field: 'status',
 *   constraint: 'Value must be one of: Active, Inactive',
 * });
 * ```
 */
export class ValidationError extends Error {
  override readonly name = 'ValidationError';

  /** Structured details about what failed validation. */
  readonly details?: ValidationDetails;

  constructor(message: string, details?: ValidationDetails) {
    super(message);
    this.details = details;
  }
}

/**
 * Timeout error for requests that exceeded the configured timeout.
 */
export class TimeoutError extends Error {
  override readonly name = 'TimeoutError';

  /** Timeout duration in milliseconds. */
  readonly timeoutMs: number;

  constructor(message: string, timeoutMs: number) {
    super(message);
    this.timeoutMs = timeoutMs;
  }
}

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/** Subset of RFC 7807 ProblemDetails relevant to error handling. */
export interface ProblemDetailsPayload {
  readonly type?: string;
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly traceId?: string;
  readonly errorCode?: string;
  /**
   * Per-field validation errors. Populated by the backend on validation
   * failures (typically HTTP 422) via `ProblemDetails.Extensions["errors"]`
   * — see `Granit.Http.ExceptionHandling` (`GranitExceptionHandler`).
   */
  readonly errors?: Readonly<Record<string, readonly string[]>>;
}

/** Structured validation failure details. */
export interface ValidationDetails {
  /** Field that failed validation. */
  readonly field?: string;
  /** Human-readable constraint description. */
  readonly constraint?: string;
  /** Per-field error map (for form-level validation). */
  readonly fieldErrors?: Readonly<Record<string, readonly string[]>>;
}
