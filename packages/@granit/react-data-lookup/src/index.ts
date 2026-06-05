// ---------------------------------------------------------------------------
// @granit/react-data-lookup — React hooks and headless components
// ---------------------------------------------------------------------------

// Provider
export {
  DataLookupProvider,
  useDataLookupConfig,
  useOptionalDataLookupConfig,
} from './providers/data-lookup-provider';
export type {
  DataLookupConfig,
  DataLookupProviderProps,
  ResolvedDataLookupConfig,
} from './providers/data-lookup-provider';

// Query key factories
export { buildLookupQueryKey, buildLookupResolveQueryKey } from './hooks/query-keys';

// Hooks
export { useLookup } from './hooks/use-lookup';
export type { UseLookupOptions, UseLookupResult } from './hooks/use-lookup';
export { useLookupResolve } from './hooks/use-lookup-resolve';
export type { UseLookupResolveOptions } from './hooks/use-lookup-resolve';

// Components
export { LookupSelect } from './components/lookup-select';
export type { LookupSelectProps, LookupSelectRenderArgs } from './components/lookup-select';
export { LookupPicker } from './components/lookup-picker';
export type { LookupPickerProps, LookupPickerRenderArgs } from './components/lookup-picker';
export { LookupBadge } from './components/lookup-badge';
export type { LookupBadgeProps, LookupBadgeRenderArgs } from './components/lookup-badge';
