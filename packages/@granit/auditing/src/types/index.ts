import type { PagedResult, PaginationParams } from '@granit/query-engine';
import type { CorrelationId, EntityId, ISODateString, TenantId, UserId } from '@granit/types';

// ---------------------------------------------------------------------------
// Audit log types — mirrors Granit.Auditing .NET contracts
// ---------------------------------------------------------------------------

/** Audit log category — mirrors `AuditCategory` enum. */
export const AuditCategory = {
  DataMutation: 'DataMutation',
  ConfigurationChange: 'ConfigurationChange',
  DataAccess: 'DataAccess',
  AccessDenied: 'AccessDenied',
  PrivilegedAccess: 'PrivilegedAccess',
} as const;

export type AuditCategoryValue = (typeof AuditCategory)[keyof typeof AuditCategory];

/** Entity change type — mirrors `AuditChangeType` enum. */
export const AuditChangeType = {
  Created: 'Created',
  Modified: 'Modified',
  Deleted: 'Deleted',
  SoftDeleted: 'SoftDeleted',
} as const;

export type AuditChangeTypeValue = (typeof AuditChangeType)[keyof typeof AuditChangeType];

/** Branded audit entry identifier. */
export type AuditEntryId = EntityId<'AuditEntry'>;

/** Branded audit entity-change identifier. */
export type AuditEntityChangeId = EntityId<'AuditEntityChange'>;

/** Property-level change within an entity — mirrors `AuditPropertyChangeResponse`. */
export type AuditPropertyChangeResponse = {
  readonly propertyName: string;
  readonly originalValue: string | null;
  readonly newValue: string | null;
};

/** Entity-level change within an audit log entry — mirrors `AuditEntityChangeResponse`. */
export type AuditEntityChangeResponse = {
  readonly entityType: string;
  readonly entityId: string;
  readonly changeType: AuditChangeTypeValue;
  readonly propertyChanges: readonly AuditPropertyChangeResponse[];
};

/** Audit log entry summary (list view) — mirrors `AuditEntryResponse`. */
export type AuditEntryResponse = {
  readonly id: AuditEntryId;
  readonly timestamp: ISODateString;
  readonly userId: UserId;
  readonly userName: string | null;
  readonly category: AuditCategoryValue;
  readonly ipAddress: string | null;
  readonly tenantId: TenantId | null;
  readonly correlationId: CorrelationId | null;
  readonly entityChangeCount: number;
};

/** Audit log entry with full entity change details — mirrors `AuditEntryDetailResponse`. */
export type AuditEntryDetailResponse = {
  readonly id: AuditEntryId;
  readonly timestamp: ISODateString;
  readonly userId: UserId;
  readonly userName: string | null;
  readonly category: AuditCategoryValue;
  readonly ipAddress: string | null;
  readonly tenantId: TenantId | null;
  readonly correlationId: CorrelationId | null;
  readonly entityChanges: readonly AuditEntityChangeResponse[];
};

/**
 * Flat query parameters for the legacy audit list call.
 *
 * @deprecated The audit list endpoint (`GET /audit-entries`) is a Granit
 * QueryEngine endpoint (`MapGranitQuery<AuditEntryResponse>`), so flat filter
 * params (`category`, `userId`, `from`, `to`, …) are ignored by the backend
 * binder — only `page`/`pageSize` are honored. Use the QueryEngine surface
 * instead: `useAuditEntries()` (from `@granit/react-auditing`) or
 * `getPage<AuditEntryResponse>()` (from `@granit/query-engine`), which serialize
 * filters as `filter[field.op]=value`. There is no `AuditingQueryParameters` DTO
 * on the backend.
 */
export type AuditListParams = PaginationParams & {
  readonly userId?: string;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly category?: AuditCategoryValue;
  readonly from?: ISODateString;
  readonly to?: ISODateString;
};

/** Summary projection of an entity change — mirrors `AuditEntityChangeSummaryResponse`. */
export type AuditEntityChangeSummaryResponse = {
  readonly id: AuditEntityChangeId;
  readonly auditEntryId: AuditEntryId;
  readonly entityType: string;
  readonly entityId: string;
  readonly changeType: AuditChangeTypeValue;
  readonly propertyChangeCount: number;
};

/** Paginated response for audit log entries. */
export type AuditPage = PagedResult<AuditEntryResponse>;
