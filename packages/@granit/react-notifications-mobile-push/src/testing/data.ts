import { toISODateString } from '@granit/types';

import type {
  MobilePushTokenRegisterRequest,
  MobilePushTokenResponse,
} from '@granit/notifications-mobile-push';

/**
 * Registered device tokens returned by
 * `GET {basePath}/notifications/mobile-push/tokens`.
 *
 * Mirrors the bare `MobilePushTokenResponse[]` the .NET endpoint produces — one
 * token per platform so the device-token list exercises both `Android` and `Ios`.
 */
export const mockMobilePushTokens: MobilePushTokenResponse[] = [
  {
    deviceTokenPreview: 'token-abc-123',
    platform: 'Android',
    createdAt: toISODateString('2026-03-17T10:00:00Z'),
  },
  {
    deviceTokenPreview: 'token-def-456',
    platform: 'Ios',
    createdAt: toISODateString('2026-03-17T09:00:00Z'),
  },
];

/**
 * Sample registration payload for
 * `POST {basePath}/notifications/mobile-push/tokens`.
 */
export const mockDeviceTokenRegistration: MobilePushTokenRegisterRequest = {
  deviceToken: 'token-ghi-789',
  platform: 'Android',
};
