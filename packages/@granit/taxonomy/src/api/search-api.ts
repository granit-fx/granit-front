import type {
  SearchResponse,
  TaxonomySearchFilter,
  TaxonomySearchResult,
  TaxonomySearchResultGroup,
  TaxonomySearchResultItem,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Discriminates the real backend `SearchResponse` envelope from a legacy
 * bare `TaxonomySearchResultGroup[]` response (older mocks / Storybook
 * fixtures). The envelope is a (non-array) object.
 */
function isBackendEnvelope(
  data: SearchResponse | readonly TaxonomySearchResultGroup[] | null | undefined
): data is SearchResponse {
  return data !== null && data !== undefined && !Array.isArray(data);
}

/**
 * Collapse the keyed `SearchResponse` envelope into the grouped shape the
 * search bar renders. The backend describes each hit by id + matched tag ids
 * only, so labels are resolved by joining each hit's `tagIds` to the matching
 * {@link SearchTagItem.name} from the flat `tags` list. `skip`/`take`/
 * `totalCount` are surfaced for pagination.
 */
function adaptBackendResponse(data: SearchResponse): TaxonomySearchResult {
  const tagNameById = new Map(data.tags.map((tag) => [tag.id, tag.name]));

  const groups = Object.entries(data.hits).map<TaxonomySearchResultGroup>(([targetType, rows]) => ({
    targetType,
    items: rows.map<TaxonomySearchResultItem>((hit) => {
      const names = hit.tagIds
        .map((id) => tagNameById.get(id))
        .filter((name): name is string => name !== undefined);
      return {
        targetType,
        targetId: hit.targetId,
        label: names.join(', '),
        snippet: null,
        matchedTagIds: hit.tagIds,
        matchedCategoryId: null,
      };
    }),
  }));

  return {
    groups,
    totalCount: data.totalCount,
    skip: data.skip,
    take: data.take,
  };
}

/**
 * Adapt a legacy bare-array response. Pagination is derived from the
 * flattened items; `skip`/`take` are unknown (`null`).
 */
function adaptLegacyArray(groups: readonly TaxonomySearchResultGroup[]): TaxonomySearchResult {
  const totalCount = groups.reduce((sum, group) => sum + group.items.length, 0);
  return { groups, totalCount, skip: null, take: null };
}

/**
 * Cross-entity taxonomy search. The backend returns a `SearchResponse`
 * envelope (`{ tags, hits, totalCount, skip, take }`) keyed by target type;
 * we collapse it into the grouped shape consumed by the search bar, resolving
 * each hit's label from the matched tags. Bare-array responses (older mocks /
 * Storybook fixtures) pass through unchanged.
 *
 * `GET {basePath}/search`
 */
export async function searchTaxonomy(
  client: AxiosInstance,
  basePath: string,
  filter: TaxonomySearchFilter
): Promise<TaxonomySearchResult> {
  const params: Record<string, string | number> = { q: filter.q };
  if (filter.scope !== undefined) params.scope = filter.scope;
  if (filter.skip !== undefined) params.skip = filter.skip;
  if (filter.take !== undefined) params.take = filter.take;

  const response = await client.get<SearchResponse | readonly TaxonomySearchResultGroup[]>(
    `${basePath}/search`,
    { params }
  );
  const data = response.data;
  if (isBackendEnvelope(data)) return adaptBackendResponse(data);
  return adaptLegacyArray(data ?? []);
}
