// ---------------------------------------------------------------------------
// @granit/react-auditing — public API
// ---------------------------------------------------------------------------

// Provider
export { AuditLogProvider, useAuditLogConfig } from './providers/audit-log-provider';
export type { AuditLogConfig, AuditLogProviderProps } from './providers/audit-log-provider';

// Hooks
export {
  useAuditLogEntries,
  useAuditLogEntry,
  useEntityAuditTrail,
  usePseudonymizeUserAuditLogs,
} from './hooks/use-audit-log';
