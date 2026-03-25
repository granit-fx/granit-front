import type { PagedResult, PaginationParams } from '@granit/query-engine';

// ---------------------------------------------------------------------------
// Audit log types — mirrors Granit.Auditing .NET contracts
// ---------------------------------------------------------------------------

/** Audit log category — mirrors `AuditLogCategory` enum. */
export const AuditLogCategory = {
  DataMutation: 'DataMutation',
  ConfigurationChange: 'ConfigurationChange',
  DataAccess: 'DataAccess',
  AccessDenied: 'AccessDenied',
} as const;

export type AuditLogCategoryValue = (typeof AuditLogCategory)[keyof typeof AuditLogCategory];

/** Entity change type — mirrors `AuditChangeType` enum. */
export const AuditChangeType = {
  Created: 'Created',
  Modified: 'Modified',
  Deleted: 'Deleted',
  SoftDeleted: 'SoftDeleted',
} as const;

export type AuditChangeTypeValue = (typeof AuditChangeType)[keyof typeof AuditChangeType];

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

/** Audit log entry summary (list view). */
export type AuditLogEntry = {
  readonly id: string;
  readonly timestamp: string;
  readonly userId: string;
  readonly userName: string | null;
  readonly category: AuditLogCategoryValue;
  readonly ipAddress: string | null;
  readonly tenantId: string | null;
  readonly correlationId: string | null;
  readonly entityChangeCount: number;
};

/** Audit log entry with full entity change details. */
export type AuditLogEntryDetail = {
  readonly id: string;
  readonly timestamp: string;
  readonly userId: string;
  readonly userName: string | null;
  readonly category: AuditLogCategoryValue;
  readonly ipAddress: string | null;
  readonly tenantId: string | null;
  readonly correlationId: string | null;
  readonly entityChanges: readonly AuditEntityChange[];
};

/** Query parameters for listing audit log entries. */
export type AuditLogListParams = PaginationParams & {
  readonly userId?: string;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly category?: AuditLogCategoryValue;
  readonly from?: string;
  readonly to?: string;
};

/** Paginated response for audit log entries. */
export type AuditLogPage = PagedResult<AuditLogEntry>;
