import { toISODateString } from '@granit/types';

import type { DeviceTokenDto, MobilePushTokenResponse } from '@granit/notifications-mobile-push';

/**
 * Registered device tokens returned by
 * `GET {basePath}/notifications/mobile-push/tokens`.
 *
 * Mirrors the bare `MobilePushTokenResponse[]` the .NET endpoint produces — one
 * token per platform so the device-token list exercises both `android` and `ios`.
 */
export const mockMobilePushTokens: MobilePushTokenResponse[] = [
  {
    deviceToken: 'token-abc-123',
    platform: 'android',
    createdAt: toISODateString('2026-03-17T10:00:00Z'),
  },
  {
    deviceToken: 'token-def-456',
    platform: 'ios',
    createdAt: toISODateString('2026-03-17T09:00:00Z'),
  },
];

/**
 * Sample registration payload for
 * `POST {basePath}/notifications/mobile-push/tokens`.
 */
export const mockDeviceTokenRegistration: DeviceTokenDto = {
  token: 'token-ghi-789',
  platform: 'android',
  deviceId: 'device-001',
};
