import type { AxiosInstance } from 'axios';

export type MobilePlatform = 'android' | 'ios';

export interface DeviceTokenDto {
  readonly token: string;
  readonly platform: MobilePlatform;
  readonly deviceId?: string;
}

function buildUrl(basePath: string, ...segments: string[]): string {
  return [basePath, ...segments].join('/');
}

export async function registerDeviceToken(
  client: AxiosInstance,
  basePath: string,
  payload: DeviceTokenDto
): Promise<void> {
  await client.post(buildUrl(basePath, 'notifications', 'mobile-push', 'tokens'), payload);
}

export async function unregisterDeviceToken(
  client: AxiosInstance,
  basePath: string,
  token: string
): Promise<void> {
  await client.delete(
    buildUrl(basePath, 'notifications', 'mobile-push', 'tokens', encodeURIComponent(token))
  );
}

export interface MobilePushTokenResponse {
  readonly deviceToken: string;
  readonly platform: MobilePlatform;
  readonly createdAt: string;
}

/**
 * Fetches all registered device tokens for the current user.
 *
 * `GET {basePath}/notifications/mobile-push/tokens`
 */
export async function fetchDeviceTokens(
  client: AxiosInstance,
  basePath: string
): Promise<readonly MobilePushTokenResponse[]> {
  const { data } = await client.get<MobilePushTokenResponse[]>(
    buildUrl(basePath, 'notifications', 'mobile-push', 'tokens')
  );
  return data;
}
