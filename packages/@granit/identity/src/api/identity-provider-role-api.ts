import type { IdentityRole, IdentityUser } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { UserId } from '@granit/types';

/**
 * List all roles from the identity provider.
 *
 * `GET {basePath}/roles`
 */
export async function listRoles(
  client: AxiosInstance,
  basePath: string
): Promise<readonly IdentityRole[]> {
  const response = await client.get<readonly IdentityRole[]>(`${basePath}/roles`);
  return response.data;
}

/**
 * List members of a role from the identity provider.
 *
 * `GET {basePath}/roles/{roleName}/members`
 */
export async function listRoleMembers(
  client: AxiosInstance,
  basePath: string,
  roleName: string
): Promise<readonly IdentityUser[]> {
  const response = await client.get<readonly IdentityUser[]>(
    `${basePath}/roles/${encodeURIComponent(roleName)}/members`
  );
  return response.data;
}

/**
 * List roles assigned to a user.
 *
 * `GET {basePath}/users/{userId}/roles`
 */
export async function listUserRoles(
  client: AxiosInstance,
  basePath: string,
  userId: UserId
): Promise<readonly IdentityRole[]> {
  const response = await client.get<readonly IdentityRole[]>(
    `${basePath}/users/${encodeURIComponent(userId)}/roles`
  );
  return response.data;
}

/**
 * Assign a role to a user (idempotent).
 *
 * `PUT {basePath}/users/{userId}/roles/{roleName}`
 */
export async function assignRole(
  client: AxiosInstance,
  basePath: string,
  userId: UserId,
  roleName: string
): Promise<void> {
  await client.put(
    `${basePath}/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleName)}`
  );
}

/**
 * Remove a role from a user (idempotent).
 *
 * `DELETE {basePath}/users/{userId}/roles/{roleName}`
 */
export async function removeRole(
  client: AxiosInstance,
  basePath: string,
  userId: UserId,
  roleName: string
): Promise<void> {
  await client.delete(
    `${basePath}/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleName)}`
  );
}
