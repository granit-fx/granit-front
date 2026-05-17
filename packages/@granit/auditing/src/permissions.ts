/** Permission constants for the auditing module. Mirrors `Granit.Auditing.Endpoints.Permissions.AuditingPermissions`. */
export const AuditingPermissions = {
  /** Permissions for the audit entries resource. */
  AuditEntries: {
    /** Grants read access to audit entries (ISO 27001 audit trail). */
    Read: 'Auditing.AuditEntries.Read',
    /** Grants management access to audit entries (pseudonymization, GDPR Art. 17). */
    Manage: 'Auditing.AuditEntries.Manage',
  },
} as const;
