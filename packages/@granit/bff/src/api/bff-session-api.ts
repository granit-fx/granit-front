// ---------------------------------------------------------------------------
// BFF session management API — mirrors Granit.Bff.Endpoints.BffSessionEndpoints
//
// Uses native fetch with credentials: 'include' (cookie-based BFF auth).
// Mutation endpoints (DELETE) require a CSRF token via CsrfManager.
// ---------------------------------------------------------------------------

import { parseBffSessionList } from '../validation/index';

import type { CsrfManager } from '../csrf/index';
import type { BffSessionInfo } from '../types/index';

/**
 * Lists the current user's active BFF sessions.
 *
 * Session IDs are masked server-side for security.
 *
 * @returns Array of active sessions with metadata.
 * @throws Error on non-OK response (401 if not authenticated).
 */
export async function listBffSessions(pathPrefix: string): Promise<readonly BffSessionInfo[]> {
  const response = await fetch(`${pathPrefix}/bff/sessions`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Failed to list BFF sessions: ${response.status}`);
  }
  // Normalize and bound the enrichment fields (user-agent, geolocation, risk)
  // before they reach the UI — `userAgent`/`location.*` are not first-party
  // text. A malformed envelope (e.g. an HTML error page that still returned 200)
  // is rejected rather than cast blindly.
  const parsed = parseBffSessionList(await response.json());
  if (!parsed.success) {
    throw new Error(`Malformed BFF sessions response: ${parsed.issues.join('; ')}`);
  }
  return parsed.data;
}

/**
 * Revokes a specific BFF session by its (masked) ID.
 *
 * Cannot revoke the current session — use logout instead.
 *
 * @param sessionId - The masked session ID to revoke.
 * @throws Error on non-OK response (404 if not found, 401 if not authenticated).
 */
export async function revokeBffSession(
  pathPrefix: string,
  sessionId: string,
  csrfManager: CsrfManager
): Promise<void> {
  const fetchWithCsrf = csrfManager.createFetchWithCsrf();
  const response = await fetchWithCsrf(
    `${pathPrefix}/bff/sessions/${encodeURIComponent(sessionId)}`,
    { method: 'DELETE' }
  );
  if (!response.ok) {
    throw new Error(`Failed to revoke BFF session: ${response.status}`);
  }
}

/**
 * Revokes all other BFF sessions except the current one.
 *
 * Use case: "Log out everywhere else".
 *
 * @throws Error on non-OK response (401 if not authenticated).
 */
export async function revokeAllOtherBffSessions(
  pathPrefix: string,
  csrfManager: CsrfManager
): Promise<void> {
  const fetchWithCsrf = csrfManager.createFetchWithCsrf();
  const response = await fetchWithCsrf(`${pathPrefix}/bff/sessions`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to revoke all other BFF sessions: ${response.status}`);
  }
}
