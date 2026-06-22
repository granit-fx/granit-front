// @granit/react-ui-cms-releases — admin UI for the CMS Releases module.
// Composes the headless @granit/react-cms (provider + release hooks) with the
// foundation UI packages. The Axios client resolves from a CmsProvider in the
// host tree. Validation is spec-driven via @granit/react-validation against the
// @granit/cms constraints; the timezone field reuses @granit/react-ui-admin-kit's
// TimezonePicker. Pages do NOT wrap a provider — the host owns it.

export { ReleasesListPage } from './releases-list-page';
export { ReleaseDetailPage } from './release-detail-page';
export { ReleaseFormDialog } from './components/release-form-dialog';

// i18next resource bundles (flat keys with the literal "cms:" prefix, "translation" ns)
export { cmsReleasesTranslationsEn, cmsReleasesTranslationsFr } from './locales/index';
export type { CmsReleasesTranslations } from './locales/index';
