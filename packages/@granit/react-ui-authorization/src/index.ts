// @granit/react-ui-authorization — admin UI for the Granit.Authorization module.
// Composes the headless @granit/react-authorization (provider + hooks) with the
// foundation UI packages. The Axios client resolves from a GranitClientProvider
// in the host tree (role-metadata page); the host/tenant divergence is injected.

export { PermissionListPage } from './permission-list-page';
export type { PermissionListPageProps } from './permission-list-page';
export { PermissionGrantsPage } from './permission-grants-page';
export { RoleMetadataPage } from './role-metadata-page';
export { RolePermissionsPanel } from './components/role-permissions-panel';
export type { RolePermissionsPanelProps } from './components/role-permissions-panel';
export { PermissionSideBadge } from './components/permission-side-badge';

// i18next resource bundles (flat keys, "translation" ns)
export { authorizationTranslationsEn, authorizationTranslationsFr } from './locales/index';
export type { AuthorizationTranslations } from './locales/index';
