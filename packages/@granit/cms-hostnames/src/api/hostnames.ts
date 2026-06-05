import type {
  SiteHostnameAvailabilityResponse,
  SiteHostnameCreateRequest,
  SiteHostnameResponse,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/** Builds the base URL for a site's hostname collection. */
function siteHostnamesBase(basePath: string, siteId: string): string {
  return `${basePath}/api/cms/sites/${encodeURIComponent(siteId)}/hostnames`;
}

/**
 * List a site's managed hostnames.
 *
 * `GET /api/cms/sites/{siteId}/hostnames` — returns a bare array. Requires
 * `Cms.Sites.Read`.
 */
export async function listSiteHostnames(
  client: AxiosInstance,
  basePath: string,
  siteId: string
): Promise<readonly SiteHostnameResponse[]> {
  const { data } = await client.get<readonly SiteHostnameResponse[]>(
    siteHostnamesBase(basePath, siteId)
  );
  return data;
}

/**
 * Pre-check whether a hostname can be registered (globally unique).
 *
 * `GET /api/cms/sites/{siteId}/hostnames/availability?host=` — a malformed FQDN
 * returns `400`. Requires `Cms.Sites.Read`. Debounce while typing.
 */
export async function checkSiteHostnameAvailability(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  host: string
): Promise<SiteHostnameAvailabilityResponse> {
  const { data } = await client.get<SiteHostnameAvailabilityResponse>(
    `${siteHostnamesBase(basePath, siteId)}/availability`,
    { params: { host } }
  );
  return data;
}

/**
 * Register a hostname for the site and start DNS verification.
 *
 * `POST /api/cms/sites/{siteId}/hostnames` (201) — returns `409` if the host is
 * already taken, `404` if the site is unknown. Requires `Cms.Sites.Manage`.
 */
export async function addSiteHostname(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  request: SiteHostnameCreateRequest
): Promise<SiteHostnameResponse> {
  const { data } = await client.post<SiteHostnameResponse>(
    siteHostnamesBase(basePath, siteId),
    request
  );
  return data;
}

/**
 * Remove a hostname from the site, freeing it for re-registration.
 *
 * `DELETE /api/cms/sites/{siteId}/hostnames/{hostnameId}` (204) — `404` when the
 * hostname is not owned by this site. Requires `Cms.Sites.Manage`.
 */
export async function removeSiteHostname(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  hostnameId: string
): Promise<void> {
  await client.delete(`${siteHostnamesBase(basePath, siteId)}/${encodeURIComponent(hostnameId)}`);
}

/**
 * Trigger DNS re-verification of a site hostname.
 *
 * `POST /api/cms/sites/{siteId}/hostnames/{hostnameId}/verify-now` (202) —
 * returns the updated hostname. `409` when pending and the platform ingress
 * target is not configured. Requires `Cms.Sites.Manage`.
 */
export async function verifySiteHostname(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  hostnameId: string
): Promise<SiteHostnameResponse> {
  const { data } = await client.post<SiteHostnameResponse>(
    `${siteHostnamesBase(basePath, siteId)}/${encodeURIComponent(hostnameId)}/verify-now`
  );
  return data;
}
