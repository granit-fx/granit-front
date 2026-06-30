// @granit/react-ui-cms-menus — admin UI for CMS site menus.
// Composes the headless @granit/react-cms (provider + hooks) with the foundation
// UI packages. The Axios client resolves from a CmsProvider / GranitClientProvider
// in the host tree (via the @granit/react-cms hooks); the create/edit form derives
// its validation from the OpenAPI contract (@granit/cms cmsConstraints).

export { MenusListPage } from './components/menus-list-page';
export { MenuFormPage } from './components/menu-form-page';

// i18next resource bundles (flat keys, literal `cms:` prefix, "translation" ns)
export { cmsMenusTranslationsEn, cmsMenusTranslationsFr } from './locales/index';
export type { CmsMenusTranslations } from './locales/index';
