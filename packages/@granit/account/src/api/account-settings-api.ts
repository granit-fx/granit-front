import type { AccountSettingsResponse } from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Fetch the public account configuration (anonymous).
 *
 * `GET {basePath}/config`
 */
export async function getAccountSettings(
  client: AxiosInstance,
  basePath: string
): Promise<AccountSettingsResponse> {
  const { data } = await client.get<AccountSettingsResponse>(`${basePath}/config`);
  return data;
}
