import type { TenantStorageQuotaResponse } from '../types.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Get the current tenant's storage quota usage (F7.3). The quota row is
 * lazy-created on first call, so a brand-new tenant always sees
 * `usageBytes: 0` rather than a 404. Returns 401 when the request carries no
 * tenant context.
 *
 * `GET {basePath}/quota`
 */
export async function getTenantStorageQuota(
  client: AxiosInstance,
  basePath: string
): Promise<TenantStorageQuotaResponse> {
  const response = await client.get<TenantStorageQuotaResponse>(`${basePath}/quota`);
  return response.data;
}
