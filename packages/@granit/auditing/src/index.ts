// ---------------------------------------------------------------------------
// @granit/auditing — public API (pure TypeScript, no React)
// ---------------------------------------------------------------------------

// Types
export { AuditCategory, AuditChangeType } from './types/index';

export type {
  AuditCategoryValue,
  AuditChangeTypeValue,
  AuditEntryResponse,
  AuditEntryDetailResponse,
  AuditEntryId,
  AuditEntityChangeResponse,
  AuditEntityChangeId,
  AuditEntityChangeSummaryResponse,
  AuditPage,
  AuditPropertyChangeResponse,
} from './types/index';

// API
export {
  getAuditLogEntry,
  getAuditEntriesByCorrelationId,
  listEntityAuditTrail,
  pseudonymizeUserAuditLogs,
} from './api/audit-log-api';
export { AuditingPermissions } from './permissions';
