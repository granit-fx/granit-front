import { toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import {
  MOCK_CREDENTIALS,
  MOCK_TOTP_CODE,
  mockAccountConfig,
  mockAuthenticatorKey,
  mockLoginRequiresTwoFactor,
  mockLoginSuccess,
  mockPasskeys,
  mockProfile,
  mockRecoveryCodes,
  mockTwoFactorStatus,
} from './data';

import type { AccountProfileResponse, PasskeyInfoResponse } from '@granit/authentication-local';

type MutablePasskey = { -readonly [K in keyof PasskeyInfoResponse]: PasskeyInfoResponse[K] };

const problem = (status: number, title: string, section: string) =>
  HttpResponse.json(
    { type: `https://tools.ietf.org/html/rfc9110#section-${section}`, title, status },
    { status }
  );

const unauthorized = () => problem(401, 'Unauthorized', '15.5.2');

/**
 * Create MSW handlers for the full local-account surface — login, 2FA,
 * passkeys (login + management), registration, email confirmation/change,
 * password, profile, two-factor management, account deletion, session and
 * public config. Status codes mirror `Granit.Identity.Local.Endpoints`.
 *
 * Profile and passkey state is mutated in-memory per factory instance.
 *
 * @param baseUrl - API base path (default: `/api/v1/account`)
 */
export function createLocalAuthHandlers(baseUrl = DEFAULT_BASE_PATH) {
  let profile: AccountProfileResponse = { ...mockProfile };
  const passkeys: MutablePasskey[] = mockPasskeys.map((p) => ({ ...p }));

  return [
    // ── Login (anonymous) ───────────────────────────────────────────────
    http.post(`${baseUrl}/login`, async ({ request }) => {
      const body = (await request.json()) as { login: string; password: string };
      if (body.login === MOCK_CREDENTIALS.login && body.password === MOCK_CREDENTIALS.password) {
        return HttpResponse.json(mockLoginSuccess);
      }
      if (body.login === '2fa@granit-showcase.local') {
        return HttpResponse.json(mockLoginRequiresTwoFactor);
      }
      return unauthorized();
    }),

    http.post(`${baseUrl}/login/two-factor`, async ({ request }) => {
      const body = (await request.json()) as { code: string; useRecoveryCode?: boolean };
      if (body.code === MOCK_TOTP_CODE || body.useRecoveryCode) {
        return HttpResponse.json(mockLoginSuccess);
      }
      return unauthorized();
    }),

    // ── Passkey login (assertion) ───────────────────────────────────────
    http.post(`${baseUrl}/passkeys/assertion/begin`, () =>
      HttpResponse.json(
        JSON.stringify({
          challenge: btoa('mock-challenge'),
          timeout: 60000,
          rpId: 'localhost',
          allowCredentials: [],
        })
      )
    ),
    http.post(`${baseUrl}/passkeys/assertion/complete`, () => HttpResponse.json(mockLoginSuccess)),

    // ── Registration ────────────────────────────────────────────────────
    http.post(`${baseUrl}/register`, async ({ request }) => {
      const body = (await request.json()) as { email: string };
      if (body.email === 'existing@granit-showcase.local') {
        return problem(409, 'Conflict', '15.5.10');
      }
      return new HttpResponse(null, { status: 202 });
    }),
    http.get(`${baseUrl}/confirm-email`, ({ request }) => {
      const url = new URL(request.url);
      if (url.searchParams.get('userId') && url.searchParams.get('token')) {
        return new HttpResponse(null, { status: 204 });
      }
      return problem(400, 'Bad Request', '15.5.1');
    }),
    http.post(
      `${baseUrl}/resend-confirmation-email`,
      () => new HttpResponse(null, { status: 202 })
    ),

    // ── Password ────────────────────────────────────────────────────────
    http.post(`${baseUrl}/change-password`, () => new HttpResponse(null, { status: 204 })),
    http.post(`${baseUrl}/forgot-password`, () => new HttpResponse(null, { status: 202 })),
    http.post(`${baseUrl}/reset-password`, () => new HttpResponse(null, { status: 204 })),

    // ── Email change ────────────────────────────────────────────────────
    http.post(`${baseUrl}/change-email`, () => new HttpResponse(null, { status: 202 })),
    http.post(`${baseUrl}/confirm-email-change`, () => new HttpResponse(null, { status: 204 })),

    // ── Profile ─────────────────────────────────────────────────────────
    http.get(`${baseUrl}/profile`, () => HttpResponse.json(profile)),
    http.put(`${baseUrl}/profile`, async ({ request }) => {
      const body = (await request.json()) as {
        firstName?: string | null;
        lastName?: string | null;
      };
      profile = { ...profile, firstName: body.firstName ?? null, lastName: body.lastName ?? null };
      return HttpResponse.json(profile);
    }),

    // ── Two-factor management ───────────────────────────────────────────
    http.get(`${baseUrl}/two-factor`, () => HttpResponse.json(mockTwoFactorStatus)),
    http.get(`${baseUrl}/two-factor/authenticator-key`, () =>
      HttpResponse.json(mockAuthenticatorKey)
    ),
    http.post(`${baseUrl}/two-factor/enable`, async ({ request }) => {
      const body = (await request.json()) as { code: string };
      if (body.code !== MOCK_TOTP_CODE) return problem(400, 'Bad Request', '15.5.1');
      return HttpResponse.json({ recoveryCodes: mockRecoveryCodes });
    }),
    http.post(`${baseUrl}/two-factor/disable`, () => new HttpResponse(null, { status: 204 })),
    http.post(`${baseUrl}/two-factor/recovery-codes`, () =>
      HttpResponse.json({ recoveryCodes: mockRecoveryCodes })
    ),

    // ── Passkey management ──────────────────────────────────────────────
    http.get(`${baseUrl}/passkeys`, () => HttpResponse.json(passkeys)),
    http.post(`${baseUrl}/passkeys/register/begin`, () =>
      HttpResponse.json(
        JSON.stringify({ challenge: btoa('mock-reg-challenge'), rp: { id: 'localhost' } })
      )
    ),
    http.post(`${baseUrl}/passkeys/register/complete`, async ({ request }) => {
      const body = (await request.json()) as { name?: string | null };
      const created: MutablePasskey = {
        id: `pk-${passkeys.length + 1}`,
        name: body.name ?? null,
        createdAt: toISODateString(new Date().toISOString()),
        lastUsedAt: null,
      };
      passkeys.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),
    http.patch(`${baseUrl}/passkeys/:id`, async ({ params, request }) => {
      const body = (await request.json()) as { name: string };
      const pk = passkeys.find((p) => p.id === params.id);
      if (!pk) return problem(404, 'Not Found', '15.5.5');
      pk.name = body.name;
      return new HttpResponse(null, { status: 204 });
    }),
    http.delete(`${baseUrl}/passkeys/:id`, ({ params }) => {
      const idx = passkeys.findIndex((p) => p.id === params.id);
      if (idx === -1) return problem(404, 'Not Found', '15.5.5');
      passkeys.splice(idx, 1);
      return new HttpResponse(null, { status: 204 });
    }),

    // ── Account deletion ────────────────────────────────────────────────
    http.post(`${baseUrl}/delete`, () => new HttpResponse(null, { status: 202 })),

    // ── Session ─────────────────────────────────────────────────────────
    http.post(`${baseUrl}/session/heartbeat`, () => new HttpResponse(null, { status: 204 })),

    // ── Public config (anonymous) ───────────────────────────────────────
    http.get(`${baseUrl}/config`, () => HttpResponse.json(mockAccountConfig)),
  ];
}
