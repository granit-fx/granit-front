/**
 * A parsed RFC 7807 conflict (`409`) body from a Blog endpoint.
 *
 * The Blog backend returns conflicts (slug clash, stale concurrency stamp,
 * concurrent draft edit) as a ProblemDetails carrying only the HTTP status and a
 * localized `detail` sentence — there is no machine-readable `code`/`errorCode`
 * member on the wire. So the UI surfaces `detail` directly (already localized by
 * the backend) rather than branching on a code.
 */
export interface BlogConflict {
  readonly status: 409;
  /** Localized, human-readable explanation from the backend (may be absent). */
  readonly detail: string | null;
}

/**
 * Extracts a Blog `409` conflict from a rejected mutation error, or `null` for
 * any other error (those are surfaced by the global MutationCache toast). Use to
 * drive a reload prompt on a stale save, showing the backend's localized `detail`.
 */
export function extractBlogConflict(error: unknown): BlogConflict | null {
  if (typeof error !== 'object' || error === null || !('response' in error)) return null;
  const response = (error as { response?: { status?: number; data?: unknown } }).response;
  if (!response || response.status !== 409) return null;
  const data = (response.data ?? {}) as { detail?: string };
  return { status: 409, detail: data.detail ?? null };
}
