import type { IdentityLocalConfigResponse } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Get the public local-identity configuration (anonymous).
 *
 * `GET {basePath}/config`
 */
export async function getAccountConfig(
  client: AxiosInstance,
  basePath: string
): Promise<IdentityLocalConfigResponse> {
  const { data } = await client.get<IdentityLocalConfigResponse>(`${basePath}/config`);
  return data;
}
