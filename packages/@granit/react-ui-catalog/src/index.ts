// @granit/react-ui-catalog — admin UI for the Catalog module.
// Composes the headless @granit/react-catalog (CatalogProvider + hooks) with the
// foundation UI packages. The host app supplies CatalogProvider (which resolves
// an Axios client via GranitClientProvider); these pages only call the hooks.
// Form validation derives from the OpenAPI-backed @granit/catalog
// catalogConstraints via createConstraintsResolver from @granit/react-validation.

export { CatalogListPage } from './catalog-list-page';
export { CatalogDetailPage } from './catalog-detail-page';
export { CatalogCreatePage } from './catalog-create-page';
export { CatalogEditPage } from './catalog-edit-page';

// Sub-components (composable into custom detail/list layouts).
export { ExternalMappingsManager } from './components/external-mappings-manager';
export { LifecycleActions } from './components/lifecycle-actions';
export { LifecycleStatusBadge } from './components/lifecycle-status-badge';
export { MetadataEditor } from './components/metadata-editor';
export { createProductColumns } from './components/product-columns';

// i18next resource bundles (flat keys, "translation" ns). Owns the Catalog.*
// feature keys; the host root supplies the shared Common.* / Operators.* keys.
export { catalogTranslationsEn, catalogTranslationsFr } from './locales/index';
export type { CatalogTranslations } from './locales/index';
