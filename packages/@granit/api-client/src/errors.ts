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
  override readonly name = 'HttpError';

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
