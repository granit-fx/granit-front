import { getPage } from '@granit/query-engine';

import type {
  CreateSiteRequest,
  ListSitesParams,
  SiteResponse,
  UpdateSiteRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult } from '@granit/query-engine';

/** `GET /api/cms/sites` — QueryEngine grid (filter/sort/quickFilters). Requires `Cms.Sites.Read`. */
export async function listSites(
  client: AxiosInstance,
  basePath: string,
  params?: ListSitesParams,
  options?: { readonly signal?: AbortSignal }
): Promise<PagedResult<SiteResponse>> {
  return getPage<SiteResponse>(client, `${basePath}/api/cms/sites`, params ?? {}, options);
}

/** `GET /api/cms/sites/{id}`. Requires `Cms.Sites.Read`. */
export async function getSite(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<SiteResponse> {
  const res = await client.get<SiteResponse>(`${basePath}/api/cms/sites/${encodeURIComponent(id)}`);
  return res.data;
}

/** `POST /api/cms/sites`. Requires `Cms.Sites.Manage`. */
export async function createSite(
  client: AxiosInstance,
  basePath: string,
  request: CreateSiteRequest
): Promise<SiteResponse> {
  const res = await client.post<SiteResponse>(`${basePath}/api/cms/sites`, request);
  return res.data;
}

/** `PUT /api/cms/sites/{id}`. Requires `Cms.Sites.Manage`. */
export async function updateSite(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: UpdateSiteRequest
): Promise<SiteResponse> {
  const res = await client.put<SiteResponse>(
    `${basePath}/api/cms/sites/${encodeURIComponent(id)}`,
    request
  );
  return res.data;
}

/** `DELETE /api/cms/sites/{id}`. Requires `Cms.Sites.Manage`. Returns `204`. */
export async function deleteSite(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/api/cms/sites/${encodeURIComponent(id)}`);
}
