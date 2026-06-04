import { noContent } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { mockBffCsrfToken, mockBffSessions, mockBffTenantUser } from './data';

import type {
  BffCsrfTokenResponse,
  BffSessionInfo,
  BffSessionListResponse,
  BffUser,
} from '@granit/bff';

/**
 * Create stateful MSW handlers for the BFF authentication endpoints.
 *
 * MSW intercepts native `fetch`, so these cover the bootstrap flow that sits
 * below the Axios client — `@granit/bff` uses `fetch` deliberately:
 * - `GET  {prefix}/bff/user`         — current user (default: an authenticated tenant user)
 * - `POST {prefix}/bff/csrf-token`   — CSRF token issuance
 * - `GET  {prefix}/bff/sessions`     — active sessions (wrapped in `{ sessions }`)
 * - `DELETE {prefix}/bff/sessions/:id` — revoke one session (mutates in-memory state)
 * - `DELETE {prefix}/bff/sessions`     — revoke all other sessions (keeps the current one)
 *
 * Session state is per-handler-set: a revoke is reflected by subsequent list calls.
 *
 * @param pathPrefix - Frontend path prefix (e.g. `'/admin'`). Default: `''`.
 * @param user       - User returned by `GET /bff/user`. Default: {@link mockBffTenantUser}.
 *                     Pass `{ authenticated: false }` to mock an anonymous session.
 */
export function createBffHandlers(
  pathPrefix = '',
  user: BffUser | { authenticated: false } = mockBffTenantUser
) {
  const base = `${pathPrefix}/bff`;
  let sessions: BffSessionInfo[] = [...mockBffSessions];

  return [
    http.get(`${base}/user`, () => HttpResponse.json(user)),

    http.post(`${base}/csrf-token`, () =>
      HttpResponse.json({ csrfToken: mockBffCsrfToken } satisfies BffCsrfTokenResponse)
    ),

    http.get(`${base}/sessions`, () =>
      HttpResponse.json({ sessions } satisfies BffSessionListResponse)
    ),

    // Revoke a single session by its (masked) id.
    http.delete(`${base}/sessions/:sessionId`, ({ params }) => {
      sessions = sessions.filter((s) => s.sessionId !== params.sessionId);
      return noContent();
    }),

    // Revoke all other sessions — keep only the current one ("log out everywhere else").
    http.delete(`${base}/sessions`, () => {
      sessions = sessions.filter((s) => s.isCurrent);
      return noContent();
    }),
  ];
}
