import { getPage } from '@granit/query-engine';

import type {
  AddReleaseActionRequest,
  CreateReleaseRequest,
  ListReleasesParams,
  ReleaseResponse,
  ScheduleReleaseRequest,
  UpdateReleaseRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult } from '@granit/query-engine';

/** `GET /api/cms/releases` — QueryEngine grid (filter/sort/quickFilters). Requires `Cms.Releases.Read`. */
export async function listReleases(
  client: AxiosInstance,
  basePath: string,
  params?: ListReleasesParams,
  options?: { readonly signal?: AbortSignal }
): Promise<PagedResult<ReleaseResponse>> {
  return getPage<ReleaseResponse>(client, `${basePath}/api/cms/releases`, params ?? {}, options);
}

/** `GET /api/cms/releases/{id}`. Requires `Cms.Releases.Read`. */
export async function getRelease(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<ReleaseResponse> {
  const res = await client.get<ReleaseResponse>(
    `${basePath}/api/cms/releases/${encodeURIComponent(id)}`
  );
  return res.data;
}

/** `POST /api/cms/releases`. Requires `Cms.Releases.Manage`. */
export async function createRelease(
  client: AxiosInstance,
  basePath: string,
  request: CreateReleaseRequest
): Promise<ReleaseResponse> {
  const res = await client.post<ReleaseResponse>(`${basePath}/api/cms/releases`, request);
  return res.data;
}

/** `PUT /api/cms/releases/{id}`. Requires `Cms.Releases.Manage`. */
export async function updateRelease(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: UpdateReleaseRequest
): Promise<ReleaseResponse> {
  const res = await client.put<ReleaseResponse>(
    `${basePath}/api/cms/releases/${encodeURIComponent(id)}`,
    request
  );
  return res.data;
}

/** `POST /api/cms/releases/{id}/actions`. Requires `Cms.Releases.Manage`. */
export async function addReleaseAction(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: AddReleaseActionRequest
): Promise<ReleaseResponse> {
  const res = await client.post<ReleaseResponse>(
    `${basePath}/api/cms/releases/${encodeURIComponent(id)}/actions`,
    request
  );
  return res.data;
}

/** `DELETE /api/cms/releases/{id}/actions/{actionId}`. Requires `Cms.Releases.Manage`. Returns the updated release. */
export async function removeReleaseAction(
  client: AxiosInstance,
  basePath: string,
  id: string,
  actionId: string
): Promise<ReleaseResponse> {
  const res = await client.delete<ReleaseResponse>(
    `${basePath}/api/cms/releases/${encodeURIComponent(id)}/actions/${encodeURIComponent(actionId)}`
  );
  return res.data;
}

/** `POST /api/cms/releases/{id}/schedule`. Requires `Cms.Releases.Manage`. */
export async function scheduleRelease(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: ScheduleReleaseRequest
): Promise<ReleaseResponse> {
  const res = await client.post<ReleaseResponse>(
    `${basePath}/api/cms/releases/${encodeURIComponent(id)}/schedule`,
    request
  );
  return res.data;
}

/** `POST /api/cms/releases/{id}/cancel`. Requires `Cms.Releases.Manage`. Returns the updated release. */
export async function cancelRelease(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<ReleaseResponse> {
  const res = await client.post<ReleaseResponse>(
    `${basePath}/api/cms/releases/${encodeURIComponent(id)}/cancel`
  );
  return res.data;
}

/** `POST /api/cms/releases/{id}/publish` — immediate publish. Requires `Cms.Releases.Publish`. */
export async function publishRelease(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<ReleaseResponse> {
  const res = await client.post<ReleaseResponse>(
    `${basePath}/api/cms/releases/${encodeURIComponent(id)}/publish`
  );
  return res.data;
}
