// Provider
export {
  buildTaxonomyQueryKey,
  TaxonomyProvider,
  useTaxonomyConfig,
} from './providers/taxonomy-provider.js';
export type {
  ResolvedTaxonomyConfig,
  TaxonomyConfig,
  TaxonomyProviderProps,
} from './providers/taxonomy-provider.js';

// Constants
export { API_VERSION, DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX, MODULE } from './constants.js';

// Read hooks
export { useTagAssignments, useTags } from './hooks/use-tags.js';
export { useCategories, useCategory } from './hooks/use-categories.js';
export { useTaxonomySearch } from './hooks/use-taxonomy-search.js';
export type { UseTaxonomySearchOptions } from './hooks/use-taxonomy-search.js';

// Mutation hooks — Tags
export {
  useAssignTag,
  useCreateTag,
  useDeleteTag,
  useUnassignTag,
  useUpdateTag,
} from './hooks/use-tag-mutations.js';

// Mutation hooks — Categories
export {
  useAssignCategory,
  useCreateCategory,
  useDeleteCategory,
  useMoveCategory,
  useUnassignCategory,
  useUpdateCategory,
} from './hooks/use-category-mutations.js';
