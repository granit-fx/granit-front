// ---------------------------------------------------------------------------
// @granit/data-lookup — public API (framework-agnostic)
// ---------------------------------------------------------------------------

// Types
export type {
  LookupDescriptor,
  LookupItemResponse,
  LookupKind,
  LookupManifestResponse,
  LookupManifestEntryResponse,
  LookupQueryParams,
  LookupResultResponse,
} from './types/index';

// HTTP client
export {
  DEFAULT_LOOKUP_BASE_PATH,
  buildSearchQuery,
  getLookupManifest,
  findMissingScopeKey,
  isScopeSatisfied,
  resolveLookup,
  searchLookup,
  stringifyLookupValue,
} from './api/index';
export type { LookupClientOptions } from './api/index';
export { DataLookupPermissions } from './permissions';
