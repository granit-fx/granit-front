import type {
  GeocodingAutocompleteParams,
  GeocodingAutocompleteResponse,
  GeocodingReverseParams,
  GeocodingReverseResponse,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Suggest addresses for a partial query (typeahead).
 *
 * High-volume endpoint — the upstream provider quota is a shared resource, so
 * callers MUST debounce input before invoking this (see
 * `@granit/react-geocoding`). Pass an `AbortSignal` to cancel an in-flight
 * request when the input changes.
 *
 * The endpoint is **capability-gated**: when no autocomplete-capable provider
 * is installed it is not mapped and the request 404s — treat that as "feature
 * unavailable, fall back to manual entry" rather than a hard error.
 *
 * `GET {basePath}/autocomplete?q={q}&limit={limit}`
 */
export async function getAddressSuggestions(
  client: AxiosInstance,
  basePath: string,
  params: GeocodingAutocompleteParams,
  signal?: AbortSignal
): Promise<GeocodingAutocompleteResponse> {
  const response = await client.get<GeocodingAutocompleteResponse>(`${basePath}/autocomplete`, {
    params: { q: params.q, limit: params.limit },
    signal,
  });
  return response.data;
}

/**
 * Reverse-geocode a coordinate to the nearest postal address.
 *
 * The endpoint is **capability-gated**: when no reverse-capable provider is
 * installed it is not mapped (404). When mapped, an out-of-range coordinate is
 * rejected with `422` and a coordinate that resolves to nothing returns `404` —
 * callers should handle both quietly.
 *
 * `GET {basePath}/reverse?lat={lat}&lon={lon}`
 */
export async function getReverseGeocode(
  client: AxiosInstance,
  basePath: string,
  params: GeocodingReverseParams,
  signal?: AbortSignal
): Promise<GeocodingReverseResponse> {
  const response = await client.get<GeocodingReverseResponse>(`${basePath}/reverse`, {
    params: { lat: params.lat, lon: params.lon },
    signal,
  });
  return response.data;
}
