import type { PageEditingPresenceResponse } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Records or refreshes the caller's presence in the page-editing room.
 * `POST {basePath}/api/cms/pages/{id}/editing/heartbeat` + `X-Granit-Site: {siteId}`.
 * Idempotent. Requires `Cms.Pages.Manage`. Returns the active editors.
 */
export async function sendPageEditingHeartbeat(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  id: string
): Promise<PageEditingPresenceResponse> {
  const res = await client.post<PageEditingPresenceResponse>(
    `${basePath}/api/cms/pages/${encodeURIComponent(id)}/editing/heartbeat`,
    undefined,
    { headers: { 'X-Granit-Site': siteId } }
  );
  return res.data;
}

/**
 * Lists the editors currently in the page-editing room (freshest first).
 * `GET {basePath}/api/cms/pages/{id}/editing` + `X-Granit-Site: {siteId}`.
 * Requires `Cms.Pages.Read`.
 */
export async function getPageEditingPresence(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  id: string
): Promise<PageEditingPresenceResponse> {
  const res = await client.get<PageEditingPresenceResponse>(
    `${basePath}/api/cms/pages/${encodeURIComponent(id)}/editing`,
    { headers: { 'X-Granit-Site': siteId } }
  );
  return res.data;
}

/**
 * Removes the caller from the page-editing room (e.g. on tab close).
 * `DELETE {basePath}/api/cms/pages/{id}/editing` + `X-Granit-Site: {siteId}`.
 * Requires `Cms.Pages.Manage`. Returns `204 NoContent`.
 */
export async function leavePageEditing(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/api/cms/pages/${encodeURIComponent(id)}/editing`, {
    headers: { 'X-Granit-Site': siteId },
  });
}
