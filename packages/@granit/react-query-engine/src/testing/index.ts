// ---------------------------------------------------------------------------
// @granit/react-query-engine/testing — MSW handler factory for /meta endpoints
// ---------------------------------------------------------------------------

import { http, HttpResponse } from 'msw';

import type { QueryMetadata } from '@granit/query-engine';
import type { RequestHandler } from 'msw';

/**
 * Create an MSW handler that responds to `GET {basePath}/meta` with the
 * provided {@link QueryMetadata}.
 *
 * Every queryable Granit resource exposes a `/meta` endpoint describing its
 * columns, filterable/sortable fields, presets, quick filters and pagination
 * defaults. `useSmartFilter` and `useQueryMeta` consume it directly — without
 * a registered handler, list pages crash with
 * `metadata.filterableFields is not iterable`.
 *
 * @param basePath - Resource base path, **without** the trailing `/meta`
 *                   (e.g. `/api/v1/multi-tenancy/tenants`).
 * @param metadata - The metadata payload to return.
 */
export function createQueryMetaHandler(basePath: string, metadata: QueryMetadata): RequestHandler {
  return http.get(`${basePath}/meta`, () => HttpResponse.json(metadata));
}

/**
 * Build a minimal {@link QueryMetadata} stub.
 *
 * Returns an empty-but-valid metadata object suitable for tests that need a
 * `/meta` response shape but do not care about the contents.
 *
 * @param overrides - Partial metadata to merge over the empty defaults.
 */
export function buildEmptyQueryMeta(overrides?: Partial<QueryMetadata>): QueryMetadata {
  return {
    columns: [],
    filterableFields: [],
    sortableFields: [],
    presetFilterGroups: [],
    quickFilters: [],
    dateFilters: [],
    groupByFields: [],
    pagination: {
      defaultPageSize: 25,
      maxPageSize: 100,
      maxStreamSize: 10_000,
      supportsCursor: false,
    },
    ...overrides,
  };
}
