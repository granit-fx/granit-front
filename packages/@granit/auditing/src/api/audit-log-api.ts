import type { AuditLogEntryDetail, AuditLogListParams, AuditLogPage } from '../types/index.js';
import type { AxiosInstance } from 'axios';

/**
 * List audit log entries with optional filters and pagination.
 *
 * `GET {basePath}/`
 */
export async function fetchAuditLogEntries(
  client: AxiosInstance,
  basePath: string,
  params?: AuditLogListParams
): Promise<AuditLogPage> {
  const { data } = await client.get<AuditLogPage>(basePath, { params });
  return data;
}

/**
 * Get a single audit log entry by ID (includes entity change details).
 *
 * `GET {basePath}/{id}`
 */
export async function fetchAuditLogEntry(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<AuditLogEntryDetail> {
  const { data } = await client.get<AuditLogEntryDetail>(`${basePath}/${encodeURIComponent(id)}`);
  return data;
}

/**
 * Get the audit trail for a specific entity (paginated).
 *
 * `GET {basePath}/entity/{entityType}/{entityId}`
 */
export async function fetchEntityAuditTrail(
  client: AxiosInstance,
  basePath: string,
  entityType: string,
  entityId: string,
  params?: { page?: number; pageSize?: number }
): Promise<AuditLogPage> {
  const { data } = await client.get<AuditLogPage>(
    `${basePath}/entity/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`,
    { params }
  );
  return data;
}
