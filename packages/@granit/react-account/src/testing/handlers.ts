import { noContent, notFound } from '@granit/testing/msw';
import { toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import {
  mockAccountSettings,
  mockExternalLogins,
  mockPasskeys,
  mockProfile,
  mockTwoFactorStatus,
} from './data.js';

/**
 * Create stateful MSW handlers for account self-service endpoints.
 * Handlers mutate in-memory state — mutations are reflected by subsequent GETs.
 *
 * @param baseUrl - API base path (default: `/account`)
 */
export function createAccountHandlers(baseUrl = '/account') {
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

    http.post(`${baseUrl}/external-logins/challenge/:provider`, () => noContent()),

    http.delete(`${baseUrl}/external-logins/:provider`, ({ params }) => {
      const idx = mockExternalLogins.findIndex(
        (l) => l.loginProvider.toLowerCase() === String(params.provider).toLowerCase()
      );
      if (idx === -1) return notFound();
      mockExternalLogins.splice(idx, 1);
      return noContent();
    }),

    // ── Password ─────────────────────────────────────────────────────────────
    http.post(`${baseUrl}/password/change`, () => noContent()),
    http.post(`${baseUrl}/password/forgot`, () => noContent()),
    http.post(`${baseUrl}/password/reset`, () => noContent()),

    // ── Registration ─────────────────────────────────────────────────────────
    http.post(`${baseUrl}/register`, async ({ request }) => {
      const body = (await request.json()) as { email?: string };
      return HttpResponse.json(
        { userId: `usr_${Date.now()}`, email: body.email ?? '' },
        { status: 201 }
      );
    }),
    http.post(`${baseUrl}/confirm-email`, () => noContent()),
    http.post(`${baseUrl}/resend-confirmation`, () => noContent()),

    // ── Email change ─────────────────────────────────────────────────────────
    http.post(`${baseUrl}/email/change`, () => noContent()),
    http.post(`${baseUrl}/email/confirm-change`, () => noContent()),

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
    http.delete(`${baseUrl}/account`, () => noContent()),
  ];
}
