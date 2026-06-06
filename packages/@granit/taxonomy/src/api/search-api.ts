import type {
  TaxonomySearchFilter,
  TaxonomySearchResultGroup,
  TaxonomySearchResultItem,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Backend wire-shape for `GET /api/v1/taxonomy/search` — keyed dictionary of
 * per-target-type hits plus a flat list of matching tags. The frontend
 * collapses this into the legacy `TaxonomySearchResultGroup[]` shape; label
 * and snippet are left empty because the taxonomy backend doesn't fan out
 * to entity stores (apps that surface richer results wire their own
 * cross-entity search on top of this).
 */
interface BackendSearchTag {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly scope: string;
}

interface BackendSearchResponse {
  readonly tags?: ReadonlyArray<BackendSearchTag>;
  readonly hits?: Readonly<
    Record<string, ReadonlyArray<{ readonly targetId: string; readonly tagIds: readonly string[] }>>
  >;
  readonly totalCount?: number;
  readonly skip?: number;
  readonly take?: number;
}

function isBackendEnvelope(
  data: BackendSearchResponse | readonly TaxonomySearchResultGroup[] | null | undefined
): data is BackendSearchResponse {
  return data !== null && data !== undefined && !Array.isArray(data);
}

function adaptBackendResponse(data: BackendSearchResponse): readonly TaxonomySearchResultGroup[] {
  const hits = data.hits ?? {};
  return Object.entries(hits).map(([targetType, rows]) => ({
    targetType,
    items: rows.map<TaxonomySearchResultItem>((hit) => ({
      targetType,
      targetId: hit.targetId,
      label: '',
      snippet: null,
      matchedTagIds: hit.tagIds,
      matchedCategoryId: null,
    })),
  }));
}

/**
 * Cross-entity taxonomy search. The backend returns a `SearchResponse`
 * envelope (`{ tags, hits, totalCount, skip, take }`) keyed by target type;
 * we collapse it into the legacy group-array shape consumed by the search
 * bar. Bare-array responses (older mocks / Storybook fixtures) pass
 * through unchanged.
 *
 * `GET {basePath}/search`
 */
export async function searchTaxonomy(
  client: AxiosInstance,
  basePath: string,
  filter: TaxonomySearchFilter
): Promise<readonly TaxonomySearchResultGroup[]> {
  const params: Record<string, string | number> = { q: filter.q };
  if (filter.scope !== undefined) params.scope = filter.scope;
  if (filter.skip !== undefined) params.skip = filter.skip;
  if (filter.take !== undefined) params.take = filter.take;

  const response = await client.get<BackendSearchResponse | readonly TaxonomySearchResultGroup[]>(
    `${basePath}/search`,
    { params }
  );
  const data = response.data;
  if (isBackendEnvelope(data)) return adaptBackendResponse(data);
  return data ?? [];
}
