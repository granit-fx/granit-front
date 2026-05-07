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
