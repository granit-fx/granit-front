import type { RedirectResolveResponse } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Checks whether a redirect is registered for the given path.
 * `GET {basePath}/api/cms/redirects/resolve?siteId={siteId}&path={path}&culture={culture}`
 *
 * Returns the redirect target + status code, or `null` when no redirect matches
 * (the endpoint returns 204 in that case).
 */
export async function resolveRedirect(
  client: AxiosInstance,
  basePath: string,
  params: { siteId: string; path: string; culture?: string }
): Promise<RedirectResolveResponse | null> {
  const response = await client.get<RedirectResolveResponse | null>(
    `${basePath}/api/cms/redirects/resolve`,
    { params, validateStatus: (s) => s === 200 || s === 204 }
  );
  return response.status === 204 ? null : (response.data ?? null);
}
