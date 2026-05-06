import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Parsed shape of one parent marker. Apps may pass either the raw
 * `"{ParentEntityName}:{ParentId}"` wire form (e.g.
 * `BulkActionResponse.parents` from D1) or this structured form when
 * they already have it.
 */
export interface RelationAggregateParentRef {
  readonly entityName: string;
  readonly entityId: string;
}

/**
 * Parse a `"{ParentEntityName}:{ParentId}"` marker as emitted by the
 * bulk endpoint (granit-fx/granit-dotnet#1792 + #1822). Returns `null`
 * when the input is malformed (missing colon, empty segments) — apps
 * should not treat malformed markers as a hard failure since the same
 * recap can mix valid and malformed entries.
 *
 * Ids may legitimately contain `:` (composite keys), so the parse uses
 * `indexOf` to keep everything after the **first** `:` as the id.
 */
export function parseRelationAggregateParentMarker(
  marker: string
): RelationAggregateParentRef | null {
  const i = marker.indexOf(':');
  if (i <= 0 || i === marker.length - 1) {
    return null;
  }
  return {
    entityName: marker.slice(0, i),
    entityId: marker.slice(i + 1),
  };
}

/**
 * Hook returning a function that invalidates **exactly one** relation
 * aggregate query per distinct parent, given a list of parent markers
 * (raw `"{Entity}:{Id}"` strings, structured refs, or a mix).
 *
 * Mirrors the backend `RelationAggregateCacheInvalidator<TRelated>`
 * (granit-fx/granit-dotnet#1792) in spirit: a 100-row bulk update
 * touching 5 parents fires exactly 5 invalidations on the front,
 * never 100.
 *
 * Typical wiring with D2's selection-bar bulk recap:
 *
 * ```tsx
 * const invalidateParents = useInvalidateEntityRelationAggregates();
 * <EntitySelectionBar
 *   manifest={…}
 *   useBulkEndpoint
 *   onComplete={(_action, recap) => {
 *     if (recap.parents) invalidateParents(recap.parents);
 *   }}
 * />
 * ```
 *
 * Apps that own per-row mutations (no bulk path) call this with the
 * parent refs they computed from their typed payload — the framework
 * intentionally doesn't ship a child→parent topology resolver since
 * the wire manifest doesn't expose the FK predicate.
 */
export function useInvalidateEntityRelationAggregates(): (
  parents: readonly (string | RelationAggregateParentRef)[]
) => void {
  const queryClient = useQueryClient();

  return useCallback(
    (parents) => {
      const seen = new Set<string>();
      for (const raw of parents) {
        const ref = typeof raw === 'string' ? parseRelationAggregateParentMarker(raw) : raw;
        if (!ref) continue;
        const dedupKey = `${ref.entityName}:${ref.entityId}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);
        // 4-element prefix invalidates every relations-csv variant
        // (full-relation pull + any subset query) for this parent in
        // one call. Mirrors the comment on
        // entityRelationAggregatesQueryKey(): a 4-element prefix
        // "blasts every variant when the source row mutates".
        queryClient.invalidateQueries({
          queryKey: ['entities', 'relations', ref.entityName, ref.entityId],
        });
      }
    },
    [queryClient]
  );
}
