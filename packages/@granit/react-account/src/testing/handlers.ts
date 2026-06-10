import { accepted, noContent, notFound } from '@granit/testing/msw';
import { toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import {
  mockAccountSettings,
  mockExternalLogins,
  mockPasskeys,
  mockProfile,
  mockTwoFactorStatus,
} from './data';

/**
 * Create stateful MSW handlers for account self-service endpoints.
 * Handlers mutate in-memory state — mutations are reflected by subsequent GETs.
 *
 * @param baseUrl - API base path (default: `/api/v1/account`)
 * @param options.unavailableProviders - Provider scheme names that return 500 on challenge
 *   (simulates a provider configured in the registry but whose authentication handler is
 *   not registered — `HttpError(500)` in the SDK). Useful for testing the "provider
 *   unavailable" UI state.
 */
export function createAccountHandlers(
  baseUrl = DEFAULT_BASE_PATH,
  options: { unavailableProviders?: readonly string[] } = {}
) {
  const unavailableProviders = new Set(options.unavailableProviders ?? []);
  return [
    // ── Settings (anonymous) ─────────────────────────────────────────────────
    http.get(`${baseUrl}/config`, () => HttpResponse.json(mockAccountSettings)),

    // ── Profile ──────────────────────────────────────────────────────────────
    http.get(`${baseUrl}/profile`, () => HttpResponse.json(mockProfile)),

    http.put(`${baseUrl}/profile`, async ({ request }) => {
      const body = (await request.json()) as { firstName?: string; lastName?: string };
      if (body.firstName !== undefined) mockProfile.firstName = body.firstName;
      if (body.lastName !== undefined) mockProfile.lastName = body.lastName;
      return HttpResponse.json(mockProfile);
    }),

    // ── Two-factor ───────────────────────────────────────────────────────────
    http.get(`${baseUrl}/two-factor`, () => HttpResponse.json(mockTwoFactorStatus)),

    http.get(`${baseUrl}/two-factor/authenticator-key`, () =>
      HttpResponse.json({
        sharedKey: 'JBSWY3DPEHPK3PXP',
        qrCodeUri:
          'otpauth://totp/Granit%3Aalice%40granit-showcase.local?secret=JBSWY3DPEHPK3PXP&issuer=Granit',
      })
    ),

    http.post(`${baseUrl}/two-factor/enable`, () => {
      mockTwoFactorStatus.isEnabled = true;
      mockTwoFactorStatus.hasAuthenticatorApp = true;
      mockTwoFactorStatus.recoveryCodesLeft = 8;
      return HttpResponse.json({
        recoveryCodes: [
          'AAAA-BBBB',
          'CCCC-DDDD',
          'EEEE-FFFF',
          'GGGG-HHHH',
          'IIII-JJJJ',
          'KKKK-LLLL',
          'MMMM-NNNN',
          'OOOO-PPPP',
        ],
      });
    }),

    http.post(`${baseUrl}/two-factor/disable`, () => {
      mockTwoFactorStatus.isEnabled = false;
      mockTwoFactorStatus.hasAuthenticatorApp = false;
      mockTwoFactorStatus.recoveryCodesLeft = 0;
      return noContent();
    }),

    http.post(`${baseUrl}/two-factor/recovery-codes`, () => {
      mockTwoFactorStatus.recoveryCodesLeft = 8;
      return HttpResponse.json({
        recoveryCodes: [
          'QQQQ-RRRR',
          'SSSS-TTTT',
          'UUUU-VVVV',
          'WWWW-XXXX',
          'YYYY-ZZZZ',
          '1111-2222',
          '3333-4444',
          '5555-6666',
        ],
      });
    }),

    // ── Passkeys ─────────────────────────────────────────────────────────────
    http.get(`${baseUrl}/passkeys`, () => HttpResponse.json(mockPasskeys)),

    http.post(`${baseUrl}/passkeys/register/begin`, () =>
      HttpResponse.json('{"challenge":"mock-challenge-base64url"}')
    ),

    http.post(`${baseUrl}/passkeys/register/complete`, () => {
      const newPasskey = {
        id: `pk_01HZ9KQX${Date.now()}` as (typeof mockPasskeys)[number]['id'],
        name: 'New Passkey',
        createdAt: toISODateString(new Date().toISOString()),
      };
      mockPasskeys.push({ ...newPasskey, lastUsedAt: null });
      return HttpResponse.json(newPasskey, { status: 201 });
    }),

    http.patch(`${baseUrl}/passkeys/:id`, async ({ params, request }) => {
      const pk = mockPasskeys.find((p) => p.id === params.id);
      if (!pk) return notFound();
      const body = (await request.json()) as { name: string };
      pk.name = body.name;
      return noContent();
    }),

    http.delete(`${baseUrl}/passkeys/:id`, ({ params }) => {
      const idx = mockPasskeys.findIndex((p) => p.id === params.id);
      if (idx === -1) return notFound();
      mockPasskeys.splice(idx, 1);
      return noContent();
    }),

    // ── External logins ──────────────────────────────────────────────────────
    http.get(`${baseUrl}/external-logins`, () => HttpResponse.json(mockExternalLogins)),

    http.post(`${baseUrl}/external-logins/challenge/:provider`, ({ params }) => {
      const provider = String(params.provider);
      if (unavailableProviders.has(provider)) {
        return HttpResponse.json(
          { title: 'Internal Server Error', status: 500 },
          { status: 500 }
        );
      }
      return noContent();
    }),

    http.delete(`${baseUrl}/external-logins/:provider`, ({ params }) => {
      const idx = mockExternalLogins.findIndex(
        (l) => l.loginProvider.toLowerCase() === String(params.provider).toLowerCase()
      );
      if (idx === -1) return notFound();
      mockExternalLogins.splice(idx, 1);
      return noContent();
    }),

    // ── Password ─────────────────────────────────────────────────────────────
    http.post(`${baseUrl}/change-password`, () => noContent()),
    http.post(`${baseUrl}/forgot-password`, () => accepted()),
    http.post(`${baseUrl}/reset-password`, () => noContent()),

    // ── Registration ─────────────────────────────────────────────────────────
    http.post(`${baseUrl}/register`, async ({ request }) => {
      const body = (await request.json()) as { email?: string };
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
      return accepted();
    }),
    http.get(`${baseUrl}/confirm-email`, ({ request }) => {
      const url = new URL(request.url);
      const userId = url.searchParams.get('userId');
      const token = url.searchParams.get('token');
      if (userId && token) return noContent();
      return HttpResponse.json(
        {
          type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
          title: 'Bad Request',
          status: 400,
        },
        { status: 400 }
      );
    }),
    http.post(`${baseUrl}/resend-confirmation-email`, () => accepted()),

    // ── Email change ─────────────────────────────────────────────────────────
    http.post(`${baseUrl}/change-email`, () => accepted()),
    http.post(`${baseUrl}/confirm-email-change`, () => noContent()),

    // ── Session ──────────────────────────────────────────────────────────────
    http.post(`${baseUrl}/session/heartbeat`, () => noContent()),
    http.post(`${baseUrl}/session/back-to-impersonator`, () =>
      HttpResponse.json({
        accessToken: 'mock-admin-access-token',
        refreshToken: 'mock-admin-refresh-token',
        expiresIn: 3600,
      })
    ),

    // ── Account deletion ─────────────────────────────────────────────────────
    http.post(`${baseUrl}/delete`, () => accepted()),
  ];
}
