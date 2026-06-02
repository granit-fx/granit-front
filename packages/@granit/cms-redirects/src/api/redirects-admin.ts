import type {
  CreateRedirectRequest,
  ListRedirectsParams,
  PagedResponse,
  RedirectResponse,
  UpdateRedirectRequest,
} from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

/** `GET /api/cms/redirects` — paged list. Requires `Cms.Redirects.Read`. */
export async function listRedirects(
  client: AxiosInstance,
  basePath: string,
  params?: ListRedirectsParams
): Promise<PagedResponse<RedirectResponse>> {
  const res = await client.get<PagedResponse<RedirectResponse>>(`${basePath}/api/cms/redirects`, {
    params,
  });
  return res.data;
}

/** `POST /api/cms/redirects`. Returns `422` on redirect loop. Requires `Cms.Redirects.Manage`. */
export async function createRedirect(
  client: AxiosInstance,
  basePath: string,
  request: CreateRedirectRequest
): Promise<RedirectResponse> {
  const res = await client.post<RedirectResponse>(`${basePath}/api/cms/redirects`, request);
  return res.data;
}

/** `PUT /api/cms/redirects/{id}`. Returns `422` on redirect loop. Requires `Cms.Redirects.Manage`. */
export async function updateRedirect(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: UpdateRedirectRequest
): Promise<RedirectResponse> {
  const res = await client.put<RedirectResponse>(
    `${basePath}/api/cms/redirects/${encodeURIComponent(id)}`,
    request
  );
  return res.data;
}

/** `DELETE /api/cms/redirects/{id}`. Returns `204`. Requires `Cms.Redirects.Manage`. */
export async function deleteRedirect(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/api/cms/redirects/${encodeURIComponent(id)}`);
}
