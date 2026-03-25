import { fetchAuditLogEntries, fetchAuditLogEntry, fetchEntityAuditTrail } from '@granit/auditing';
import { useQuery } from '@tanstack/react-query';

import {
  buildAuditLogQueryKey,
  DEFAULT_BASE_PATH,
  useAuditLogConfig,
} from '../providers/audit-log-provider.js';

import type { AuditEntryDetail, AuditListParams, AuditPage } from '@granit/auditing';
import type { PaginationParams } from '@granit/query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch paginated audit log entries with optional filters.
 *
 * @example
 * ```tsx
 * const { data } = useAuditLogEntries({ category: AuditCategory.DataMutation });
 * ```
 */
export function useAuditLogEntries(params?: AuditListParams): UseQueryResult<AuditPage> {
  const config = useAuditLogConfig();
  const basePath = config.basePath ?? DEFAULT_BASE_PATH;

  return useQuery({
    queryKey: buildAuditLogQueryKey(config, 'list', params),
    queryFn: () => fetchAuditLogEntries(config.client, basePath, params),
  });
}

/**
 * Fetch a single audit log entry by ID (includes entity change details).
 *
 * @example
 * ```tsx
 * const { data: entry } = useAuditLogEntry(entryId);
 * ```
 */
export function useAuditLogEntry(id: string): UseQueryResult<AuditEntryDetail> {
  const config = useAuditLogConfig();
  const basePath = config.basePath ?? DEFAULT_BASE_PATH;

  return useQuery({
    queryKey: buildAuditLogQueryKey(config, 'detail', id),
    queryFn: () => fetchAuditLogEntry(config.client, basePath, id),
    enabled: id.length > 0,
  });
}

/**
 * Fetch the audit trail for a specific entity (paginated).
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
  const basePath = config.basePath ?? DEFAULT_BASE_PATH;

  return useQuery({
    queryKey: buildAuditLogQueryKey(config, 'entity', entityType, entityId, params),
    queryFn: () => fetchEntityAuditTrail(config.client, basePath, entityType, entityId, params),
    enabled: entityType.length > 0 && entityId.length > 0,
  });
}
