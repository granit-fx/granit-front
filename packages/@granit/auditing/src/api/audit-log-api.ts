import type { AuditEntryDetail, AuditListParams, AuditPage } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { PaginationParams } from '@granit/query-engine';

/**
 * List audit log entries with optional filters and pagination.
 *
 * `GET {basePath}`
 *
 * @deprecated `{basePath}` is a Granit QueryEngine endpoint
 * (`MapGranitQuery<AuditEntry>`). The flat filter params in {@link AuditListParams}
 * are ignored by the backend binder (only `page`/`pageSize` work). Use
 * `getPage<AuditEntry>(client, basePath, request)` from `@granit/query-engine`,
 * or the `useAuditEntries()` hook from `@granit/react-auditing`.
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
 * Get all audit log entries sharing a distributed-tracing correlation ID.
 *
 * Returns full detail entries (with entity changes), ordered newest-first.
 * Not paginated — the backend returns the complete correlated set.
 *
 * `GET {basePath}/correlation/{correlationId}`
 */
export async function getAuditEntriesByCorrelationId(
  client: AxiosInstance,
  basePath: string,
  correlationId: string
): Promise<readonly AuditEntryDetail[]> {
  const { data } = await client.get<readonly AuditEntryDetail[]>(
    `${basePath}/correlation/${encodeURIComponent(correlationId)}`
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
