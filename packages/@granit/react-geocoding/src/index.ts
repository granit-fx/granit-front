// Provider
export {
  GeocodingProvider,
  useGeocodingConfig,
  useOptionalGeocodingConfig,
} from './providers/geocoding-provider';
export type {
  GeocodingConfig,
  GeocodingProviderProps,
  ResolvedGeocodingConfig,
} from './providers/geocoding-provider';

// Query keys
export { buildGeocodingQueryKey } from './hooks/query-keys';

// Hooks
export { useAddressSuggestions } from './hooks/use-address-suggestions';
export type {
  UseAddressSuggestionsOptions,
  UseAddressSuggestionsResult,
} from './hooks/use-address-suggestions';
export { useReverseGeocode } from './hooks/use-reverse-geocode';
export type { Coordinate, UseReverseGeocodeResult } from './hooks/use-reverse-geocode';
export { useDebouncedValue } from './hooks/use-debounced-value';

// Components
export { AddressAutocompleteInput } from './components/address-autocomplete-input';
export type { AddressAutocompleteInputProps } from './components/address-autocomplete-input';
export { AddressPrecisionBadge } from './components/address-precision-badge';
export type { AddressPrecisionBadgeProps } from './components/address-precision-badge';

// Locales
export { geocodingTranslationsEn, geocodingTranslationsFr } from './locales/index';

// Constants
export {
  DEFAULT_BASE_PATH,
  DEFAULT_DEBOUNCE_MS,
  DEFAULT_MIN_QUERY_LENGTH,
  DEFAULT_SUGGESTION_LIMIT,
  I18N_NAMESPACE,
} from './constants';
