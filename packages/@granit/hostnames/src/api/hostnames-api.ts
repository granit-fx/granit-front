import type {
  CreateManagedHostnameRequest,
  HostnameAvailabilityResponse,
  ListHostnamesParams,
  ManagedHostnameResponse,
  ReportCertificateStatusRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List managed hostnames for an owner.
 *
 * `GET {basePath}?ownerType=&ownerId=&maxResults=`
 *
 * Returns at most `maxResults` entries (default 100, capped at 500 server-side).
 */
export async function listHostnames(
  client: AxiosInstance,
  basePath: string,
  params: ListHostnamesParams
): Promise<readonly ManagedHostnameResponse[]> {
  const { data } = await client.get<readonly ManagedHostnameResponse[]>(basePath, { params });
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
 * Mark a hostname as the owner's canonical (primary) hostname.
 *
 * `POST {basePath}/{id}/primary` — responds 204 No Content.
 */
export async function setPrimary(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.post(`${basePath}/${encodeURIComponent(id)}/primary`);
}

/**
 * Clear the canonical (primary) flag from a hostname.
 *
 * `DELETE {basePath}/{id}/primary` — responds 204 No Content.
 */
export async function clearPrimary(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/${encodeURIComponent(id)}/primary`);
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
 * `GET {basePath}/availability?host=`
 */
export async function checkAvailability(
  client: AxiosInstance,
  basePath: string,
  host: string
): Promise<HostnameAvailabilityResponse> {
  const { data } = await client.get<HostnameAvailabilityResponse>(`${basePath}/availability`, {
    params: { host },
  });
  return data;
}

/**
 * Trigger an immediate re-verification of the hostname's DNS records.
 *
 * `POST {basePath}/{id}/verify-now` — responds 202 Accepted with the updated hostname record.
 */
export async function verifyNow(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<ManagedHostnameResponse> {
  const { data } = await client.post<ManagedHostnameResponse>(
    `${basePath}/${encodeURIComponent(id)}/verify-now`
  );
  return data;
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
  request: ReportCertificateStatusRequest
): Promise<void> {
  await client.post(`${basePath}/${encodeURIComponent(id)}/certificate-status`, request);
}
