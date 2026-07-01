// @granit/react-ui-dashboards — admin UI for the Granit.Dashboards module.
// Composes the headless @granit/react-dashboards (data hooks + render surfaces)
// and @granit/react-dashboard-editor (editor primitives) with the foundation UI
// packages. The Axios client resolves from a DashboardsProvider (which falls back
// to a host GranitClientProvider) in the host tree.

export { DashboardListPage } from './components/dashboard-list-page';
export { DashboardEditPage } from './components/dashboard-edit-page';
export { DashboardViewPage } from './components/dashboard-view-page';
export { DashboardComposer } from './components/dashboard-composer';
export type { DashboardComposerProps } from './components/dashboard-composer';

// Public components
export { StatusBadge } from './components/dashboard-status-badge';
export { DriftBadge } from './components/dashboard-drift-badge';
export { LifecycleConfirmDialog } from './components/dashboard-lifecycle-dialog';
export { DashboardImportFromCatalog } from './components/dashboard-import-from-catalog';
export type { LifecycleAction, PendingLifecycle } from './components/dashboard-lifecycle-types';

// i18next resource bundles (flat keys, "translation" ns)
export { dashboardsTranslationsEn, dashboardsTranslationsFr } from './locales/index';
export type { DashboardsTranslations } from './locales/index';
