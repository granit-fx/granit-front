import type { IdentityProviderCapabilitiesResponse } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Get the active identity provider's capabilities.
 *
 * `GET {basePath}/capabilities`
 */
export async function getIdentityCapabilities(
  client: AxiosInstance,
  basePath: string
): Promise<IdentityProviderCapabilitiesResponse> {
  const response = await client.get<IdentityProviderCapabilitiesResponse>(
    `${basePath}/capabilities`
  );
  return response.data;
}
