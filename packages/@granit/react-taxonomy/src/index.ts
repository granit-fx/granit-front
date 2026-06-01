// Provider
export {
  buildTaxonomyQueryKey,
  TaxonomyProvider,
  useTaxonomyConfig,
} from './providers/taxonomy-provider';
export type {
  ResolvedTaxonomyConfig,
  TaxonomyConfig,
  TaxonomyProviderProps,
} from './providers/taxonomy-provider';

// Constants
export { API_VERSION, DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX, MODULE } from './constants';

// Read hooks
export { useTagAssignments, useTags } from './hooks/use-tags';
export { useCategories, useCategory } from './hooks/use-categories';
export { useTaxonomySearch } from './hooks/use-taxonomy-search';
export type { UseTaxonomySearchOptions } from './hooks/use-taxonomy-search';
export {
  useAttachTagToDocument,
  useDetachTagFromDocument,
  useDocumentTags,
} from './hooks/use-document-tags';
export type { DocumentTagsBindings } from './hooks/use-document-tags';

// Mutation hooks — Tags
export {
  useAssignTag,
  useCreateTag,
  useDeleteTag,
  useUnassignTag,
  useUpdateTag,
} from './hooks/use-tag-mutations';

// Mutation hooks — Categories
export {
  useAssignCategory,
  useCreateCategory,
  useDeleteCategory,
  useMoveCategory,
  useUnassignCategory,
  useUpdateCategory,
} from './hooks/use-category-mutations';

// Components
export { TagChip } from './components/tag-chip.tsx';
export type { TagChipProps } from './components/tag-chip.tsx';
export { TagAutocomplete } from './components/tag-autocomplete.tsx';
export type {
  TagAutocompleteLabels,
  TagAutocompleteProps,
} from './components/tag-autocomplete.tsx';
export { TagChipStrip } from './components/tag-chip-strip.tsx';
export type { TagChipStripLabels, TagChipStripProps } from './components/tag-chip-strip.tsx';
export { DocumentTagChipStrip } from './components/document-tag-chip-strip.tsx';
export type { DocumentTagChipStripProps } from './components/document-tag-chip-strip.tsx';
export { TagManager } from './components/tag-manager.tsx';
export type { TagManagerLabels, TagManagerProps } from './components/tag-manager.tsx';
export { CategoryBreadcrumb } from './components/category-breadcrumb.tsx';
export type { CategoryBreadcrumbProps } from './components/category-breadcrumb.tsx';
export { CategoryTree } from './components/category-tree.tsx';
export type { CategoryTreeLabels, CategoryTreeProps } from './components/category-tree.tsx';
export { CategorySelector } from './components/category-selector.tsx';
export type {
  CategorySelectorLabels,
  CategorySelectorProps,
} from './components/category-selector.tsx';
export { TaxonomySearchBar } from './components/taxonomy-search-bar.tsx';
export type {
  TaxonomySearchBarLabels,
  TaxonomySearchBarProps,
} from './components/taxonomy-search-bar.tsx';

// Contributions
export { entityTaxonomy } from './contributions/entity-taxonomy.tsx';
export type {
  EntityTaxonomyContributionOptions,
  EntityTaxonomyProps,
} from './contributions/entity-taxonomy.tsx';

// i18n
export { taxonomyTranslationsEn, taxonomyTranslationsFr } from './locales/index';
export type { TaxonomyTranslations } from './locales/index';
