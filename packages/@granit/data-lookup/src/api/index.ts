export {
  DEFAULT_LOOKUP_BASE_PATH,
  buildSearchQuery,
  getLookupManifest,
  resolveLookup,
  searchLookup,
  stringifyLookupValue,
} from './lookup-client.js';
export type { LookupClientOptions } from './lookup-client.js';
export { findMissingScopeKey, isScopeSatisfied } from './scope-validation.js';
