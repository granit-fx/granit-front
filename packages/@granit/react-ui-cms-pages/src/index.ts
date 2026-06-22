// @granit/react-ui-cms-pages — admin UI for the CMS Pages module.
// Composes the headless @granit/react-cms (provider + hooks) with the foundation
// UI packages. The Axios client resolves from a GranitClientProvider in the host
// tree (via the host-provided CmsProvider — this package does NOT wrap one).
// Validation is spec-driven: the create form derives its rules from
// cmsConstraints.CreatePageRequest (@granit/cms) via createConstraintsResolver.

export { PageTreePage } from './page-tree-page';
export { PageFormPage } from './page-form-page';

// CMS renderer link-out helpers (gated by VITE_CMS_RENDERER_URL in the host).
export { CMS_RENDERER_URL, isCmsRendererConfigured, buildPageEditorUrl } from './renderer';

// i18next resource bundles (flat keys with the literal `cms:` prefix, "translation" ns)
export { cmsPagesTranslationsEn, cmsPagesTranslationsFr } from './locales/index';
export type { CmsPagesTranslations } from './locales/index';
