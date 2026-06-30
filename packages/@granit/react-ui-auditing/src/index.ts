// @granit/react-ui-auditing — admin UI for the Granit.Auditing module.
// Composes the headless @granit/react-auditing (provider + hooks) with the
// foundation UI packages. Pages get their Axios client from a
// `GranitClientProvider` in the host tree; route prefixes are injected.

// Pages
export { AuditListPage } from './audit-list-page';
export type { AuditListPageProps } from './audit-list-page';
export { AuditDetailPage } from './audit-detail-page';
export type { AuditDetailPageProps } from './audit-detail-page';
export { AuditEntityChangesPage } from './audit-entity-changes-page';
export type { AuditEntityChangesPageProps } from './audit-entity-changes-page';

// Components
export { AuditCategoryBadge } from './components/audit-category-badge';
export { AuditChangeTypeBadge } from './components/audit-change-type-badge';
export { AuditEntityChangeCard } from './components/audit-entity-change-card';
export { createAuditColumns } from './components/audit-columns';
export { createAuditEntityChangeColumns } from './components/audit-entity-change-columns';

// Constants
export { DEFAULT_AUDIT_BASE_PATH, DEFAULT_AUDIT_ROUTE_BASE } from './constants';

// i18next resource bundles (flat keys, "translation" ns)
export { auditingTranslationsEn, auditingTranslationsFr } from './locales/index';
export type { AuditingTranslations } from './locales/index';

// Re-exported DTO for convenience
export type { AuditEntryResponse } from '@granit/auditing';
