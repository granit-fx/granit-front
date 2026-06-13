import { http, HttpResponse } from 'msw';

import { mockBffCsrfToken, mockBffTenantUser } from './data';

import type { BffCsrfTokenResponse, BffUser } from '@granit/bff';

/**
 * Create MSW handlers for the BFF authentication endpoints.
 *
 * MSW intercepts native `fetch`, so these cover the bootstrap flow that sits
 * below the Axios client — `@granit/bff` uses `fetch` deliberately:
 * - `GET  {prefix}/bff/user`         — current user (default: an authenticated tenant user)
 * - `POST {prefix}/bff/csrf-token`   — CSRF token issuance
 *
 * Session listing/revocation moved off the BFF (granit-dotnet #2692) to the
 * canonical `/sessions` endpoints — see `@granit/react-identity` testing
 * (`createIdentityHandlers`) for the self-service session/device handlers.
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

  return [
    http.get(`${base}/user`, () => HttpResponse.json(user)),

    http.post(`${base}/csrf-token`, () =>
      HttpResponse.json({ csrfToken: mockBffCsrfToken } satisfies BffCsrfTokenResponse)
    ),
  ];
}
