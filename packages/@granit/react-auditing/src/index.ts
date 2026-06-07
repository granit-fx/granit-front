// ---------------------------------------------------------------------------
// @granit/react-auditing — public API
// ---------------------------------------------------------------------------

// Providers
export { AuditLogProvider, useAuditLogConfig } from './providers/audit-log-provider';
export type { AuditLogConfig, AuditLogProviderProps } from './providers/audit-log-provider';
export { AuditEntityChangesProvider } from './providers/audit-entity-changes-provider';
export type { AuditEntityChangesProviderProps } from './providers/audit-entity-changes-provider';

// QueryEngine hooks (audit-entries list/meta)
export { useAuditEntries, useAuditEntriesMeta } from './hooks/use-audit-log';

// QueryEngine hooks (audit-entity-changes list/meta)
export { useAuditEntityChanges, useAuditEntityChangesMeta } from './hooks/use-audit-entity-changes';

// Custom-lookup hooks
export {
  useAuditLogEntry,
  useAuditEntriesByCorrelation,
  useEntityAuditTrail,
  usePseudonymizeUserAuditLogs,
} from './hooks/use-audit-log';
