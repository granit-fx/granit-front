import { http, HttpResponse } from 'msw';

import { mockCookieConsentConfig } from './data';

/**
 * Create MSW handlers for the cookie consent endpoints.
 *
 * Mirrors `Granit.Http.Cookies.Endpoints`:
 * - `GET {baseUrl}/cookies/config` (anonymous, cached 1h server-side) — returns
 *   {@link mockCookieConsentConfig}.
 * - `POST {baseUrl}/cookies/consent` (anonymous) — acknowledges a consent
 *   decision with `204 No Content`, mirroring the append-only ledger endpoint.
 *
 * @param baseUrl - API base path (default: `/api/v1`)
 */
export function createCookieConsentHandlers(baseUrl = '/api/v1') {
  return [
    http.get(`${baseUrl}/cookies/config`, () => HttpResponse.json(mockCookieConsentConfig)),
    http.post(`${baseUrl}/cookies/consent`, () => new HttpResponse(null, { status: 204 })),
  ];
}
