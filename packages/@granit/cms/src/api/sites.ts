import type { AxiosInstance } from 'axios';

import type {
  CreateSiteRequest,
  PagedResponse,
  SiteResponse,
  UpdateSiteRequest,
} from '../types/index';

export interface ListSitesParams {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
}

/** `GET /api/cms/sites` — list sites (paged). Requires `Cms.Sites.Read`. */
export async function listSites(
  client: AxiosInstance,
  basePath: string,
  params?: ListSitesParams
): Promise<PagedResponse<SiteResponse>> {
  const res = await client.get<PagedResponse<SiteResponse>>(`${basePath}/api/cms/sites`, {
    params,
  });
  return res.data;
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
