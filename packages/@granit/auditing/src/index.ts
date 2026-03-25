// ---------------------------------------------------------------------------
// @granit/auditing — public API (pure TypeScript, no React)
// ---------------------------------------------------------------------------

// Types
export { AuditChangeType, AuditLogCategory } from './types/index.js';

export type {
  AuditChangeTypeValue,
  AuditEntityChange,
  AuditLogCategoryValue,
  AuditLogEntry,
  AuditLogEntryDetail,
  AuditLogListParams,
  AuditLogPage,
  AuditPropertyChange,
} from './types/index.js';

// API
export {
  fetchAuditLogEntries,
  fetchAuditLogEntry,
  fetchEntityAuditTrail,
} from './api/audit-log-api.js';
