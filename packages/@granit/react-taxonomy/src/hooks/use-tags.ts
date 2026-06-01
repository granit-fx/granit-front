import { getTagAssignments, listTags } from '@granit/taxonomy';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { buildTaxonomyQueryKey, useTaxonomyConfig } from '../providers/taxonomy-provider';

import type {
  TagAssignmentResponse,
  TagListFilter,
  TagResponse,
  TaxonomyTargetRef,
} from '@granit/taxonomy';
import type { UseQueryResult } from '@tanstack/react-query';

const TAGS_AUTOCOMPLETE_STALE_TIME_MS = 30_000;

/**
 * List tags within a scope, optionally narrowed by an autocomplete query.
 * Uses `keepPreviousData` so the typeahead doesn't flicker between keystrokes,
 * with a 30s `staleTime` to amortize repeat queries.
 *
 * @example
 * ```tsx
 * const { data } = useTags({ scope: 'documents', q: input });
 * ```
 */
export function useTags(filter: TagListFilter): UseQueryResult<readonly TagResponse[]> {
  const config = useTaxonomyConfig();

  return useQuery({
    queryKey: buildTaxonomyQueryKey(config, 'tags', filter),
    queryFn: () => listTags(config.client, config.basePath, filter),
    staleTime: TAGS_AUTOCOMPLETE_STALE_TIME_MS,
    placeholderData: keepPreviousData,
  });
}

/**
 * List the tag assignments for a polymorphic target — used by entity cards
 * to render their chip strip. Disabled when either segment is empty.
 *
 * @example
 * ```tsx
 * const { data } = useTagAssignments({ targetType: 'Granit.Documents.Domain.Document', targetId });
 * ```
 */
export function useTagAssignments(
  target: TaxonomyTargetRef
): UseQueryResult<readonly TagAssignmentResponse[]> {
  const config = useTaxonomyConfig();

  return useQuery({
    queryKey: buildTaxonomyQueryKey(config, 'tag-assignments', target),
    queryFn: () => getTagAssignments(config.client, config.basePath, target),
    enabled: target.targetType.length > 0 && target.targetId.length > 0,
  });
}
