import type {
  TenantResponse,
  CreateTenantRequest,
  UpdateTenantRequest,
} from '../types/tenant-response';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Get a single tenant by ID.
 *
 * `GET {basePath}/tenants/{id}`
 */
export async function getTenant(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<TenantResponse> {
  const { data } = await client.get<TenantResponse>(
    `${basePath}/tenants/${encodeURIComponent(id)}`
  );
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
): Promise<TenantResponse> {
  const { data } = await client.post<TenantResponse>(`${basePath}/tenants`, request);
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
