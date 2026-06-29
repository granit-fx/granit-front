'use client';

import { getReverseGeocode } from '@granit/geocoding';
import { useQuery } from '@tanstack/react-query';

import {
  buildGeocodingQueryKey,
  useOptionalGeocodingConfig,
} from '../providers/geocoding-provider';

import type { GeocodingReverseResponse } from '@granit/geocoding';

/** A latitude/longitude pair to reverse-geocode. */
export interface Coordinate {
  readonly lat: number;
  readonly lon: number;
}

/** An HTTP status from an Axios-style error, or `undefined`. */
function statusOf(error: unknown): number | undefined {
  return (error as { response?: { status?: number } } | null)?.response?.status;
}

/**
 * "Soft" statuses that mean "no address" rather than a failure: endpoint not
 * mapped (404), no match (404), or an out-of-range coordinate (422). The UI
 * should swallow these — a pin-drop on the ocean is not an error.
 */
function isSoftMiss(error: unknown): boolean {
  const status = statusOf(error);
  return status === 404 || status === 422;
}

export interface UseReverseGeocodeResult {
  /** The resolved address, or `null` when nothing resolved / no coordinate given. */
  readonly address: GeocodingReverseResponse | null;
  /** A lookup is in flight. */
  readonly isLoading: boolean;
  /** A genuine error occurred (excludes the soft 404/422 misses). */
  readonly isError: boolean;
  /** The endpoint is unavailable — no provider configured or the route is not mapped. */
  readonly isUnavailable: boolean;
}

/**
 * Reverse-geocode a coordinate to the nearest postal address — the data half of
 * a map pin-drop. Pass the clicked coordinate (or `null` to disable); on a hit,
 * `address` carries the structured fields to pre-fill a form.
 *
 * `@granit/react-map` is presentation-only (no interactive click callback), so
 * this hook is intentionally headless: wire it to whichever map a consuming app
 * uses. Out-of-range (422) and no-match / not-mapped (404) responses resolve to
 * `address: null` without surfacing an error.
 */
export function useReverseGeocode(
  coordinate: Coordinate | null,
  options: { readonly enabled?: boolean } = {}
): UseReverseGeocodeResult {
  const { enabled = true } = options;
  const config = useOptionalGeocodingConfig();
  const isEnabled = enabled && config !== null && coordinate !== null;

  const result = useQuery({
    queryKey: buildGeocodingQueryKey(
      config,
      'reverse',
      coordinate?.lat ?? null,
      coordinate?.lon ?? null
    ),
    queryFn: ({ signal }) =>
      getReverseGeocode(config!.client, config!.basePath, coordinate!, signal),
    enabled: isEnabled,
    // A pin-drop is user-initiated and cheap to repeat; soft 404/422 misses are
    // expected, so don't retry — surface the result (or its absence) at once.
    retry: false,
    staleTime: 5 * 60_000,
  });

  const unavailable = config === null || statusOf(result.error) === 404;

  return {
    address: result.data ?? null,
    isLoading: result.isLoading && isEnabled,
    isError: result.isError && !isSoftMiss(result.error),
    isUnavailable: unavailable,
  };
}
