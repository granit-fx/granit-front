import type {
  BlockCatalogResponse,
  BlockDataResolveRequest,
  BlockDataResponse,
} from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

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
 * Resolves live data for a data-bound block at SSR time.
 * `POST {basePath}/api/cms/blocks/data`
 *
 * The `consumedContentKeys` in the response should be added as ISR cache tags
 * so a backend publish of any consumed content invalidates the page.
 */
export async function resolveBlockData(
  client: AxiosInstance,
  basePath: string,
  request: BlockDataResolveRequest
): Promise<BlockDataResponse> {
  const response = await client.post<BlockDataResponse>(`${basePath}/api/cms/blocks/data`, request);
  return response.data;
}
