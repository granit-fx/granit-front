import { parseRelationAggregateParentMarker } from '@granit/react-entities';
import type { EntitySelectionBarRecap } from '@granit/react-entities';

export interface ParentRef {
  readonly entityName: string;
  readonly entityId: string;
}

/**
 * Pure helper extracted from `WorkspaceEntityPage.handleRecap` so the bulk
 * recap → parent-ref transformation is unit-testable without mounting the
 * full page.
 *
 * Maps every `"{ParentEntityName}:{ParentId}"` marker through the
 * framework's `parseRelationAggregateParentMarker` and drops anything
 * that fails to parse (defensive — the mock backend or a future server
 * bug should not break the recap pipeline).
 *
 * Returns an empty array when `recap.parents` is `undefined` (per-row
 * fan-out path) or empty (bulk endpoint with no impacted parents).
 */
export function recapParentRefs(recap: EntitySelectionBarRecap): readonly ParentRef[] {
  return (recap.parents ?? [])
    .map(parseRelationAggregateParentMarker)
    .filter((p): p is ParentRef => p !== null);
}
