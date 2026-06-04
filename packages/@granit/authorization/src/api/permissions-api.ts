import type {
  PermissionGrantResponse,
  PermissionGrantParams,
  PermissionGroupResponse,
  MyPermissionsResponse,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Fetches all permission definitions grouped by module.
 *
 * `GET {basePath}/permissions/definitions`
 */
export async function listPermissionDefinitions(
  client: AxiosInstance,
  basePath: string
): Promise<PermissionGroupResponse[]> {
  const response = await client.get<PermissionGroupResponse[]>(
    `${basePath}/permissions/definitions`
  );
  return response.data;
}

/**
 * Fetches the current user's granted permissions.
 *
 * `GET {basePath}/permissions`
 */
export async function getMyPermissions(
  client: AxiosInstance,
  basePath: string
): Promise<MyPermissionsResponse> {
  const response = await client.get<MyPermissionsResponse>(`${basePath}/permissions`);
  return response.data;
}

/**
 * Fetches the permissions granted to a specific role.
 *
 * `GET {basePath}/roles/{roleName}`
 */
export async function getRolePermissions(
  client: AxiosInstance,
  basePath: string,
  roleName: string
): Promise<PermissionGrantResponse> {
  const response = await client.get<PermissionGrantResponse>(
    `${basePath}/roles/${encodeURIComponent(roleName)}`
  );
  return response.data;
}

/**
 * Grants a permission to a role.
 *
 * `PUT {basePath}/roles/{roleName}/{permissionName}`
 */
export async function grantPermission(
  client: AxiosInstance,
  basePath: string,
  params: PermissionGrantParams
): Promise<void> {
  await client.put(
    `${basePath}/roles/${encodeURIComponent(params.roleName)}/${encodeURIComponent(params.permissionName)}`
  );
}

/**
 * Revokes a permission from a role.
 *
 * `DELETE {basePath}/roles/{roleName}/{permissionName}`
 */
export async function revokePermission(
  client: AxiosInstance,
  basePath: string,
  params: PermissionGrantParams
): Promise<void> {
  await client.delete(
    `${basePath}/roles/${encodeURIComponent(params.roleName)}/${encodeURIComponent(params.permissionName)}`
  );
}
