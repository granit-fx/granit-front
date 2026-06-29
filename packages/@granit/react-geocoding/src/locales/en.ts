/**
 * English translation bundle for the geocoding feature. Consumers register it
 * via `i18n.addResourceBundle('en', 'geocoding', geocodingTranslationsEn)` (or
 * via the `react-i18next` configuration).
 */
export const geocodingTranslationsEn = {
  /** Address typeahead. */
  SearchPlaceholder: 'Start typing an address…',
  NoResults: 'No matching address',
  Error: 'Could not load suggestions',
  /** Match-precision badge labels. */
  Precision: {
    Rooftop: 'Exact location',
    Street: 'Street-level',
    Locality: 'Approximate location',
  },
};
