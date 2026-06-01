import {
  getAuditLogEntry,
  listAuditLogEntries,
  listEntityAuditTrail,
  pseudonymizeUserAuditLogs,
} from '@granit/auditing';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildAuditLogQueryKey, useAuditLogConfig } from '../providers/audit-log-provider';

import type { AuditEntryDetail, AuditListParams, AuditPage } from '@granit/auditing';
import type { PaginationParams } from '@granit/query-engine';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * List paginated audit log entries with optional filters.
 *
 * @example
 * ```tsx
 * const { data } = useAuditLogEntries({ category: AuditCategory.DataMutation });
 * ```
 */
export function useAuditLogEntries(params?: AuditListParams): UseQueryResult<AuditPage> {
  const config = useAuditLogConfig();
  const basePath = config.basePath;
  const auditEntriesPath = `${basePath}/audit-entries`;

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
export function useAuditLogEntry(id: string): UseQueryResult<AuditEntryDetail> {
  const config = useAuditLogConfig();
  const basePath = config.basePath;
  const auditEntriesPath = `${basePath}/audit-entries`;

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
  const basePath = config.basePath;
  const auditEntriesPath = `${basePath}/audit-entries`;

  return useQuery({
    queryKey: buildAuditLogQueryKey(config, 'entity', entityType, entityId, params),
    queryFn: () =>
      listEntityAuditTrail(config.client, auditEntriesPath, entityType, entityId, params),
    enabled: entityType.length > 0 && entityId.length > 0,
  });
}

/**
 * Pseudonymize all audit entries for a specific user (GDPR Art. 17).
 *
 * Replaces personal data with a SHA-256 hash to preserve audit trail
 * correlation without re-identification. Invalidates the cached audit log
 * list on success.
 *
 * @example
 * ```tsx
 * const pseudonymize = usePseudonymizeUserAuditLogs();
 * await pseudonymize.mutateAsync(userId);
 * ```
 */
export function usePseudonymizeUserAuditLogs(): UseMutationResult<void, Error, string> {
  const config = useAuditLogConfig();
  const basePath = config.basePath;
  const auditEntriesPath = `${basePath}/audit-entries`;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      pseudonymizeUserAuditLogs(config.client, auditEntriesPath, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildAuditLogQueryKey(config) });
    },
  });
}
