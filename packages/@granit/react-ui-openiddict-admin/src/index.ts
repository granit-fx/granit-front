// Pages — OpenIddict admin CRUD
export { OidcApplicationsPage } from './applications/oidc-applications-page';
export { OidcScopesPage } from './scopes/oidc-scopes-page';
export { OidcAuthorizationsPage } from './authorizations/oidc-authorizations-page';

// Pages — public OIDC flows (host layout + current user injected)
export { ConsentPage } from './consent/consent-page';
export type { ConsentPageProps, ConsentCurrentUser } from './consent/consent-page';
export { DevicePage } from './device/device-page';
export type { DevicePageProps } from './device/device-page';

// i18n bundles
export { openIddictAdminTranslationsEn, openIddictAdminTranslationsFr } from './locales';
