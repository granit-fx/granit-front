// Types
export type {
  GeocodingAutocompleteParams,
  GeocodingAutocompleteResponse,
  GeocodingReverseParams,
  GeocodingReverseResponse,
  GeocodingSuggestionResponse,
} from './types/index';
export { GeocodeMatchPrecision } from './types/index';

// API
export { getAddressSuggestions, getReverseGeocode } from './api/geocoding-api';
