import type { AuditEntryDetailResponse, AuditPage } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { PaginationParams } from '@granit/query-engine';

/**
 * Get a single audit log entry by ID (includes entity change details).
 *
 * `GET {basePath}/{id}`
 */
export async function getAuditLogEntry(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<AuditEntryDetailResponse> {
  const { data } = await client.get<AuditEntryDetailResponse>(
    `${basePath}/${encodeURIComponent(id)}`
  );
  return data;
}

/**
 * Get the audit entries sharing a distributed-tracing correlation ID (paginated).
 *
 * Returns summary projections, ordered newest-first. Fetch a single entry's
 * full detail (with entity changes) by id.
 *
 * `GET {basePath}/correlation/{correlationId}`
 */
export async function getAuditEntriesByCorrelationId(
  client: AxiosInstance,
  basePath: string,
  correlationId: string,
  params?: PaginationParams
): Promise<AuditPage> {
  const { data } = await client.get<AuditPage>(
    `${basePath}/correlation/${encodeURIComponent(correlationId)}`,
    { params }
  );
  return data;
}

/**
 * Pseudonymize all audit entries for a specific user (GDPR Art. 17).
 *
 * Replaces personal data (UserId, UserName, IpAddress, UserAgent) with a
 * SHA-256 hash to preserve audit trail correlation without re-identification.
 *
 * `POST {basePath}/pseudonymize/{userId}`
 */
export async function pseudonymizeUserAuditLogs(
  client: AxiosInstance,
  basePath: string,
  userId: string
): Promise<void> {
  await client.post(`${basePath}/pseudonymize/${encodeURIComponent(userId)}`);
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
