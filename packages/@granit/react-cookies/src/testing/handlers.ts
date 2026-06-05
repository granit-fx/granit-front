import { http, HttpResponse } from 'msw';

import { mockCookieConsentConfig } from './data';

/**
 * Create MSW handlers for the cookie consent endpoints.
 *
 * Mirrors `Granit.Http.Cookies.Endpoints` — `GET {baseUrl}/cookies/config`
 * (anonymous, cached 1h server-side). Returns {@link mockCookieConsentConfig}.
 *
 * @param baseUrl - API base path (default: `/api/v1`)
 */
export function createCookieConsentHandlers(baseUrl = '/api/v1') {
  return [http.get(`${baseUrl}/cookies/config`, () => HttpResponse.json(mockCookieConsentConfig))];
}
