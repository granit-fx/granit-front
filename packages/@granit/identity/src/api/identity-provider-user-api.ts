import type {
  IdentityUser,
  IdentityUserCreateRequest,
  IdentityUserUpdateRequest,
} from '../types/index.js';
import type { UserId } from '@granit/types';
import type { AxiosInstance } from 'axios';

export type IdentityProviderUserListParams = {
  readonly search?: string;
  readonly first?: number;
  readonly max?: number;
};

/**
 * List/search users from the identity provider.
 *
 * `GET {basePath}/users`
 */
export async function fetchProviderUsers(
  client: AxiosInstance,
  basePath: string,
  params?: IdentityProviderUserListParams
): Promise<readonly IdentityUser[]> {
  const response = await client.get<readonly IdentityUser[]>(`${basePath}/users`, { params });
  return response.data;
}

/**
 * Get a single user by ID from the identity provider.
 *
 * `GET {basePath}/users/{userId}`
 */
export async function fetchProviderUser(
  client: AxiosInstance,
  basePath: string,
  userId: UserId
): Promise<IdentityUser> {
  const response = await client.get<IdentityUser>(
    `${basePath}/users/${encodeURIComponent(userId)}`
  );
  return response.data;
}

/**
 * Create a new user in the identity provider.
 * May return 501 if `supportsUserCreation` is false.
 *
 * `POST {basePath}/users`
 */
export async function createUser(
  client: AxiosInstance,
  basePath: string,
  request: IdentityUserCreateRequest
): Promise<IdentityUser> {
  const response = await client.post<IdentityUser>(`${basePath}/users`, request);
  return response.data;
}

/**
 * Update an existing user in the identity provider.
 *
 * `PUT {basePath}/users/{userId}`
 */
export async function updateUser(
  client: AxiosInstance,
  basePath: string,
  userId: UserId,
  request: IdentityUserUpdateRequest
): Promise<IdentityUser> {
  const response = await client.put<IdentityUser>(
    `${basePath}/users/${encodeURIComponent(userId)}`,
    request
  );
  return response.data;
}

/**
 * Enable or disable a user in the identity provider.
 *
 * `PATCH {basePath}/users/{userId}/enabled`
 */
export async function setUserEnabled(
  client: AxiosInstance,
  basePath: string,
  userId: UserId,
  enabled: boolean
): Promise<void> {
  await client.patch(`${basePath}/users/${encodeURIComponent(userId)}/enabled`, { enabled });
}
