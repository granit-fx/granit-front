export const API_VERSION = 'v1';
export const MODULE = 'geocoding';
export const DEFAULT_BASE_PATH = `/api/${API_VERSION}/${MODULE}`;

/** Debounce applied to the typeahead input before it hits the network (ms). */
export const DEFAULT_DEBOUNCE_MS = 275;

/** Minimum query length before the autocomplete request fires. */
export const DEFAULT_MIN_QUERY_LENGTH = 3;

/** Default maximum number of suggestions requested. */
export const DEFAULT_SUGGESTION_LIMIT = 5;
