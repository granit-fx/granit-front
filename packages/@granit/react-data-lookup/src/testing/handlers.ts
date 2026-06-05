// ---------------------------------------------------------------------------
// @granit/react-data-lookup/testing — MSW handlers for `/lookups/*`
// ---------------------------------------------------------------------------
//
// Canonical stand-ins for the three Granit.DataLookup endpoints:
//   GET {baseUrl}                  → manifest
//   GET {baseUrl}/:name            → paginated typeahead search
//   GET {baseUrl}/:name/resolve    → single-item rehydration (or null)
//
// Consumers pass their own sources/manifest; defaults come from ./data.

import { DEFAULT_LOOKUP_BASE_PATH } from '@granit/data-lookup';
import { notFound } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { mockLookupManifest, mockLookupSources } from './data';

import type { LookupItem, LookupManifest, LookupResult } from '@granit/data-lookup';

/** A registry source: its kind is described by the manifest, its items live here. */
export type LookupSourceMap = Readonly<Record<string, readonly LookupItem[]>>;

function searchItems(items: readonly LookupItem[], search: string): readonly LookupItem[] {
  const q = search.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (i) => String(i.value).toLowerCase().includes(q) || i.label.toLowerCase().includes(q)
  );
}

/**
 * Creates MSW handlers for the data-lookup endpoints.
 *
 * @param baseUrl - Base URL the endpoints are mounted at (default: `/lookups`).
 * @param sources - Source map keyed by registry name (default: {@link mockLookupSources}).
 * @param manifest - Manifest returned by `GET {baseUrl}` (default: {@link mockLookupManifest}).
 */
export function createLookupHandlers(
  baseUrl: string = DEFAULT_LOOKUP_BASE_PATH,
  sources: LookupSourceMap = mockLookupSources,
  manifest: LookupManifest = mockLookupManifest
) {
  return [
    http.get(baseUrl, () => HttpResponse.json(manifest)),

    http.get(`${baseUrl}/:name`, ({ params, request }) => {
      const source = sources[params.name as string];
      if (!source) return notFound();

      const url = new URL(request.url);
      const search = url.searchParams.get('search') ?? '';
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 25);
      const matched = searchItems(source, search);
      const start = (page - 1) * pageSize;

      const response: LookupResult = {
        items: matched.slice(start, start + pageSize),
        totalCount: matched.length,
        continuationToken: null,
      };
      return HttpResponse.json(response);
    }),

    http.get(`${baseUrl}/:name/resolve`, ({ params, request }) => {
      const source = sources[params.name as string];
      const value = new URL(request.url).searchParams.get('value') ?? '';
      const item = source?.find((i) => String(i.value) === value) ?? null;
      return HttpResponse.json(item);
    }),
  ];
}
