import type {
  BlockCatalogResponse,
  BlockDataResolveRequest,
  BlockDataResponse,
} from '../types/index';
import type { AxiosInstance, RequestFetchOptions } from '@granit/api-client';

/**
 * Fetches the editor-agnostic block catalog.
 * `GET {basePath}/api/cms/blocks`
 */
export async function getBlockCatalog(
  client: AxiosInstance,
  basePath: string
): Promise<BlockCatalogResponse> {
  const response = await client.get<BlockCatalogResponse>(`${basePath}/api/cms/blocks`);
  return response.data;
}

/**
 * Fetches the anonymous, read-only block catalog for the public SSR renderer.
 * `GET {basePath}/api/cms/blocks/public`
 *
 * Same `BlockCatalogResponse` shape as {@link getBlockCatalog}, but served by an
 * `AllowAnonymous` route so the public renderer can build its render config
 * without a bearer token. Use {@link getBlockCatalog} for the admin editor.
 *
 * `fetchOptions` is forwarded verbatim to the fetch adapter (SSR caching hints,
 * e.g. `{ next: { tags: ['cms-catalog'] } }`).
 */
export async function getPublicBlockCatalog(
  client: AxiosInstance,
  basePath: string,
  fetchOptions?: RequestFetchOptions
): Promise<BlockCatalogResponse> {
  const response = await client.get<BlockCatalogResponse>(
    `${basePath}/api/cms/blocks/public`,
    fetchOptions ? { fetchOptions } : undefined
  );
  return response.data;
}

/**
 * Resolves live data for a data-bound block at SSR time.
 * `POST {basePath}/api/cms/blocks/data`
 *
 * The `consumedContentKeys` in the response should be added as ISR cache tags
 * so a backend publish of any consumed content invalidates the page.
 *
 * `fetchOptions` is forwarded verbatim to the fetch adapter (SSR caching hints,
 * e.g. `{ next: { tags: [`block-data:${siteId}:${key}`] } }`).
 */
export async function resolveBlockData(
  client: AxiosInstance,
  basePath: string,
  request: BlockDataResolveRequest,
  fetchOptions?: RequestFetchOptions
): Promise<BlockDataResponse> {
  const response = await client.post<BlockDataResponse>(
    `${basePath}/api/cms/blocks/data`,
    request,
    fetchOptions ? { fetchOptions } : undefined
  );
  return response.data;
}
