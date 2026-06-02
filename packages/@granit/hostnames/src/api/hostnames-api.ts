import type {
  CertificateStatusReportRequest,
  CheckAvailabilityResponse,
  CreateManagedHostnameRequest,
  ListHostnamesParams,
  ManagedHostnameResponse,
  PagedResponse,
  UpdateManagedHostnameRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List managed hostnames (paginated).
 *
 * `GET {basePath}`
 */
export async function listHostnames(
  client: AxiosInstance,
  basePath: string,
  params?: ListHostnamesParams
): Promise<PagedResponse<ManagedHostnameResponse>> {
  const { data } = await client.get<PagedResponse<ManagedHostnameResponse>>(basePath, { params });
  return data;
}

/**
 * Get a single managed hostname by ID.
 *
 * `GET {basePath}/{id}`
 */
export async function getHostname(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<ManagedHostnameResponse> {
  const { data } = await client.get<ManagedHostnameResponse>(
    `${basePath}/${encodeURIComponent(id)}`
  );
  return data;
}

/**
 * Create a new managed hostname.
 *
 * `POST {basePath}`
 */
export async function createHostname(
  client: AxiosInstance,
  basePath: string,
  request: CreateManagedHostnameRequest
): Promise<ManagedHostnameResponse> {
  const { data } = await client.post<ManagedHostnameResponse>(basePath, request);
  return data;
}

/**
 * Update a managed hostname (currently only `isPrimary` is patchable).
 *
 * `PATCH {basePath}/{id}`
 */
export async function updateHostname(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: UpdateManagedHostnameRequest
): Promise<ManagedHostnameResponse> {
  const { data } = await client.patch<ManagedHostnameResponse>(
    `${basePath}/${encodeURIComponent(id)}`,
    request
  );
  return data;
}

/**
 * Delete a managed hostname.
 *
 * `DELETE {basePath}/{id}`
 */
export async function deleteHostname(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/${encodeURIComponent(id)}`);
}

/**
 * Check whether a hostname is available (not already claimed by another owner).
 *
 * `GET {basePath}/check-availability?host=`
 */
export async function checkAvailability(
  client: AxiosInstance,
  basePath: string,
  host: string
): Promise<CheckAvailabilityResponse> {
  const { data } = await client.get<CheckAvailabilityResponse>(
    `${basePath}/check-availability`,
    { params: { host } }
  );
  return data;
}

/**
 * Trigger an immediate re-verification of the hostname's DNS records.
 *
 * `POST {basePath}/{id}/verify-now` — responds 204 No Content.
 */
export async function verifyNow(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.post(`${basePath}/${encodeURIComponent(id)}/verify-now`);
}

/**
 * Report a certificate status update from an external certificate provider.
 *
 * `POST {basePath}/{id}/certificate-status` — host-level webhook receiver.
 * Requires the `Hostnames.Certificates.Report` permission.
 */
export async function reportCertificateStatus(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: CertificateStatusReportRequest
): Promise<void> {
  await client.post(`${basePath}/${encodeURIComponent(id)}/certificate-status`, request);
}
