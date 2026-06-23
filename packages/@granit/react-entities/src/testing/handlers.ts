import { notFound } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import {
  mockBulkActionResponse,
  mockCalendarItems,
  mockEntityDiscovery,
  mockEntityManifest,
  mockRelationAggregates,
} from './data';

import type { CalendarItemResponse } from '@granit/entities';

/** Default base path the entities endpoints mount under (mirrors the hooks). */
export const ENTITIES_BASE_PATH = '/api/v1/entities';

/** Strong ETag the manifest handler emits — drives the 304 / If-None-Match path. */
export const SAMPLE_MANIFEST_ETAG = '"f1d2d2f924e986ac86fdf7b36c94bcdf32beec15"';

/**
 * Create stateful MSW handlers for the `@granit/entities` HTTP surface:
 * discovery, per-entity manifest (ETag-aware), calendar range, relation
 * aggregates and bulk actions. Pass an absolute `baseUrl` (including the
 * origin) when the test server expects fully-qualified URLs.
 *
 * @param baseUrl - API base path (default: `/api/v1/entities`)
 */
export function createEntitiesHandlers(baseUrl = ENTITIES_BASE_PATH) {
  return [
    // GET /entities — discovery tree
    http.get(baseUrl, () => HttpResponse.json(mockEntityDiscovery)),

    // GET /entities/:name/calendar — events overlapping the [from, to] window,
    // narrowed by optional filter[…] / search params.
    http.get(`${baseUrl}/:name/calendar`, ({ request }) => {
      const url = new URL(request.url);
      const search = url.searchParams.get('search');
      let items: CalendarItemResponse[] = [...mockCalendarItems];
      if (search) {
        items = items.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()));
      }
      return HttpResponse.json(items);
    }),

    // POST /entities/:name/:id/relations/aggregates — batched aggregate values
    http.post(`${baseUrl}/:name/:id/relations/aggregates`, () =>
      HttpResponse.json(mockRelationAggregates)
    ),

    // POST /entities/:name/bulk/:action — fan-out action, partial-failure recap
    http.post(`${baseUrl}/:name/bulk/:action`, () => HttpResponse.json(mockBulkActionResponse)),

    // GET /entities/:name — per-entity manifest with ETag / 304 support
    http.get(`${baseUrl}/:name`, ({ request, params }) => {
      if (typeof params.name !== 'string' || params.name.length === 0) {
        return notFound();
      }
      if (request.headers.get('if-none-match') === SAMPLE_MANIFEST_ETAG) {
        return new HttpResponse(null, { status: 304, headers: { ETag: SAMPLE_MANIFEST_ETAG } });
      }
      return HttpResponse.json(mockEntityManifest, { headers: { ETag: SAMPLE_MANIFEST_ETAG } });
    }),
  ];
}
