import type { AuditEntryDetail, AuditListParams, AuditPage } from '../types/index.js';
import type { PaginationParams } from '@granit/query-engine';
import type { AxiosInstance } from 'axios';

/**
 * List audit log entries with optional filters and pagination.
 *
 * `GET {basePath}/`
 */
export async function listAuditLogEntries(
  client: AxiosInstance,
  basePath: string,
  params?: AuditListParams
): Promise<AuditPage> {
  const { data } = await client.get<AuditPage>(basePath, { params });
  return data;
}

/**
 * Get a single audit log entry by ID (includes entity change details).
 *
 * `GET {basePath}/{id}`
 */
export async function getAuditLogEntry(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<AuditEntryDetail> {
  const { data } = await client.get<AuditEntryDetail>(`${basePath}/${encodeURIComponent(id)}`);
  return data;
}

/**
 * Get the audit trail for a specific entity (paginated).
 *
 * `GET {basePath}/entity/{entityType}/{entityId}`
 */
export async function listEntityAuditTrail(
  client: AxiosInstance,
  basePath: string,
  entityType: string,
  entityId: string,
  params?: PaginationParams
): Promise<AuditPage> {
  const { data } = await client.get<AuditPage>(
    `${basePath}/entity/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`,
    { params }
  );
  return data;
}
