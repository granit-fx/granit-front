/**
 * Server-safe entry point for @granit/react-cms.
 * Only exports safe to import from React Server Components.
 */

// Resolved document asset descriptor (pure type — the shape blocks read from
// the publish-time `_resolved_<field>` siblings).
export type { ResolvedAsset } from './blocks/types';

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
