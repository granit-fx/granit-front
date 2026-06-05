import { getPage } from '@granit/query-engine';

import type {
  PagedResult,
  QueryRequest,
  RedirectCreateRequest,
  RedirectMutationResult,
  RedirectPreviewResponse,
  RedirectResponse,
  RedirectUpdateRequest,
  SiteRedirectSettingsRequest,
  SiteRedirectSettingsResponse,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

const ROOT = '/api/cms/redirects';

/**
 * `GET {basePath}/api/cms/redirects/sites/{siteId}/redirects` — flat list of a site's
 * redirects (active and inactive, insertion order). Requires `Cms.Redirects.Read`.
 */
export async function listRedirects(
  client: AxiosInstance,
  basePath: string,
  siteId: string
): Promise<readonly RedirectResponse[]> {
  const res = await client.get<readonly RedirectResponse[]>(
    `${basePath}${ROOT}/sites/${encodeURIComponent(siteId)}/redirects`
  );
  return res.data;
}

/** `GET {basePath}/api/cms/redirects/{id}`. Requires `Cms.Redirects.Read`. */
export async function getRedirect(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<RedirectResponse> {
  const res = await client.get<RedirectResponse>(`${basePath}${ROOT}/${encodeURIComponent(id)}`);
  return res.data;
}

/**
 * `POST {basePath}/api/cms/redirects/sites/{siteId}/redirects` — creates a redirect (201).
 * Returns `422` on redirect loop / invalid path. Requires `Cms.Redirects.Manage`.
 */
export async function createRedirect(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  request: RedirectCreateRequest
): Promise<RedirectMutationResult> {
  const res = await client.post<RedirectMutationResult>(
    `${basePath}${ROOT}/sites/${encodeURIComponent(siteId)}/redirects`,
    request
  );
  return res.data;
}

/**
 * `PUT {basePath}/api/cms/redirects/{id}` — repoints target / status / match type and
 * toggles active. Source is immutable. Returns `422` on loop. Requires `Cms.Redirects.Manage`.
 */
export async function updateRedirect(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: RedirectUpdateRequest
): Promise<RedirectMutationResult> {
  const res = await client.put<RedirectMutationResult>(
    `${basePath}${ROOT}/${encodeURIComponent(id)}`,
    request
  );
  return res.data;
}

/** `DELETE {basePath}/api/cms/redirects/{id}` — soft delete (204). Requires `Cms.Redirects.Manage`. */
export async function deleteRedirect(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}${ROOT}/${encodeURIComponent(id)}`);
}

/**
 * `GET {basePath}/api/cms/redirects/sites/{siteId}/settings` — a site's redirect settings
 * (defaults when unsaved). Requires `Cms.Redirects.Read`.
 */
export async function getRedirectSettings(
  client: AxiosInstance,
  basePath: string,
  siteId: string
): Promise<SiteRedirectSettingsResponse> {
  const res = await client.get<SiteRedirectSettingsResponse>(
    `${basePath}${ROOT}/sites/${encodeURIComponent(siteId)}/settings`
  );
  return res.data;
}

/**
 * `PUT {basePath}/api/cms/redirects/sites/{siteId}/settings` — creates or replaces a site's
 * redirect settings. Requires `Cms.Redirects.Manage`.
 */
export async function updateRedirectSettings(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  request: SiteRedirectSettingsRequest
): Promise<SiteRedirectSettingsResponse> {
  const res = await client.put<SiteRedirectSettingsResponse>(
    `${basePath}${ROOT}/sites/${encodeURIComponent(siteId)}/settings`,
    request
  );
  return res.data;
}

/**
 * `GET {basePath}/api/cms/redirects/sites/{siteId}/preview?path={path}&culture={culture}` —
 * resolves a candidate path so editors can test a redirect. Requires `Cms.Redirects.Read`.
 */
export async function previewRedirect(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  params: { path: string; culture?: string }
): Promise<RedirectPreviewResponse> {
  const res = await client.get<RedirectPreviewResponse>(
    `${basePath}${ROOT}/sites/${encodeURIComponent(siteId)}/preview`,
    { params: { path: params.path, culture: params.culture } }
  );
  return res.data;
}

/**
 * `GET {basePath}/api/cms/redirects/grid` — paginated / filterable / sortable admin grid
 * backed by `MapGranitQuery<Redirect>` (QueryEngine). Requires `Cms.Redirects.Read`.
 */
export async function getRedirectsGrid(
  client: AxiosInstance,
  basePath: string,
  request: QueryRequest,
  options?: { readonly signal?: AbortSignal }
): Promise<PagedResult<RedirectResponse>> {
  return getPage<RedirectResponse>(client, `${basePath}${ROOT}/grid`, request, options);
}
