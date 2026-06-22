// @granit/react-ui-features — admin UI for the Granit.Features module.
// Composes the headless @granit/react-features (data hooks + provider) with the
// foundation UI packages. The Axios client resolves from a GranitClientProvider
// in the host tree.

export { FeatureListPage } from './feature-list-page';
export { FeatureDetailPage } from './feature-detail-page';
export { FeatureGroupCard } from './components/feature-group-card';
export { FeatureValueBadge } from './components/feature-value-badge';
export { SetOverrideDialog } from './components/set-override-dialog';

// i18next resource bundles (flat keys, "translation" ns)
export { featuresTranslationsEn, featuresTranslationsFr } from './locales/index';
export type { FeaturesTranslations } from './locales/index';
