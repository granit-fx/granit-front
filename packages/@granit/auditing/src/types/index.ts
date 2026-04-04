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

/** Property-level change within an entity. */
export type AuditPropertyChange = {
  readonly propertyName: string;
  readonly originalValue: string | null;
  readonly newValue: string | null;
};

/** Entity-level change within an audit log entry. */
export type AuditEntityChange = {
  readonly entityType: string;
  readonly entityId: string;
  readonly changeType: AuditChangeTypeValue;
  readonly propertyChanges: readonly AuditPropertyChange[];
};

/** Audit log entry summary (list view) — mirrors `AuditEntryResponse`. */
export type AuditEntry = {
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
export type AuditEntryDetail = {
  readonly id: AuditEntryId;
  readonly timestamp: ISODateString;
  readonly userId: UserId;
  readonly userName: string | null;
  readonly category: AuditCategoryValue;
  readonly ipAddress: string | null;
  readonly tenantId: TenantId | null;
  readonly correlationId: CorrelationId | null;
  readonly entityChanges: readonly AuditEntityChange[];
};

/** Query parameters for listing audit log entries — mirrors `AuditingQueryParameters`. */
export type AuditListParams = PaginationParams & {
  readonly userId?: string;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly category?: AuditCategoryValue;
  readonly from?: ISODateString;
  readonly to?: ISODateString;
};

/** Paginated response for audit log entries. */
export type AuditPage = PagedResult<AuditEntry>;
