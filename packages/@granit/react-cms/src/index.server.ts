/**
 * Server-safe entry point for @granit/react-cms.
 * Only exports safe to import from React Server Components.
 */

// Document resolution (pure async function, no browser APIs)
export { resolveDocumentReferencesInData } from './blocks/resolve-documents';
export type { ResolvedDocumentAsset, ResolveDocumentsFn } from './blocks/resolve-documents';

// Puck config generator (pure function, no browser APIs)
export { catalogToConfig } from './puck/catalog-to-config';
export type {
  CatalogConfigOptions,
  DocumentPickerItem,
  FetchDocumentsFn,
  ResolveBlockDataFn,
} from './puck/catalog-to-config';

// Navigation component (client component — safe to import from server, rendered as client ref)
export { CmsMenuNav } from './components/cms-menu-nav';
