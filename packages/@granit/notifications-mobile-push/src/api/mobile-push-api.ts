import type { AxiosInstance } from 'axios';
import { buildApiUrl } from '@granit/api-client';

export type MobilePlatform = 'android' | 'ios';

export interface DeviceTokenDto {
  readonly token: string;
  readonly platform: MobilePlatform;
  readonly deviceId?: string;
}

export async function registerDeviceToken(
  client: AxiosInstance,
  basePath: string,
  payload: DeviceTokenDto
): Promise<void> {
  await client.post(buildApiUrl(basePath, 'notifications', 'mobile-push', 'tokens'), payload);
}

export async function unregisterDeviceToken(
  client: AxiosInstance,
  basePath: string,
  token: string
): Promise<void> {
  await client.delete(
    buildApiUrl(basePath, 'notifications', 'mobile-push', 'tokens', encodeURIComponent(token))
  );
}

export interface MobilePushTokenResponse {
  readonly deviceToken: string;
  readonly platform: MobilePlatform;
  readonly createdAt: string;
}

/**
 * Lists all registered device tokens for the current user.
 *
 * `GET {basePath}/notifications/mobile-push/tokens`
 */
export async function listDeviceTokens(
  client: AxiosInstance,
  basePath: string
): Promise<readonly MobilePushTokenResponse[]> {
  const { data } = await client.get<MobilePushTokenResponse[]>(
    buildApiUrl(basePath, 'notifications', 'mobile-push', 'tokens')
  );
  return data;
}
