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
export {
  buildLookupQueryKey,
  buildLookupManifestQueryKey,
  buildLookupResolveQueryKey,
} from './hooks/query-keys';

// Hooks
export { useLookup } from './hooks/use-lookup';
export type { UseLookupOptions, UseLookupParams, UseLookupResult } from './hooks/use-lookup';
export { useLookupResolve } from './hooks/use-lookup-resolve';
export type { UseLookupResolveOptions } from './hooks/use-lookup-resolve';
export { useLookupManifest } from './hooks/use-lookup-manifest';
export type {
  UseLookupManifestOptions,
  UseLookupManifestResult,
} from './hooks/use-lookup-manifest';

// Headless helpers (reusable when building a styled combobox in the host app)
export { useDebouncedValue } from './hooks/use-debounced-value';
export { useIntersectionSentinel } from './hooks/use-intersection-sentinel';
export type { UseIntersectionSentinelOptions } from './hooks/use-intersection-sentinel';
export { useListboxNavigation } from './hooks/use-listbox-navigation';
export type {
  ListboxNavigation,
  UseListboxNavigationOptions,
} from './hooks/use-listbox-navigation';

// Components
export { LookupSelect } from './components/lookup-select';
export type { LookupSelectProps, LookupSelectRenderArgs } from './components/lookup-select';
export { LookupPicker } from './components/lookup-picker';
export type { LookupPickerProps, LookupPickerRenderArgs } from './components/lookup-picker';
export { LookupBadge } from './components/lookup-badge';
export type { LookupBadgeProps, LookupBadgeRenderArgs } from './components/lookup-badge';
