import { useQueryEndpoint } from '@granit/react-query-engine';

import type { AuditEntityChangeSummary } from '@granit/auditing';
import type { UseQueryEndpointOptions, UseQueryEndpointReturn } from '@granit/react-query-engine';

/**
 * QueryEngine endpoint for audit entity changes ({@link AuditEntityChangeSummary}),
 * backed by the `MapGranitQuery<AuditEntityChange>()` group of
 * `Granit.Auditing.Endpoints`. Cross-cutting view over every recorded entity
 * change (the per-property diff lives on the parent {@link AuditEntryDetail}).
 *
 * Must be used within an {@link AuditEntityChangesProvider}.
 *
 * @example
 * ```tsx
 * const changes = useAuditEntityChanges();
 * changes.addFilter({ field: 'entityType', operator: 'Eq', value: 'Patient' });
 * ```
 */
export function useAuditEntityChanges(
  options?: UseQueryEndpointOptions
): UseQueryEndpointReturn<AuditEntityChangeSummary> {
  return useQueryEndpoint<AuditEntityChangeSummary>(options);
}

/** Query metadata for the audit entity-changes surface. */
export { useQueryMeta as useAuditEntityChangesMeta } from '@granit/react-query-engine';
