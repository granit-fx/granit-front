import type { ResolvedMenu } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Resolves a menu into a render-ready tree (anonymous).
 * `GET {basePath}/api/cms/menus/resolve?key={key}&culture={culture}`
 * + `X-Granit-Site: {siteId}` header (the backend scopes by site via the header).
 *
 * Returns `null` when no menu with the given key exists.
 */
export async function resolveMenu(
  client: AxiosInstance,
  basePath: string,
  params: { siteId: string; key: string; culture: string }
): Promise<ResolvedMenu | null> {
  try {
    const response = await client.get<ResolvedMenu>(`${basePath}/api/cms/menus/resolve`, {
      params: { key: params.key, culture: params.culture },
      headers: { 'X-Granit-Site': params.siteId },
    });
    return response.data;
  } catch (err: unknown) {
    if (isAxios404(err)) return null;
    throw err;
  }
}

function isAxios404(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    (err as { response?: { status?: number } }).response?.status === 404
  );
}
