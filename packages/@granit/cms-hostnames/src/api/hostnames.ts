import {
  checkAvailability,
  createHostname,
  deleteHostname,
  listHostnames,
  setPrimary,
  clearPrimary,
  verifyNow,
} from '@granit/hostnames';

import type { AxiosInstance } from '@granit/api-client';
import type {
  CheckAvailabilityResponse,
  CreateManagedHostnameRequest,
  ListHostnamesParams,
  ManagedHostnameResponse,
} from '@granit/hostnames';

/** Builds the base URL for a site's hostname collection. */
function siteHostnamesBase(basePath: string, siteId: string): string {
  return `${basePath}/api/cms/sites/${encodeURIComponent(siteId)}/hostnames`;
}

/** `GET /api/cms/sites/{siteId}/hostnames`. Requires `Cms.Sites.Read`. */
export async function listSiteHostnames(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  params?: Pick<ListHostnamesParams, 'maxResults'>
): Promise<readonly ManagedHostnameResponse[]> {
  return listHostnames(client, siteHostnamesBase(basePath, siteId), {
    ownerType: 'cms.site',
    ownerId: siteId,
    ...params,
  });
}

/** `POST /api/cms/sites/{siteId}/hostnames`. Requires `Cms.Sites.Manage`. Returns `409` if host is taken. */
export async function addSiteHostname(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  request: Pick<CreateManagedHostnameRequest, 'host' | 'isPrimary'>
): Promise<ManagedHostnameResponse> {
  return createHostname(client, siteHostnamesBase(basePath, siteId), {
    ...request,
    ownerType: 'cms.site',
    ownerId: siteId,
  });
}

/** `DELETE /api/cms/sites/{siteId}/hostnames/{hostnameId}`. Requires `Cms.Sites.Manage`. Returns `204`. */
export async function removeSiteHostname(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  hostnameId: string
): Promise<void> {
  return deleteHostname(client, siteHostnamesBase(basePath, siteId), hostnameId);
}

/** `POST /api/cms/sites/{siteId}/hostnames/{hostnameId}/primary` — set as primary. Requires `Cms.Sites.Manage`. */
export async function setSiteHostnamePrimary(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  hostnameId: string
): Promise<void> {
  return setPrimary(client, siteHostnamesBase(basePath, siteId), hostnameId);
}

/** `DELETE /api/cms/sites/{siteId}/hostnames/{hostnameId}/primary` — clear primary flag. Requires `Cms.Sites.Manage`. */
export async function clearSiteHostnamePrimary(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  hostnameId: string
): Promise<void> {
  return clearPrimary(client, siteHostnamesBase(basePath, siteId), hostnameId);
}

/** `GET /api/cms/sites/{siteId}/hostnames/availability?host=`. Debounce while typing. */
export async function checkSiteHostnameAvailability(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  host: string
): Promise<CheckAvailabilityResponse> {
  return checkAvailability(client, siteHostnamesBase(basePath, siteId), host);
}

/** `POST /api/cms/sites/{siteId}/hostnames/{hostnameId}/verify-now` — re-check DNS (202). */
export async function verifySiteHostname(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  hostnameId: string
): Promise<ManagedHostnameResponse> {
  return verifyNow(client, siteHostnamesBase(basePath, siteId), hostnameId);
}
