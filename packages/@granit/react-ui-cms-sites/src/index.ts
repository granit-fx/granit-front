// @granit/react-ui-cms-sites — admin UI for the CMS Sites module.
// Composes the headless @granit/react-cms (CmsProvider + hooks) with the
// foundation UI packages. The host app supplies CmsProvider (which resolves an
// Axios client via GranitClientProvider); these pages only call the hooks. Site
// form validation derives from the OpenAPI-backed @granit/cms cmsConstraints via
// createConstraintsResolver from @granit/react-validation.

export { SitesListPage } from './components/sites-list-page';
export { SiteFormPage } from './components/site-form-page';

// i18next resource bundles (flat keys, "translation" ns). Owns the cms:Common.*
// keys as the CMS module root, alongside the cms:Sites.* feature keys.
export { cmsSitesTranslationsEn, cmsSitesTranslationsFr } from './locales/index';
export type { CmsSitesTranslations } from './locales/index';
