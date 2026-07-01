import { getCategory, listCategories } from '@granit/taxonomy';
import { useQuery } from '@tanstack/react-query';

import { useTaxonomyConfig } from '../providers/taxonomy-provider';

import { buildTaxonomyQueryKey } from './query-keys';

import type {
  CategoryDetailResponse,
  CategoryListFilter,
  CategoryResponse,
} from '@granit/taxonomy';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * List the children of a category. Pass `parentId: null` (or omit it) to list
 * scope roots. Each level is cached independently — the tree UI in T7 calls
 * this hook once per expanded node.
 *
 * @example
 * ```tsx
 * const { data: roots } = useCategories({ scope: 'documents' });
 * const { data: children } = useCategories({ scope: 'documents', parentId });
 * ```
 */
export function useCategories(
  filter: CategoryListFilter,
  options?: { readonly enabled?: boolean }
): UseQueryResult<readonly CategoryResponse[]> {
  const config = useTaxonomyConfig();

  return useQuery({
    queryKey: buildTaxonomyQueryKey(config, 'categories', filter),
    queryFn: () => listCategories(config.client, config.basePath, filter),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Get a single category, including its full root→leaf breadcrumb. Disabled
 * when `id` is empty.
 *
 * @example
 * ```tsx
 * const { data: category } = useCategory(selectedId);
 * ```
 */
export function useCategory(id: string): UseQueryResult<CategoryDetailResponse> {
  const config = useTaxonomyConfig();

  return useQuery({
    queryKey: buildTaxonomyQueryKey(config, 'category', id),
    queryFn: () => getCategory(config.client, config.basePath, id),
    enabled: id.length > 0,
  });
}
