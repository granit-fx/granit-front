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

/** Behaviour options for {@link createLookupHandlers}. */
export interface CreateLookupHandlersOptions {
  /**
   * Pagination mode emulated by the search handler:
   * - `'offset'` (default) — honors `page` / `pageSize`, returns `totalCount`,
   *   `continuationToken: null`.
   * - `'cursor'` — keyset/infinite-scroll: ignores `page`, returns an opaque
   *   `continuationToken` until the source is exhausted, `totalCount: null`.
   */
  readonly mode?: 'offset' | 'cursor';
}

/** Continuation token encoding for the cursor-mode handler: opaque offset marker. */
const CURSOR_PREFIX = 'offset:';

/**
 * Creates MSW handlers for the data-lookup endpoints.
 *
 * @param baseUrl - Base URL the endpoints are mounted at (default: `/lookups`).
 * @param sources - Source map keyed by registry name (default: {@link mockLookupSources}).
 * @param manifest - Manifest returned by `GET {baseUrl}` (default: {@link mockLookupManifest}).
 * @param options - Behaviour options, e.g. `{ mode: 'cursor' }` to test infinite-scroll keyset paging.
 */
export function createLookupHandlers(
  baseUrl: string = DEFAULT_LOOKUP_BASE_PATH,
  sources: LookupSourceMap = mockLookupSources,
  manifest: LookupManifest = mockLookupManifest,
  options: CreateLookupHandlersOptions = {}
) {
  const cursorMode = options.mode === 'cursor';

  return [
    http.get(baseUrl, () => HttpResponse.json(manifest)),

    http.get(`${baseUrl}/:name`, ({ params, request }) => {
      const source = sources[params.name as string];
      if (!source) return notFound();

      const url = new URL(request.url);
      const search = url.searchParams.get('search') ?? '';
      const pageSize = Number(url.searchParams.get('pageSize') ?? 25);
      const matched = searchItems(source, search);

      if (cursorMode) {
        const token = url.searchParams.get('continuationToken');
        const start = token?.startsWith(CURSOR_PREFIX)
          ? Number(token.slice(CURSOR_PREFIX.length))
          : 0;
        const end = start + pageSize;
        const response: LookupResult = {
          items: matched.slice(start, end),
          totalCount: null,
          continuationToken: end < matched.length ? `${CURSOR_PREFIX}${end}` : null,
        };
        return HttpResponse.json(response);
      }

      const page = Number(url.searchParams.get('page') ?? 1);
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
