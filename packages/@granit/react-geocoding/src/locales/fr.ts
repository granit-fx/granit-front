/**
 * French translation bundle for the geocoding feature. Consumers register it
 * via `i18n.addResourceBundle('fr', 'geocoding', geocodingTranslationsFr)` (or
 * via the `react-i18next` configuration).
 */
export const geocodingTranslationsFr = {
  /** Address typeahead. */
  SearchPlaceholder: 'Commencez à saisir une adresse…',
  NoResults: 'Aucune adresse correspondante',
  Error: 'Impossible de charger les suggestions',
  /** Match-precision badge labels. */
  Precision: {
    Rooftop: 'Emplacement exact',
    Street: 'Au niveau de la rue',
    Locality: 'Emplacement approximatif',
  },
};
