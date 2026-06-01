import { searchTaxonomy } from '@granit/taxonomy';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { buildTaxonomyQueryKey, useTaxonomyConfig } from '../providers/taxonomy-provider';

import type { TaxonomySearchFilter, TaxonomySearchResultGroup } from '@granit/taxonomy';
import type { UseQueryResult } from '@tanstack/react-query';

export interface UseTaxonomySearchOptions extends TaxonomySearchFilter {
  /**
   * Disable the query — useful for below-threshold queries (e.g. `q.length < 2`).
   * Defaults to `true`.
   */
  readonly enabled?: boolean;
}

/**
 * Cross-entity taxonomy search. Caller is expected to debounce `q` upstream
 * (the search bar in T8 does ≥ 300ms). Uses `keepPreviousData` to avoid
 * flicker between keystrokes.
 *
 * @example
 * ```tsx
 * const { data } = useTaxonomySearch({ q: debouncedQ, enabled: debouncedQ.length >= 2 });
 * ```
 */
export function useTaxonomySearch(
  options: UseTaxonomySearchOptions
): UseQueryResult<readonly TaxonomySearchResultGroup[]> {
  const config = useTaxonomyConfig();
  const { enabled, ...filter } = options;

  return useQuery({
    queryKey: buildTaxonomyQueryKey(config, 'search', filter),
    queryFn: () => searchTaxonomy(config.client, config.basePath, filter),
    enabled: enabled ?? true,
    placeholderData: keepPreviousData,
  });
}
