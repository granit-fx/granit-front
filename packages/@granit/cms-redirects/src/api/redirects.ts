import type { ResolveResponse } from '../types/index';
import type { AxiosInstance, RequestFetchOptions } from '@granit/api-client';

/**
 * Resolves a request path to its redirect target (public, anonymous).
 * `GET {basePath}/resolve?path={path}&culture={culture}`
 * + `X-Granit-Site: {siteId}` header — the backend scopes by site via `ICurrentSite`,
 * NOT a query parameter.
 *
 * Returns the redirect target + status code, or `null` when no redirect matches
 * (the endpoint returns 204 in that case).
 *
 * `fetchOptions` is forwarded verbatim to the fetch adapter (SSR caching hints).
 */
export async function resolveRedirect(
  client: AxiosInstance,
  basePath: string,
  params: { siteId: string; path: string; culture?: string },
  fetchOptions?: RequestFetchOptions
): Promise<ResolveResponse | null> {
  const response = await client.get<ResolveResponse | null>(`${basePath}/resolve`, {
    params: { path: params.path, culture: params.culture },
    headers: { 'X-Granit-Site': params.siteId },
    validateStatus: (s) => s === 200 || s === 204,
    ...(fetchOptions ? { fetchOptions } : {}),
  });
  return response.status === 204 ? null : (response.data ?? null);
}
