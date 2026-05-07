import type { TaxonomySearchFilter, TaxonomySearchResultGroup } from '../types.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Cross-entity taxonomy search. The backend groups matches by `targetType`
 * and returns at most one group per registered taxonomy host.
 *
 * `GET {basePath}/search`
 */
export async function searchTaxonomy(
  client: AxiosInstance,
  basePath: string,
  filter: TaxonomySearchFilter
): Promise<readonly TaxonomySearchResultGroup[]> {
  const response = await client.get<readonly TaxonomySearchResultGroup[]>(`${basePath}/search`, {
    params: { q: filter.q },
  });
  return response.data;
}
