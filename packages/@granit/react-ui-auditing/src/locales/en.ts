// @granit/react-ui-auditing — i18next resource bundle (flat keys, "translation" ns).
// Register in the host app:
//   import { auditingTranslationsEn } from "@granit/react-ui-auditing";
//   i18n.addResourceBundle("en", "translation", auditingTranslationsEn, true, true);

export const auditingTranslationsEn = {
  'Audit.Categories.AccessDenied': 'Access denied',
  'Audit.Categories.ConfigurationChange': 'Configuration change',
  'Audit.Categories.DataAccess': 'Data access',
  'Audit.Categories.DataMutation': 'Data mutation',
  'Audit.Categories.PrivilegedAccess': 'Privileged access',
  'Audit.ChangeTypes.Created': 'Created',
  'Audit.ChangeTypes.Deleted': 'Deleted',
  'Audit.ChangeTypes.Modified': 'Modified',
  'Audit.ChangeTypes.SoftDeleted': 'Soft deleted',
  'Audit.Columns.AuditEntryId': 'Audit entry',
  'Audit.Columns.Category': 'Category',
  'Audit.Columns.Changes': 'Changes',
  'Audit.Columns.ChangeType': 'Change type',
  'Audit.Columns.CorrelationId': 'Correlation ID',
  'Audit.Columns.EntityId': 'Entity ID',
  'Audit.Columns.EntityType': 'Entity Type',
  'Audit.Columns.IpAddress': 'IP Address',
  'Audit.Columns.PropertyChanges': 'Property changes',
  'Audit.Columns.TenantId': 'Tenant',
  'Audit.Columns.Timestamp': 'Timestamp',
  'Audit.Columns.UserAgent': 'User Agent',
  'Audit.Columns.UserName': 'User Name',
  'Audit.Detail': 'Audit entry detail',
  'Audit.EntityChanges': 'Entity changes',
  'Audit.EntityChangesSubtitle': 'Cross-cutting view of every recorded entity change',
  'Audit.EntityChangesTitle': 'Entity Changes',
  'Audit.FilterByCategory': 'Filter by category',
  'Audit.NoEntityChanges': 'No entity changes recorded for this entry',
  'Audit.NotFound': 'Audit entry not found',
  'Audit.PropertyChanges.NewValue': 'New value',
  'Audit.PropertyChanges.OriginalValue': 'Original value',
  'Audit.PropertyChanges.Property': 'Property',
  'Audit.Subtitle': 'Track all administrative actions and system events',
  'Audit.System': 'System',
  'Audit.Title': 'Audit Logs',
  'Audit.ViewDetail': 'View detail',
} as const;

export type AuditingTranslations = typeof auditingTranslationsEn;
