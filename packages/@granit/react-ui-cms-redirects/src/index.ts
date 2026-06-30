// @granit/react-ui-cms-redirects — admin UI for the CMS Redirects module.
// Composes the headless @granit/react-cms-redirects (provider + hooks) with the
// foundation UI packages. The Axios client resolves from a GranitClientProvider
// in the host tree (via the host-supplied CmsRedirectsProvider) — this package
// does NOT wrap a provider. Form validation is spec-driven via
// @granit/react-validation + the generated @granit/cms-redirects constraints.

export { RedirectsListPage } from './components/redirects-list-page';
export { RedirectFormDialog } from './components/redirect-form-dialog';

// i18next resource bundles (flat keys, "translation" ns)
export { cmsRedirectsTranslationsEn, cmsRedirectsTranslationsFr } from './locales/index';
export type { CmsRedirectsTranslations } from './locales/index';
