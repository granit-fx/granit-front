import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { buildEmptyQueryMeta, createQueryMetaHandler } from '../testing/index';

import type { QueryMetadata } from '@granit/query-engine';

const server = setupServer();

// 'bypass' lets unhandled requests reach Node's real network stack (→ ENOTFOUND),
// avoiding MSW stderr noise in tests that deliberately probe non-matching paths.
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const BASE_URL = 'http://api.example.test/api/v1/widgets';

describe('createQueryMetaHandler', () => {
  it('responds to GET {basePath}/meta with the provided metadata', async () => {
    const metadata: QueryMetadata = buildEmptyQueryMeta({
      columns: [
        {
          name: 'id',
          label: 'ID',
          type: 'Guid',
          order: 0,
          isSortable: true,
          isFilterable: true,
          isVisible: true,
        },
      ],
      sortableFields: [{ name: 'id' }],
    });

    server.use(createQueryMetaHandler(BASE_URL, metadata));

    const response = await fetch(`${BASE_URL}/meta`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(metadata);
  });

  it('does not match unrelated paths', async () => {
    server.use(createQueryMetaHandler(BASE_URL, buildEmptyQueryMeta()));

    const result = await fetch('http://api.example.test/api/v1/other/meta').catch((e: Error) => e);

    expect(result).toBeInstanceOf(Error);
  });
});

describe('buildEmptyQueryMeta', () => {
  it('returns a structurally valid empty QueryMetadata', () => {
    const meta = buildEmptyQueryMeta();

    expect(meta.columns).toEqual([]);
    expect(meta.filterableFields).toEqual([]);
    expect(meta.sortableFields).toEqual([]);
    expect(meta.presetFilterGroups).toEqual([]);
    expect(meta.quickFilters).toEqual([]);
    expect(meta.dateFilters).toEqual([]);
    expect(meta.groupByFields).toEqual([]);
    expect(meta.pagination.defaultPageSize).toBeGreaterThan(0);
    expect(meta.pagination.maxPageSize).toBeGreaterThanOrEqual(meta.pagination.defaultPageSize);
  });

  it('merges overrides over the defaults', () => {
    const meta = buildEmptyQueryMeta({
      defaultSort: '-createdAt',
      pagination: {
        defaultPageSize: 50,
        maxPageSize: 200,
        maxStreamSize: 50_000,
        supportsCursor: true,
      },
    });

    expect(meta.defaultSort).toBe('-createdAt');
    expect(meta.pagination.defaultPageSize).toBe(50);
    expect(meta.pagination.supportsCursor).toBe(true);
    // Other defaults remain in place.
    expect(meta.filterableFields).toEqual([]);
  });
});
