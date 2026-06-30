import { getPage as getResultsPage } from '@granit/query-engine';

import type {
  CreatePageRequest,
  ListPagesParams,
  MovePageRequest,
  PageDraftConflictResponse,
  PageResponse,
  PageTreeNodeResponse,
  PageVersionSummaryResponse,
  SaveDraftContentRequest,
  SaveDraftResult,
  RenamePageRequest,
  SetPageTranslationRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult } from '@granit/query-engine';

/** `GET /api/cms/pages/tree` — flat list ordered as tree. Requires `Cms.Pages.Read`. */
export async function getPageTree(
  client: AxiosInstance,
  basePath: string,
  siteId: string
): Promise<readonly PageTreeNodeResponse[]> {
  const res = await client.get<readonly PageTreeNodeResponse[]>(`${basePath}/pages/tree`, {
    headers: { 'X-Granit-Site': siteId },
  });
  return res.data;
}

/** `GET /api/cms/pages` — QueryEngine grid (filter/sort/quickFilters). Requires `Cms.Pages.Read`. */
export async function listPages(
  client: AxiosInstance,
  basePath: string,
  params?: ListPagesParams,
  options?: { readonly signal?: AbortSignal }
): Promise<PagedResult<PageResponse>> {
  return getResultsPage<PageResponse>(client, `${basePath}/pages`, params ?? {}, options);
}

/** `GET /api/cms/pages/{id}`. Requires `Cms.Pages.Read`. */
export async function getPage(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<PageResponse> {
  const res = await client.get<PageResponse>(`${basePath}/pages/${encodeURIComponent(id)}`);
  return res.data;
}

/** `POST /api/cms/pages`. Requires `Cms.Pages.Manage`. */
export async function createPage(
  client: AxiosInstance,
  basePath: string,
  request: CreatePageRequest
): Promise<PageResponse> {
  const res = await client.post<PageResponse>(`${basePath}/pages`, request);
  return res.data;
}

/** `PUT /api/cms/pages/{id}` — rename slug. Requires `Cms.Pages.Manage`. */
export async function updatePage(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: RenamePageRequest
): Promise<PageResponse> {
  const res = await client.put<PageResponse>(
    `${basePath}/pages/${encodeURIComponent(id)}`,
    request
  );
  return res.data;
}

/** `PUT /api/cms/pages/{id}/translations/{culture}`. Requires `Cms.Pages.Manage`. */
export async function updatePageTranslation(
  client: AxiosInstance,
  basePath: string,
  id: string,
  culture: string,
  request: SetPageTranslationRequest
): Promise<PageResponse> {
  const res = await client.put<PageResponse>(
    `${basePath}/pages/${encodeURIComponent(id)}/translations/${encodeURIComponent(culture)}`,
    request
  );
  return res.data;
}

/** `POST /api/cms/pages/{id}/move` — reparent. Requires `Cms.Pages.Manage`. Returns the moved page. */
export async function movePage(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: MovePageRequest
): Promise<PageResponse> {
  const res = await client.post<PageResponse>(
    `${basePath}/pages/${encodeURIComponent(id)}/move`,
    request
  );
  return res.data;
}

/** `DELETE /api/cms/pages/{id}`. Requires `Cms.Pages.Manage`. Returns `204`. */
export async function deletePage(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/pages/${encodeURIComponent(id)}`);
}

/**
 * `PUT /api/cms/pages/{id}/draft/{culture}` — save working copy.
 * Returns `{ ok: false, conflict }` on `409` (concurrent edit).
 * Requires `Cms.Pages.Manage`.
 */
export async function saveDraft(
  client: AxiosInstance,
  basePath: string,
  id: string,
  culture: string,
  request: SaveDraftContentRequest
): Promise<SaveDraftResult> {
  const res = await client.put<PageVersionSummaryResponse | PageDraftConflictResponse>(
    `${basePath}/pages/${encodeURIComponent(id)}/draft/${encodeURIComponent(culture)}`,
    request,
    { validateStatus: (s) => s === 200 || s === 409 }
  );
  if (res.status === 409) {
    return { ok: false, conflict: res.data as PageDraftConflictResponse };
  }
  return { ok: true, version: res.data as PageVersionSummaryResponse };
}

/** `GET /api/cms/pages/{id}/versions`. Requires `Cms.Pages.Read`. */
export async function listPageVersions(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<readonly PageVersionSummaryResponse[]> {
  const res = await client.get<readonly PageVersionSummaryResponse[]>(
    `${basePath}/pages/${encodeURIComponent(id)}/versions`
  );
  return res.data;
}

/** `POST /api/cms/pages/{id}/publish`. Requires `Cms.Pages.Publish`. */
export async function publishPage(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.post(`${basePath}/pages/${encodeURIComponent(id)}/publish`);
}

/** `POST /api/cms/pages/{id}/unpublish`. Requires `Cms.Pages.Publish`. */
export async function unpublishPage(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.post(`${basePath}/pages/${encodeURIComponent(id)}/unpublish`);
}

/**
 * `POST /api/cms/pages/{id}/rollback/{versionId}` — clone the target snapshot's
 * content into a fresh draft. Requires `Cms.Pages.Publish`. Returns `204 NoContent`.
 */
export async function rollbackPage(
  client: AxiosInstance,
  basePath: string,
  id: string,
  versionId: string
): Promise<void> {
  await client.post(
    `${basePath}/pages/${encodeURIComponent(id)}/rollback/${encodeURIComponent(versionId)}`
  );
}
