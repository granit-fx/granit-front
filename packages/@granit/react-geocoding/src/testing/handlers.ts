import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { sampleReverseAddress, sampleSuggestions } from './data';

import type {
  GeocodingAutocompleteResponse,
  GeocodingReverseResponse,
  GeocodingSuggestionResponse,
} from '@granit/geocoding';
import type { RequestHandler } from 'msw';

export interface CreateGeocodingHandlersOptions {
  /** Suggestions returned by the autocomplete handler (filtered by `q`, sliced by `limit`). */
  readonly suggestions?: readonly GeocodingSuggestionResponse[];
  /** Address returned by the reverse handler, or `null` to respond `404`. */
  readonly reverseAddress?: GeocodingReverseResponse | null;
}

/**
 * MSW handlers for the geocoding endpoints. The autocomplete handler filters the
 * sample suggestions by the `q` term (case-insensitive substring on the label)
 * and honours `limit`; the reverse handler returns a fixed address, validates
 * the coordinate bounds (`422`), and `404`s when `reverseAddress` is `null`.
 */
export function createGeocodingHandlers(
  baseUrl: string = DEFAULT_BASE_PATH,
  options: CreateGeocodingHandlersOptions = {}
): RequestHandler[] {
  const suggestions = options.suggestions ?? sampleSuggestions;
  const reverseAddress =
    options.reverseAddress === undefined ? sampleReverseAddress : options.reverseAddress;

  return [
    http.get(`${baseUrl}/autocomplete`, ({ request }) => {
      const url = new URL(request.url);
      const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
      const limit = Number(url.searchParams.get('limit') ?? '5');
      const matched = suggestions.filter((s) => s.label.toLowerCase().includes(q));
      const body: GeocodingAutocompleteResponse = { suggestions: matched.slice(0, limit) };
      return HttpResponse.json(body);
    }),

    http.get(`${baseUrl}/reverse`, ({ request }) => {
      const url = new URL(request.url);
      const lat = Number(url.searchParams.get('lat'));
      const lon = Number(url.searchParams.get('lon'));
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        Math.abs(lat) > 90 ||
        Math.abs(lon) > 180
      ) {
        return HttpResponse.json(
          { type: 'about:blank', title: 'Validation failed', status: 422 },
          { status: 422 }
        );
      }
      if (reverseAddress === null) {
        return HttpResponse.json(
          { type: 'about:blank', title: 'Not found', status: 404 },
          { status: 404 }
        );
      }
      return HttpResponse.json(reverseAddress);
    }),
  ];
}

/** Handlers simulating an absent capability — both routes respond `404` (not mapped). */
export function createUnavailableGeocodingHandlers(
  baseUrl: string = DEFAULT_BASE_PATH
): RequestHandler[] {
  const notMapped = () =>
    HttpResponse.json({ type: 'about:blank', title: 'Not found', status: 404 }, { status: 404 });
  return [
    http.get(`${baseUrl}/autocomplete`, notMapped),
    http.get(`${baseUrl}/reverse`, notMapped),
  ];
}
