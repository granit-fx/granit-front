import { getPage, getQueryMeta } from '@granit/query-engine';

import type {
  CreateSiteRequest,
  ListSitesParams,
  SetSiteHomePageRequest,
  SiteResponse,
  UpdateSiteRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult, QueryMetadata } from '@granit/query-engine';

/** `GET /api/cms/sites` — QueryEngine grid (filter/sort/quickFilters). Requires `Cms.Sites.Read`. */
export async function listSites(
  client: AxiosInstance,
  basePath: string,
  params?: ListSitesParams,
  options?: { readonly signal?: AbortSignal }
): Promise<PagedResult<SiteResponse>> {
  return getPage<SiteResponse>(client, `${basePath}/sites`, params ?? {}, options);
}

/** `GET /api/cms/sites/meta` — QueryEngine grid metadata (columns/filters). Requires `Cms.Sites.Read`. */
export async function getSitesMeta(
  client: AxiosInstance,
  basePath: string,
  options?: { readonly signal?: AbortSignal }
): Promise<QueryMetadata> {
  return getQueryMeta(client, `${basePath}/sites`, options);
}

/** `GET /api/cms/sites/{id}`. Requires `Cms.Sites.Read`. */
export async function getSite(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<SiteResponse> {
  const res = await client.get<SiteResponse>(`${basePath}/sites/${encodeURIComponent(id)}`);
  return res.data;
}

/** `POST /api/cms/sites`. Requires `Cms.Sites.Manage`. */
export async function createSite(
  client: AxiosInstance,
  basePath: string,
  request: CreateSiteRequest
): Promise<SiteResponse> {
  const res = await client.post<SiteResponse>(`${basePath}/sites`, request);
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
    `${basePath}/sites/${encodeURIComponent(id)}`,
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
  await client.delete(`${basePath}/sites/${encodeURIComponent(id)}`);
}

/** `PUT /api/cms/sites/{id}/home-page` — designate the page served at `/`. Requires `Cms.Sites.Manage`. */
export async function setSiteHomePage(
  client: AxiosInstance,
  basePath: string,
  id: string,
  body: SetSiteHomePageRequest
): Promise<SiteResponse> {
  const res = await client.put<SiteResponse>(
    `${basePath}/sites/${encodeURIComponent(id)}/home-page`,
    body
  );
  return res.data;
}

/** `DELETE /api/cms/sites/{id}/home-page` — clear the site home page. Requires `Cms.Sites.Manage`. */
export async function clearSiteHomePage(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<SiteResponse> {
  const res = await client.delete<SiteResponse>(
    `${basePath}/sites/${encodeURIComponent(id)}/home-page`
  );
  return res.data;
}
