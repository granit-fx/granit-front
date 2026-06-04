import type { AccountProfileResponse, AccountProfileUpdateRequest } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Get the authenticated user's profile.
 *
 * `GET {basePath}/profile`
 */
export async function getProfile(
  client: AxiosInstance,
  basePath: string
): Promise<AccountProfileResponse> {
  const { data } = await client.get<AccountProfileResponse>(`${basePath}/profile`);
  return data;
}

/**
 * Update the authenticated user's profile (first/last name).
 *
 * `PUT {basePath}/profile`
 */
export async function updateProfile(
  client: AxiosInstance,
  basePath: string,
  request: AccountProfileUpdateRequest
): Promise<AccountProfileResponse> {
  const { data } = await client.put<AccountProfileResponse>(`${basePath}/profile`, request);
  return data;
}
