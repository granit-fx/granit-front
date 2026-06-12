/**
 * Approximate geographic location, typically derived from an IP address.
 * Mirrors `Granit.IpGeolocation.GeoLocation`.
 *
 * The shape is source-agnostic — a city/region/country is a location regardless
 * of how it was resolved. Every member is independently optional: a provider
 * populates only what its data source supports (an offline country-only database
 * leaves {@link GeoLocation.city} and the coordinates `null`).
 *
 * These strings come from a geolocation data source and are display-only:
 * render them as text, never as HTML.
 */
export interface GeoLocation {
  /** City name (e.g. "Brussels"), when the data source resolves to city granularity. */
  readonly city: string | null;
  /** Most specific subdivision — region/state/province (e.g. "Brussels-Capital"). */
  readonly region: string | null;
  /** Country display name (e.g. "Belgium"). */
  readonly country: string | null;
  /** ISO 3166-1 alpha-2 country code (e.g. "BE"). */
  readonly countryCode: string | null;
  /** Approximate latitude in decimal degrees, when available. */
  readonly latitude: number | null;
  /** Approximate longitude in decimal degrees, when available. */
  readonly longitude: number | null;
}
