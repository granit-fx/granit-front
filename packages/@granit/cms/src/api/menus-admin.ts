import { getPage } from '@granit/query-engine';

import type {
  CreateMenuRequest,
  ListMenusParams,
  MenuResponse,
  UpdateMenuRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult } from '@granit/query-engine';

/** `GET /api/cms/menus` — QueryEngine grid (filter/sort/quickFilters). Requires `Cms.Menus.Read`. */
export async function listMenus(
  client: AxiosInstance,
  basePath: string,
  params?: ListMenusParams,
  options?: { readonly signal?: AbortSignal }
): Promise<PagedResult<MenuResponse>> {
  return getPage<MenuResponse>(client, `${basePath}/menus`, params ?? {}, options);
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
  request: CreateMenuRequest
): Promise<MenuResponse> {
  const res = await client.post<MenuResponse>(`${basePath}/menus`, request);
  return res.data;
}

/** `PUT /api/cms/menus/{id}`. Requires `Cms.Menus.Manage`. */
export async function updateMenu(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: UpdateMenuRequest
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
