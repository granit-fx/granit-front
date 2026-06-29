import type { GeocodingReverseResponse, GeocodingSuggestionResponse } from '@granit/geocoding';

/** A handful of Brussels-area suggestions for tests and stories. */
export const sampleSuggestions: readonly GeocodingSuggestionResponse[] = [
  {
    label: 'Rue de la Loi 16, 1000 Brussels, BE',
    street: 'Rue de la Loi 16',
    postalCode: '1000',
    locality: 'Brussels',
    country: 'BE',
    latitude: 50.8467,
    longitude: 4.3676,
  },
  {
    label: 'Avenue Louise 143, 1050 Ixelles, BE',
    street: 'Avenue Louise 143',
    postalCode: '1050',
    locality: 'Ixelles',
    country: 'BE',
    latitude: 50.8275,
    longitude: 4.3625,
  },
  {
    label: 'Grote Markt, 1000 Brussels, BE',
    street: null,
    postalCode: '1000',
    locality: 'Brussels',
    country: 'BE',
    latitude: null,
    longitude: null,
  },
];

/** A sample reverse-geocoding result. */
export const sampleReverseAddress: GeocodingReverseResponse = {
  street: 'Rue de la Loi 16',
  postalCode: '1000',
  locality: 'Brussels',
  country: 'BE',
  precision: 'Rooftop',
};
