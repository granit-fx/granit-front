import type {
  AddReleaseActionRequest,
  CreateReleaseRequest,
  ListReleasesParams,
  PagedResponse,
  ReleaseResponse,
  ScheduleReleaseRequest,
  UpdateReleaseRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/** `GET /api/cms/releases` — paged list. Requires `Cms.Releases.Read`. */
export async function listReleases(
  client: AxiosInstance,
  basePath: string,
  params?: ListReleasesParams
): Promise<PagedResponse<ReleaseResponse>> {
  const res = await client.get<PagedResponse<ReleaseResponse>>(`${basePath}/api/cms/releases`, {
    params,
  });
  return res.data;
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

/** `DELETE /api/cms/releases/{id}`. Requires `Cms.Releases.Manage`. Returns `204`. */
export async function deleteRelease(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/api/cms/releases/${encodeURIComponent(id)}`);
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

/** `DELETE /api/cms/releases/{id}/actions/{actionId}`. Requires `Cms.Releases.Manage`. Returns `204`. */
export async function removeReleaseAction(
  client: AxiosInstance,
  basePath: string,
  id: string,
  actionId: string
): Promise<void> {
  await client.delete(
    `${basePath}/api/cms/releases/${encodeURIComponent(id)}/actions/${encodeURIComponent(actionId)}`
  );
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

/** `POST /api/cms/releases/{id}/cancel`. Requires `Cms.Releases.Manage`. Returns `204`. */
export async function cancelRelease(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.post(`${basePath}/api/cms/releases/${encodeURIComponent(id)}/cancel`);
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
