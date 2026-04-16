import type { IdentityProviderCapabilities } from '../types/index.js';
import type { AxiosInstance } from 'axios';

/**
 * Get the active identity provider's capabilities.
 *
 * `GET {basePath}/capabilities`
 */
export async function getIdentityCapabilities(
  client: AxiosInstance,
  basePath: string
): Promise<IdentityProviderCapabilities> {
  const response = await client.get<IdentityProviderCapabilities>(`${basePath}/capabilities`);
  return response.data;
}
