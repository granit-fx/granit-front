'use client';

import { getAddressSuggestions } from '@granit/geocoding';
import { useQuery } from '@tanstack/react-query';

import {
  DEFAULT_DEBOUNCE_MS,
  DEFAULT_MIN_QUERY_LENGTH,
  DEFAULT_SUGGESTION_LIMIT,
} from '../constants';
import { useOptionalGeocodingConfig } from '../providers/geocoding-provider';

import { buildGeocodingQueryKey } from './query-keys';
import { useDebouncedValue } from './use-debounced-value';

import type { GeocodingSuggestionResponse } from '@granit/geocoding';

/** Whether an error is an HTTP 404 (endpoint not mapped / provider not installed). */
function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { response?: { status?: number } }).response?.status === 404
  );
}

export interface UseAddressSuggestionsOptions {
  /** Maximum number of suggestions to request. Default: {@link DEFAULT_SUGGESTION_LIMIT}. */
  readonly limit?: number;
  /** Debounce applied before the request fires. Default: {@link DEFAULT_DEBOUNCE_MS} ms. */
  readonly debounceMs?: number;
  /** Minimum (trimmed) length before querying. Default: {@link DEFAULT_MIN_QUERY_LENGTH}. */
  readonly minQueryLength?: number;
  /** Set `false` to suspend querying (e.g. while the field is unfocused). */
  readonly enabled?: boolean;
}

export interface UseAddressSuggestionsResult {
  /** Suggestions for the current (debounced) query — best match first. */
  readonly suggestions: readonly GeocodingSuggestionResponse[];
  /** The debounced query the suggestions correspond to. */
  readonly query: string;
  /** First page is loading (no data yet). */
  readonly isLoading: boolean;
  /** A request is in flight. */
  readonly isFetching: boolean;
  /** A request settled successfully (the suggestions reflect the current query). */
  readonly isSuccess: boolean;
  /** A genuine error occurred (excludes the "endpoint unavailable" 404 case). */
  readonly isError: boolean;
  /**
   * The endpoint is unavailable — no provider configured (`null` config) or the
   * route is not mapped (HTTP 404). The UI should fall back to manual entry
   * rather than treat this as an error.
   */
  readonly isUnavailable: boolean;
}

/**
 * Debounced address-autocomplete hook. Calls `GET {basePath}/autocomplete` for
 * the (trimmed, debounced) `search` term and returns ranked suggestions.
 *
 * Designed as **progressive enhancement**: when no `GeocodingProvider` is in
 * scope, or the endpoint 404s (provider not installed), it stays quiet and
 * reports `isUnavailable` so the caller can fall back to plain manual entry.
 * React Query aborts the in-flight request automatically when `search` changes.
 */
export function useAddressSuggestions(
  search: string,
  options: UseAddressSuggestionsOptions = {}
): UseAddressSuggestionsResult {
  const {
    limit = DEFAULT_SUGGESTION_LIMIT,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    minQueryLength = DEFAULT_MIN_QUERY_LENGTH,
    enabled = true,
  } = options;

  const config = useOptionalGeocodingConfig();
  const debounced = useDebouncedValue(search.trim(), debounceMs);
  const isEnabled = enabled && config !== null && debounced.length >= minQueryLength;

  const result = useQuery({
    queryKey: buildGeocodingQueryKey(config, 'autocomplete', debounced, limit),
    queryFn: ({ signal }) =>
      // `config` is non-null whenever the query is enabled.
      getAddressSuggestions(config!.client, config!.basePath, { q: debounced, limit }, signal),
    enabled: isEnabled,
    // Per-keystroke endpoint — a failed suggestion request is not worth retrying
    // (the next keystroke supersedes it); a 404 means the capability is absent.
    retry: false,
    staleTime: 60_000,
  });

  const unavailable = config === null || isNotFound(result.error);

  return {
    suggestions: result.data?.suggestions ?? [],
    query: debounced,
    isLoading: result.isLoading && isEnabled,
    isFetching: result.isFetching,
    isSuccess: result.isSuccess,
    isError: result.isError && !unavailable,
    isUnavailable: unavailable,
  };
}
