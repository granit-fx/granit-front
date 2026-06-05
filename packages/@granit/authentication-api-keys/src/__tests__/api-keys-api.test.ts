import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { getApiKeysQueryMeta, listApiKeys } from '../api/api-keys-api';

import type { ApiKeyListPage } from '../types/index';

const basePath = '/api/v1/authentication';

const emptyPage: ApiKeyListPage = { items: [], totalCount: 0, hasMore: false, nextCursor: null };

/** The single URL string `getPage`/`getQueryMeta` forwarded to `client.get`. */
function calledUrl(client: ReturnType<typeof createMockClient>): string {
  return decodeURIComponent(vi.mocked(client.get).mock.calls[0]![0] as string);
}

describe('listApiKeys', () => {
  it('GETs the api-keys sub-path with no query string when params are empty', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(emptyPage));

    const result = await listApiKeys(client, basePath);

    expect(client.get).toHaveBeenCalledWith(`${basePath}/api-keys`, undefined);
    expect(result.items).toEqual([]);
  });

  it('serializes the QueryEngine grammar (search, filter, quickFilters, sort, page)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(emptyPage));

    await listApiKeys(client, basePath, {
      page: 1,
      pageSize: 20,
      search: 'labo',
      filters: [
        { field: 'type', operator: 'Eq', value: 'Secret' },
        { field: 'environment', operator: 'Eq', value: 'live' },
      ],
      quickFilters: ['includeRevoked'],
      sort: [{ field: 'createdAt', direction: 'desc' }],
    });

    const url = calledUrl(client);
    expect(url.startsWith(`${basePath}/api-keys?`)).toBe(true);
    expect(url).toContain('search=labo');
    expect(url).toContain('filter[type.Eq]=Secret');
    expect(url).toContain('filter[environment.Eq]=live');
    expect(url).toContain('quickFilters=includeRevoked');
    expect(url).toContain('sort=-createdAt');
    expect(url).toContain('page=1');
  });

  it('forwards the abort signal to the request', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(emptyPage));
    const signal = new AbortController().signal;

    await listApiKeys(client, basePath, {}, { signal });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/api-keys`, { signal });
  });
});

describe('getApiKeysQueryMeta', () => {
  it('GETs the api-keys /meta sub-path', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ columns: [], filterableFields: [] }));

    await getApiKeysQueryMeta(client, basePath);

    expect(client.get).toHaveBeenCalledWith(`${basePath}/api-keys/meta`, undefined);
  });
});
