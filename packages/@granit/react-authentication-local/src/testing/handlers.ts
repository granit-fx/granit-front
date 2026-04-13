import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants.js';

import {
  MOCK_CREDENTIALS,
  MOCK_TOTP_CODE,
  mockLoginRequiresTwoFactor,
  mockLoginSuccess,
} from './data.js';

/**
 * Create MSW handlers for local authentication endpoints (login, 2FA,
 * passkeys, password reset, registration, email confirmation).
 *
 * @param baseUrl - API base path (default: `/api/v1/account`)
 */
export function createLocalAuthHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    // POST /login
    http.post(`${baseUrl}/login`, async ({ request }) => {
      const body = (await request.json()) as { login: string; password: string };

      if (body.login === MOCK_CREDENTIALS.login && body.password === MOCK_CREDENTIALS.password) {
        return HttpResponse.json(mockLoginSuccess);
      }

      if (body.login === '2fa@granit-showcase.local') {
        return HttpResponse.json(mockLoginRequiresTwoFactor);
      }

      return HttpResponse.json(
        {
          type: 'https://tools.ietf.org/html/rfc9110#section-15.5.2',
          title: 'Unauthorized',
          status: 401,
        },
        { status: 401 }
      );
    }),

    // POST /login/two-factor
    http.post(`${baseUrl}/login/two-factor`, async ({ request }) => {
      const body = (await request.json()) as { code: string; useRecoveryCode?: boolean };

      if (body.code === MOCK_TOTP_CODE || body.useRecoveryCode) {
        return HttpResponse.json(mockLoginSuccess);
      }

      return HttpResponse.json(
        {
          type: 'https://tools.ietf.org/html/rfc9110#section-15.5.2',
          title: 'Unauthorized',
          status: 401,
        },
        { status: 401 }
      );
    }),

    // POST /passkeys/assertion/begin
    http.post(`${baseUrl}/passkeys/assertion/begin`, () => {
      return HttpResponse.json(
        JSON.stringify({
          challenge: btoa('mock-challenge'),
          timeout: 60000,
          rpId: 'localhost',
          allowCredentials: [],
        })
      );
    }),

    // POST /passkeys/assertion/complete
    http.post(`${baseUrl}/passkeys/assertion/complete`, () => {
      return HttpResponse.json(mockLoginSuccess);
    }),

    // POST /forgot-password
    http.post(`${baseUrl}/forgot-password`, () => {
      return new HttpResponse(null, { status: 200 });
    }),

    // POST /reset-password
    http.post(`${baseUrl}/reset-password`, () => {
      return new HttpResponse(null, { status: 200 });
    }),

    // POST /register
    http.post(`${baseUrl}/register`, async ({ request }) => {
      const body = (await request.json()) as { email: string };

      if (body.email === 'existing@granit-showcase.local') {
        return HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc9110#section-15.5.10',
            title: 'Conflict',
            status: 409,
          },
          { status: 409 }
        );
      }

      return HttpResponse.json({
        userId: 'd2c47314-4d08-4952-98b1-a1b8a6e22ef1',
        requiresEmailConfirmation: true,
      });
    }),

    // GET /confirm-email
    http.get(`${baseUrl}/confirm-email`, ({ request }) => {
      const url = new URL(request.url);
      const userId = url.searchParams.get('userId');
      const token = url.searchParams.get('token');

      if (userId && token) {
        return new HttpResponse(null, { status: 200 });
      }

      return HttpResponse.json(
        {
          type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
          title: 'Bad Request',
          status: 400,
        },
        { status: 400 }
      );
    }),
  ];
}
