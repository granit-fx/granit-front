/**
 * Granularity of a reverse-geocoding match. Mirrors the .NET
 * `Granit.Domain.ValueObjects.GeocodeMatchPrecision` enum (string-serialized).
 *
 * - `Rooftop` — matched to an exact building / house number.
 * - `Street` — matched to a street (interpolated along the road).
 * - `Locality` — matched only to a locality / postcode centroid (coarse).
 */
export type GeocodeMatchPrecision = 'Rooftop' | 'Street' | 'Locality';

/** Convenience map mirroring the .NET enum names. */
export const GeocodeMatchPrecision = {
  Rooftop: 'Rooftop',
  Street: 'Street',
  Locality: 'Locality',
} as const satisfies Record<string, GeocodeMatchPrecision>;

/**
 * A single address-autocomplete suggestion, flattened for the wire. Mirrors the
 * .NET `GeocodingSuggestionResponse`.
 *
 * `latitude`/`longitude` are `null` when the provider returned no coordinate;
 * `street`/`postalCode` are `null` when the provider matched only to a locality.
 */
export interface GeocodingSuggestionResponse {
  /** Human-readable one-line label for the typeahead list. */
  readonly label: string;
  /** Street line, or `null`. */
  readonly street: string | null;
  /** Postal code, or `null`. */
  readonly postalCode: string | null;
  /** Locality (city/town). */
  readonly locality: string;
  /** Country (ISO 3166-1 alpha-2 where known). */
  readonly country: string;
  /** Latitude, or `null` when the provider returned no coordinate. */
  readonly latitude: number | null;
  /** Longitude, or `null` when the provider returned no coordinate. */
  readonly longitude: number | null;
}

/**
 * The address-autocomplete suggestions for a partial query. Mirrors the .NET
 * `GeocodingAutocompleteResponse`.
 */
export interface GeocodingAutocompleteResponse {
  /** The suggestions, best match first (possibly empty). */
  readonly suggestions: readonly GeocodingSuggestionResponse[];
}

/**
 * The postal address nearest a reverse-geocoded coordinate. Mirrors the .NET
 * `GeocodingReverseResponse`.
 */
export interface GeocodingReverseResponse {
  /** Street line, or `null`. */
  readonly street: string | null;
  /** Postal code, or `null`. */
  readonly postalCode: string | null;
  /** Locality (city/town). */
  readonly locality: string;
  /** Country (ISO 3166-1 alpha-2). */
  readonly country: string;
  /** Match granularity (rooftop / street / locality). */
  readonly precision: GeocodeMatchPrecision;
}

/** Query parameters for the address-autocomplete endpoint. */
export interface GeocodingAutocompleteParams {
  /** Partial address text to suggest for. */
  readonly q: string;
  /** Maximum number of suggestions. Backend default: `5`. */
  readonly limit?: number;
}

/** Query parameters for the reverse-geocoding endpoint. */
export interface GeocodingReverseParams {
  /** Latitude in decimal degrees, in the range [-90, 90]. */
  readonly lat: number;
  /** Longitude in decimal degrees, in the range [-180, 180]. */
  readonly lon: number;
}
