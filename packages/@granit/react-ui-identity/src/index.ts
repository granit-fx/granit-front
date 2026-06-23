// @granit/react-ui-identity — admin UI for the Identity module.
// Composes the headless @granit/react-identity (IdentityProvider + hooks) with the
// foundation UI packages. The host app supplies IdentityProvider (which resolves an
// Axios client via GranitClientProvider); these pages only call the hooks. Pages
// are provider-agnostic — the host owns IdentityProvider, AuthorizationProvider
// (for usePermissions) and DataExchangeProvider configuration.

// Users
export { UserListPage } from './users/user-list-page';
export { UserDetailPage } from './users/user-detail-page';
export type { UserDetailPageProps } from './users/user-detail-page';
export type { AdminUser } from './users/types';

// Roles
export { RoleListPage } from './roles/role-list-page';
export { RoleDetailPage } from './roles/role-detail-page';

// Groups
export { GroupListPage } from './groups/group-list-page';
export { GroupDetailPage } from './groups/group-detail-page';

// Identity cache
export { IdentityCachePage } from './cache/identity-cache-page';

// User search combobox (assign-to-role / add-to-group pickers)
export { UserSearchCombobox } from './components/user-search-combobox';

// Shared identity cards (also consumed by the showcase `account` self-service feature)
export { DevicesCard } from './components/devices-card';
export type { DevicesCardLabels, DevicesCardProps } from './components/devices-card';
export { SessionsCard } from './components/sessions-card';
export type { SessionsCardLabels, SessionsCardProps } from './components/sessions-card';
export { SessionRiskIndicator } from './components/session-risk-indicator';
export type { SessionRiskIndicatorProps } from './components/session-risk-indicator';

// Label hooks for the shared cards (resolve flat Users.*/Sessions.* keys per scope)
export { useDevicesCardLabels } from './components/use-devices-card-labels';
export type { DevicesScope } from './components/use-devices-card-labels';
export { useSessionsCardLabels } from './components/use-sessions-card-labels';
export type { SessionsScope } from './components/use-sessions-card-labels';
export { useDeviceLabelStrings } from './components/use-device-label-strings';
export { useRiskLabelStrings } from './components/use-risk-label-strings';
export type { RiskLabelStrings } from './components/use-risk-label-strings';
export { isHandheldUserAgent, parseUserAgent } from './components/parse-user-agent';

// i18next resource bundles (flat keys, "translation" ns). Named distinctly from the
// headless @granit/react-identity identityTranslationsEn/Fr ("identity" ns) bundle.
export { identityAdminTranslationsEn, identityAdminTranslationsFr } from './locales/index';
export type { IdentityAdminTranslations } from './locales/index';
