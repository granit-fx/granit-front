import type { GeocodingConfig } from '../providers/geocoding-provider';

/**
 * Builds a consistent React Query key for geocoding operations. Accepts a `null`
 * config (no provider in scope) so callers can build a stable key for a disabled
 * query without duplicating the default prefix.
 */
export function buildGeocodingQueryKey(
  config: GeocodingConfig | null,
  ...segments: readonly unknown[]
): readonly unknown[] {
  const prefix = config?.queryKeyPrefix ?? ['geocoding'];
  return [...prefix, ...segments];
}
