import type { AdminTenant, CreateTenantRequest, UpdateTenantRequest } from '../types/admin-tenant';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List all tenants.
 *
 * `GET {basePath}/tenants`
 */
export async function listTenants(
  client: AxiosInstance,
  basePath: string
): Promise<readonly AdminTenant[]> {
  const { data } = await client.get<readonly AdminTenant[]>(`${basePath}/tenants`);
  return data;
}

/**
 * Get a single tenant by ID.
 *
 * `GET {basePath}/tenants/{id}`
 */
export async function getTenant(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<AdminTenant> {
  const { data } = await client.get<AdminTenant>(`${basePath}/tenants/${encodeURIComponent(id)}`);
  return data;
}

/**
 * Create a new tenant.
 *
 * `POST {basePath}/tenants`
 */
export async function createTenant(
  client: AxiosInstance,
  basePath: string,
  request: CreateTenantRequest
): Promise<AdminTenant> {
  const { data } = await client.post<AdminTenant>(`${basePath}/tenants`, request);
  return data;
}

/**
 * Update an existing tenant.
 *
 * `PUT {basePath}/tenants/{id}`
 */
export async function updateTenant(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: UpdateTenantRequest
): Promise<void> {
  await client.put(`${basePath}/tenants/${encodeURIComponent(id)}`, request);
}

/**
 * Activate a tenant.
 *
 * `POST {basePath}/tenants/{id}/activate`
 */
export async function activateTenant(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.post(`${basePath}/tenants/${encodeURIComponent(id)}/activate`);
}

/**
 * Deactivate a tenant.
 *
 * `POST {basePath}/tenants/{id}/deactivate`
 */
export async function deactivateTenant(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.post(`${basePath}/tenants/${encodeURIComponent(id)}/deactivate`);
}
