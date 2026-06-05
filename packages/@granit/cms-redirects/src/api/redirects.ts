import type { ResolveResponse } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Resolves a request path to its redirect target (public, anonymous).
 * `GET {basePath}/api/cms/redirects/resolve?path={path}&culture={culture}`
 * + `X-Granit-Site: {siteId}` header — the backend scopes by site via `ICurrentSite`,
 * NOT a query parameter.
 *
 * Returns the redirect target + status code, or `null` when no redirect matches
 * (the endpoint returns 204 in that case).
 */
export async function resolveRedirect(
  client: AxiosInstance,
  basePath: string,
  params: { siteId: string; path: string; culture?: string }
): Promise<ResolveResponse | null> {
  const response = await client.get<ResolveResponse | null>(
    `${basePath}/api/cms/redirects/resolve`,
    {
      params: { path: params.path, culture: params.culture },
      headers: { 'X-Granit-Site': params.siteId },
      validateStatus: (s) => s === 200 || s === 204,
    }
  );
  return response.status === 204 ? null : (response.data ?? null);
}
