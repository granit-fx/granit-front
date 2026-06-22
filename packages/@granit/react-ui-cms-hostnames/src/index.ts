// @granit/react-ui-cms-hostnames — admin UI for the CMS site-scoped Hostnames module.
// Composes the headless @granit/react-cms-hostnames (provider + hooks) with the
// foundation UI packages. The Axios client resolves from a GranitClientProvider
// in the host tree (via the CmsHostnamesProvider, supplied by the host — this
// package does NOT wrap a provider). The add-hostname form validates against the
// spec-derived cmsHostnamesConstraints (@granit/cms-hostnames) plus a client-only
// FQDN guard, via @granit/react-validation's createConstraintsResolver.

export { HostnamesPage } from './hostnames-page';
export { CmsHostnameAddForm } from './components/cms-hostname-add-form';
export type { CmsHostnameAddFormProps } from './components/cms-hostname-add-form';
export { CmsHostnameStatusBadge } from './components/cms-hostname-status-badge';
export type { CmsHostnameStatusBadgeProps } from './components/cms-hostname-status-badge';

// i18next resource bundles (flat keys with literal `cms:` prefix, "translation" ns)
export { cmsHostnamesTranslationsEn, cmsHostnamesTranslationsFr } from './locales/index';
export type { CmsHostnamesTranslations } from './locales/index';
