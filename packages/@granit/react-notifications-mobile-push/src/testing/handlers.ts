import { noContent } from '@granit/testing/msw';
import { toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockMobilePushTokens } from './data';

import type { DeviceTokenDto, MobilePushTokenResponse } from '@granit/notifications-mobile-push';

/**
 * Create stateful MSW handlers for the mobile-push device-token endpoints.
 *
 * Handlers mutate an in-memory token list — register / unregister are reflected
 * in subsequent GET calls. The endpoint path mirrors
 * `buildApiUrl(basePath, 'notifications', 'mobile-push', 'tokens')`, so the
 * tokens resource lives at `{baseUrl}/notifications/mobile-push/tokens`.
 *
 * @param baseUrl - API base path (default: `/api/v1/notifications`)
 */
export function createMobilePushHandlers(baseUrl = DEFAULT_BASE_PATH) {
  const tokensUrl = `${baseUrl}/notifications/mobile-push/tokens`;
  let tokens: MobilePushTokenResponse[] = [...mockMobilePushTokens];

  return [
    // GET registered device tokens for the current user
    http.get(tokensUrl, () => HttpResponse.json(tokens)),

    // POST register a device token — 204 No Content
    http.post(tokensUrl, async ({ request }) => {
      const body = (await request.json()) as DeviceTokenDto;
      const alreadyRegistered = tokens.some((t) => t.deviceToken === body.token);
      if (!alreadyRegistered) {
        tokens = [
          ...tokens,
          {
            deviceToken: body.token,
            platform: body.platform,
            createdAt: toISODateString('2026-03-17T12:00:00Z'),
          },
        ];
      }
      return noContent();
    }),

    // DELETE unregister a device token — 204 No Content
    http.delete(`${tokensUrl}/:token`, ({ params }) => {
      const token = decodeURIComponent(params.token as string);
      tokens = tokens.filter((t) => t.deviceToken !== token);
      return noContent();
    }),
  ];
}
