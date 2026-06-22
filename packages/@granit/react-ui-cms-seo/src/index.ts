// @granit/react-ui-cms-seo — admin UI for the CMS SEO module.
// Composes the headless @granit/react-cms-seo (provider + hooks) with the
// foundation UI packages. Data hooks resolve their Axios client from a
// CmsSeoProvider in the host tree; this package does NOT wrap a provider.
// The SEO defaults form validates against the spec-derived
// `cmsSeoConstraints.SiteSeoDefaultsRequest` via @granit/react-validation.

export { SeoDashboardPage } from './seo-dashboard-page';

// i18next resource bundles (flat keys, literal `cms:` prefix, "translation" ns)
export { cmsSeoTranslationsEn, cmsSeoTranslationsFr } from './locales/index';
export type { CmsSeoTranslations } from './locales/index';
