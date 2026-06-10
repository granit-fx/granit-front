import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import {
  MOCK_CREDENTIALS,
  MOCK_EMAIL_OTP_CODE,
  MOCK_TOTP_CODE,
  mockLoginRequiresTwoFactor,
  mockLoginSuccess,
} from './data';

import type { TwoFactorMethod } from '@granit/authentication-local';

/**
 * Create MSW handlers for local authentication (login) endpoints: credential
 * login, two-factor login, and passkey assertion (begin/complete).
 *
 * Account self-service flows (forgot/reset password, registration, email
 * confirmation) live in `@granit/react-account/testing` — `createAccountHandlers`.
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
      const body = (await request.json()) as { code: string; method?: TwoFactorMethod };
      const method = body.method ?? 'Authenticator';

      const accepted =
        (method === 'Authenticator' && body.code === MOCK_TOTP_CODE) ||
        (method === 'Email' && body.code === MOCK_EMAIL_OTP_CODE) ||
        method === 'RecoveryCode';

      if (accepted) {
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

    // POST /login/two-factor/send-email — emails an OTP to the pending 2FA user
    http.post(
      `${baseUrl}/login/two-factor/send-email`,
      () => new HttpResponse(null, { status: 204 })
    ),

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
  ];
}
