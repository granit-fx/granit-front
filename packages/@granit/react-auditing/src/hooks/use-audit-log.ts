import {
  getAuditEntriesByCorrelationId,
  getAuditLogEntry,
  listAuditLogEntries,
  listEntityAuditTrail,
  pseudonymizeUserAuditLogs,
} from '@granit/auditing';
import { useQueryEndpoint } from '@granit/react-query-engine';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildAuditLogQueryKey, useAuditLogConfig } from '../providers/audit-log-provider';

import type { AxiosError, ProblemDetails } from '@granit/api-client';
import type {
  AuditEntryResponse,
  AuditEntryDetailResponse,
  AuditListParams,
  AuditPage,
} from '@granit/auditing';
import type { PaginationParams } from '@granit/query-engine';
import type { UseQueryEndpointOptions, UseQueryEndpointReturn } from '@granit/react-query-engine';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * QueryEngine endpoint for audit entries ({@link AuditEntryResponse}), backed by the
 * `MapGranitQuery<AuditEntryResponse>()` group of `Granit.Auditing.Endpoints`. Exposes
 * pagination / search / filter / sort / group-by dispatchers and the paged
 * (or grouped) result. Filters are serialized as `filter[field.op]=value`, so
 * they are honored by the backend (unlike the deprecated {@link useAuditLogEntries}).
 *
 * Must be used within an {@link AuditLogProvider}.
 *
 * @example
 * ```tsx
 * const audit = useAuditEntries();
 * audit.addFilter({ field: 'category', operator: 'Eq', value: 'DataMutation' });
 * audit.query.data?.items.map((e) => e.userName);
 * ```
 */
export function useAuditEntries(
  options?: UseQueryEndpointOptions
): UseQueryEndpointReturn<AuditEntryResponse> {
  return useQueryEndpoint<AuditEntryResponse>(options);
}

/** Query metadata (columns, filterable/sortable/group-by fields) for the audit-entries surface. */
export { useQueryMeta as useAuditEntriesMeta } from '@granit/react-query-engine';

/**
 * List paginated audit log entries with optional filters.
 *
 * @deprecated The list endpoint is a QueryEngine endpoint, so the flat filter
 * params (`category`, `userId`, `from`, `to`, …) are ignored by the backend —
 * only `page`/`pageSize` take effect. Use {@link useAuditEntries} instead, which
 * serializes filters in the format the backend understands.
 *
 * @example
 * ```tsx
 * const { data } = useAuditLogEntries({ category: AuditCategory.DataMutation });
 * ```
 */
export function useAuditLogEntries(params?: AuditListParams): UseQueryResult<AuditPage> {
  const config = useAuditLogConfig();
  const auditEntriesPath = `${config.basePath}/audit-entries`;

  return useQuery({
    queryKey: buildAuditLogQueryKey(config, 'list', params),
    queryFn: () => listAuditLogEntries(config.client, auditEntriesPath, params),
  });
}

/**
 * Get a single audit log entry by ID (includes entity change details).
 *
 * @example
 * ```tsx
 * const { data: entry } = useAuditLogEntry(entryId);
 * ```
 */
export function useAuditLogEntry(id: string): UseQueryResult<AuditEntryDetailResponse> {
  const config = useAuditLogConfig();
  const auditEntriesPath = `${config.basePath}/audit-entries`;

  return useQuery({
    queryKey: buildAuditLogQueryKey(config, 'detail', id),
    queryFn: () => getAuditLogEntry(config.client, auditEntriesPath, id),
    enabled: id.length > 0,
  });
}

/**
 * List the audit trail for a specific entity (paginated).
 *
 * @example
 * ```tsx
 * const { data } = useEntityAuditTrail('Patient', patientId);
 * ```
 */
export function useEntityAuditTrail(
  entityType: string,
  entityId: string,
  params?: PaginationParams
): UseQueryResult<AuditPage> {
  const config = useAuditLogConfig();
  const auditEntriesPath = `${config.basePath}/audit-entries`;

  return useQuery({
    queryKey: buildAuditLogQueryKey(config, 'entity', entityType, entityId, params),
    queryFn: () =>
      listEntityAuditTrail(config.client, auditEntriesPath, entityType, entityId, params),
    enabled: entityType.length > 0 && entityId.length > 0,
  });
}

/**
 * Get all audit entries sharing a distributed-tracing correlation ID.
 *
 * Returns full detail entries (with entity changes), newest-first — useful for
 * tracing a single logical transaction across services.
 *
 * @example
 * ```tsx
 * const { data: related } = useAuditEntriesByCorrelation(correlationId);
 * ```
 */
export function useAuditEntriesByCorrelation(
  correlationId: string
): UseQueryResult<readonly AuditEntryDetailResponse[]> {
  const config = useAuditLogConfig();
  const auditEntriesPath = `${config.basePath}/audit-entries`;

  return useQuery({
    queryKey: buildAuditLogQueryKey(config, 'correlation', correlationId),
    queryFn: () => getAuditEntriesByCorrelationId(config.client, auditEntriesPath, correlationId),
    enabled: correlationId.length > 0,
  });
}

/**
 * Pseudonymize all audit entries for a specific user (GDPR Art. 17).
 *
 * Replaces personal data with a SHA-256 hash to preserve audit trail
 * correlation without re-identification. Invalidates the cached audit log
 * queries (QueryEngine list + custom lookups) on success.
 *
 * @example
 * ```tsx
 * const pseudonymize = usePseudonymizeUserAuditLogs();
 * await pseudonymize.mutateAsync(userId);
 * ```
 */
export function usePseudonymizeUserAuditLogs(): UseMutationResult<
  void,
  AxiosError<ProblemDetails>,
  string
> {
  const config = useAuditLogConfig();
  const auditEntriesPath = `${config.basePath}/audit-entries`;
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ProblemDetails>, string>({
    mutationFn: (userId: string) =>
      pseudonymizeUserAuditLogs(config.client, auditEntriesPath, userId),
    onSuccess: () => {
      // Custom-lookup hooks (detail / entity / correlation / deprecated list).
      queryClient.invalidateQueries({ queryKey: buildAuditLogQueryKey(config) });
      // QueryEngine list/meta cache (keyed by the audit-entries path segments).
      queryClient.invalidateQueries({
        queryKey: auditEntriesPath.split('/').filter(Boolean),
      });
    },
  });
}
