import type { IdentityGroup } from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';
import type { UserId } from '@granit/types';

/**
 * List all groups from the identity provider.
 *
 * `GET {basePath}/groups`
 */
export async function listGroups(
  client: AxiosInstance,
  basePath: string
): Promise<readonly IdentityGroup[]> {
  const response = await client.get<readonly IdentityGroup[]>(`${basePath}/groups`);
  return response.data;
}

/**
 * List groups a user belongs to.
 *
 * `GET {basePath}/users/{userId}/groups`
 */
export async function listUserGroups(
  client: AxiosInstance,
  basePath: string,
  userId: UserId
): Promise<readonly IdentityGroup[]> {
  const response = await client.get<readonly IdentityGroup[]>(
    `${basePath}/users/${encodeURIComponent(userId)}/groups`
  );
  return response.data;
}

/**
 * Add a user to a group (idempotent).
 *
 * `PUT {basePath}/users/{userId}/groups/{groupId}`
 */
export async function addUserToGroup(
  client: AxiosInstance,
  basePath: string,
  userId: UserId,
  groupId: string
): Promise<void> {
  await client.put(
    `${basePath}/users/${encodeURIComponent(userId)}/groups/${encodeURIComponent(groupId)}`
  );
}

/**
 * Remove a user from a group (idempotent).
 *
 * `DELETE {basePath}/users/{userId}/groups/{groupId}`
 */
export async function removeUserFromGroup(
  client: AxiosInstance,
  basePath: string,
  userId: UserId,
  groupId: string
): Promise<void> {
  await client.delete(
    `${basePath}/users/${encodeURIComponent(userId)}/groups/${encodeURIComponent(groupId)}`
  );
}
