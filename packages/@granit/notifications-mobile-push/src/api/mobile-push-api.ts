import { buildApiUrl } from '@granit/api-client';

import type { DeviceTokenDto, MobilePushTokenResponse } from '../types';
import type { AxiosInstance } from '@granit/api-client';

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
