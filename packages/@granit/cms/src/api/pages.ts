import type {
  DraftPagePreviewResponse,
  MintPreviewTokenRequest,
  MintPreviewTokenResponse,
  PublishedPageResponse,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Resolves a published page by per-culture path.
 * `GET {basePath}/api/cms/pages/by-path?culture={culture}&path={path}`
 * + `X-Granit-Site: {siteId}` header.
 *
 * Returns `null` on 404 (draft, archived, or unknown path).
 */
export async function getPageByPath(
  client: AxiosInstance,
  basePath: string,
  params: { siteId: string; culture: string; path: string }
): Promise<PublishedPageResponse | null> {
  try {
    const response = await client.get<PublishedPageResponse>(`${basePath}/api/cms/pages/by-path`, {
      params: { culture: params.culture, path: params.path },
      headers: { 'X-Granit-Site': params.siteId },
    });
    return response.data;
  } catch (err: unknown) {
    if (isAxios404(err)) return null;
    throw err;
  }
}

/**
 * Mints a signed preview token for a page draft (admin-gated).
 * `POST {basePath}/api/cms/pages/{pageId}/preview-token`
 */
export async function mintPreviewToken(
  client: AxiosInstance,
  basePath: string,
  pageId: string,
  request: MintPreviewTokenRequest
): Promise<MintPreviewTokenResponse> {
  const response = await client.post<MintPreviewTokenResponse>(
    `${basePath}/api/cms/pages/${encodeURIComponent(pageId)}/preview-token`,
    request
  );
  return response.data;
}

/**
 * Resolves a preview token into the corresponding draft content (anonymous, token-gated).
 * `GET {basePath}/api/cms/preview/resolve?token={token}`
 *
 * Returns `null` on 401 (invalid/expired token) or 404.
 */
export async function resolvePreview(
  client: AxiosInstance,
  basePath: string,
  token: string
): Promise<DraftPagePreviewResponse | null> {
  try {
    const response = await client.get<DraftPagePreviewResponse>(
      `${basePath}/api/cms/preview/resolve`,
      { params: { token } }
    );
    return response.data;
  } catch (err: unknown) {
    if (isAxios401Or404(err)) return null;
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

function isAxios401Or404(err: unknown): boolean {
  if (typeof err !== 'object' || err === null || !('response' in err)) return false;
  const status = (err as { response?: { status?: number } }).response?.status;
  return status === 401 || status === 404;
}
