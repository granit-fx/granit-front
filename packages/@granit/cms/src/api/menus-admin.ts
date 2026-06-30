import { getPage, getQueryMeta } from '@granit/query-engine';

import type {
  MenuCreateRequest,
  ListMenusParams,
  MenuResponse,
  MenuUpdateRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult, QueryMetadata } from '@granit/query-engine';

/** `GET /api/cms/menus` — QueryEngine grid (filter/sort/quickFilters). Requires `Cms.Menus.Read`. */
export async function listMenus(
  client: AxiosInstance,
  basePath: string,
  params?: ListMenusParams,
  options?: { readonly signal?: AbortSignal }
): Promise<PagedResult<MenuResponse>> {
  return getPage<MenuResponse>(client, `${basePath}/menus`, params ?? {}, options);
}

/** `GET /api/cms/menus/meta` — QueryEngine grid metadata (columns/filters). Requires `Cms.Menus.Read`. */
export async function getMenusMeta(
  client: AxiosInstance,
  basePath: string,
  options?: { readonly signal?: AbortSignal }
): Promise<QueryMetadata> {
  return getQueryMeta(client, `${basePath}/menus`, options);
}

/** `GET /api/cms/menus/{id}`. Requires `Cms.Menus.Read`. */
export async function getMenu(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<MenuResponse> {
  const res = await client.get<MenuResponse>(`${basePath}/menus/${encodeURIComponent(id)}`);
  return res.data;
}

/** `POST /api/cms/menus`. Requires `Cms.Menus.Manage`. Returns `409` if `key` is not unique per site. */
export async function createMenu(
  client: AxiosInstance,
  basePath: string,
  request: MenuCreateRequest
): Promise<MenuResponse> {
  const res = await client.post<MenuResponse>(`${basePath}/menus`, request);
  return res.data;
}

/** `PUT /api/cms/menus/{id}`. Requires `Cms.Menus.Manage`. */
export async function updateMenu(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: MenuUpdateRequest
): Promise<MenuResponse> {
  const res = await client.put<MenuResponse>(
    `${basePath}/menus/${encodeURIComponent(id)}`,
    request
  );
  return res.data;
}

/** `DELETE /api/cms/menus/{id}`. Requires `Cms.Menus.Manage`. Returns `204`. */
export async function deleteMenu(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/menus/${encodeURIComponent(id)}`);
}
