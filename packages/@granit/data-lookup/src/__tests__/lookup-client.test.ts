import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_LOOKUP_BASE_PATH,
  buildSearchQuery,
  getLookupManifest,
  resolveLookup,
  searchLookup,
} from '../api/lookup-client';

import type {
  LookupDescriptor,
  LookupItemResponse,
  LookupManifestResponse,
  LookupResultResponse,
} from '../types/index';

describe('buildSearchQuery', () => {
  it('uses the default "search" param name', () => {
    const query = buildSearchQuery({ name: 'tenants' }, { search: 'acme' });
    expect(query).toEqual({ search: 'acme' });
  });

  it('honors a custom searchParam for Simple sources', () => {
    const query = buildSearchQuery(
      { name: 'x', kind: 'Simple', searchParam: 'q' },
      { search: 'hello' }
    );
    expect(query).toEqual({ q: 'hello' });
  });

  it('honors a custom searchParam for custom endpoint sources', () => {
    const query = buildSearchQuery(
      { endpoint: '/api/external/x', searchParam: 'q' },
      { search: 'hello' }
    );
    expect(query).toEqual({ q: 'hello' });
  });

  it('ignores searchParam for non-Simple registry sources (backend always binds "search")', () => {
    const query = buildSearchQuery(
      { name: 'x', kind: 'QueryEngine', searchParam: 'q' },
      { search: 'hello' }
    );
    expect(query).toEqual({ search: 'hello' });
  });

  it('omits empty search term', () => {
    expect(buildSearchQuery({ name: 't' }, { search: '' })).toEqual({});
    expect(buildSearchQuery({ name: 't' }, {})).toEqual({});
  });

  it('serializes page, pageSize, and continuationToken', () => {
    expect(
      buildSearchQuery({ name: 't' }, { page: 2, pageSize: 50, continuationToken: 'abc' })
    ).toEqual({ page: 2, pageSize: 50, continuationToken: 'abc' });
  });

  it('emits scope.<key> for non-empty values only', () => {
    const query = buildSearchQuery(
      { name: 'meters' },
      { scope: { tenantId: 'abc', empty: '', nothing: null, absent: undefined } }
    );
    expect(query).toEqual({ 'scope.tenantId': 'abc' });
  });
});

describe('searchLookup', () => {
  it('hits /lookups/{name} by default', async () => {
    const client = createMockClient();
    const payload: LookupResultResponse = {
      items: [{ value: '1', label: 'Acme', extra: null }],
      totalCount: 1,
      continuationToken: null,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(payload));

    await searchLookup({ name: 'tenants' }, { search: 'acme' }, { client });

    expect(client.get).toHaveBeenCalledWith(
      `${DEFAULT_LOOKUP_BASE_PATH}/tenants`,
      expect.objectContaining({ params: { search: 'acme' } })
    );
  });

  it('hits the custom endpoint when descriptor.endpoint is set', async () => {
    const client = createMockClient();
    const payload: LookupResultResponse = { items: [], totalCount: 0, continuationToken: null };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(payload));

    const descriptor: LookupDescriptor = {
      endpoint: '/api/external/stripe/customers',
      searchParam: 'query',
    };
    await searchLookup(descriptor, { search: 'acme' }, { client });

    expect(client.get).toHaveBeenCalledWith(
      '/api/external/stripe/customers',
      expect.objectContaining({ params: { query: 'acme' } })
    );
  });

  it('throws when neither name nor endpoint is provided', async () => {
    const client = createMockClient();

    await expect(searchLookup({}, { search: 'x' }, { client })).rejects.toThrow(
      /LookupDescriptor requires/
    );
  });
});

describe('resolveLookup', () => {
  it('returns null for null/undefined/empty values without hitting the network', async () => {
    const client = createMockClient();

    await expect(resolveLookup({ name: 't' }, null, { client })).resolves.toBeNull();
    await expect(resolveLookup({ name: 't' }, undefined, { client })).resolves.toBeNull();
    await expect(resolveLookup({ name: 't' }, '', { client })).resolves.toBeNull();
    expect(client.get).not.toHaveBeenCalled();
  });

  it('returns the resolved item on 200', async () => {
    const client = createMockClient();
    const item: LookupItemResponse = { value: 'BE', label: 'Belgique', extra: null };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(item));

    const result = await resolveLookup({ name: 'ref-country' }, 'BE', { client });

    expect(result).toEqual(item);
    expect(client.get).toHaveBeenCalledWith(
      `${DEFAULT_LOOKUP_BASE_PATH}/ref-country/resolve`,
      expect.objectContaining({ params: { value: 'BE' } })
    );
  });

  it('returns null on 404 instead of throwing', async () => {
    const client = createMockClient();
    const notFound = Object.assign(new Error('not found'), {
      response: { status: 404 },
    });
    vi.mocked(client.get).mockRejectedValue(notFound);

    const result = await resolveLookup({ name: 't' }, 'missing', { client });

    expect(result).toBeNull();
  });

  it('rethrows non-404 errors', async () => {
    const client = createMockClient();
    const serverError = Object.assign(new Error('boom'), {
      response: { status: 500 },
    });
    vi.mocked(client.get).mockRejectedValue(serverError);

    await expect(resolveLookup({ name: 't' }, 'x', { client })).rejects.toThrow(/boom/);
  });
});

describe('getLookupManifest', () => {
  it('returns the discovery manifest', async () => {
    const client = createMockClient();
    const manifest: LookupManifestResponse = {
      lookups: [{ name: 'tenants', kind: 'QueryEngine', requiredPermission: null, scopeKeys: [] }],
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(manifest));

    const result = await getLookupManifest({ client });

    expect(result).toEqual(manifest);
    expect(client.get).toHaveBeenCalledWith(DEFAULT_LOOKUP_BASE_PATH, expect.any(Object));
  });
});

describe('basePath override', () => {
  it('uses custom basePath for registry lookups', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ items: [], totalCount: 0, continuationToken: null } as LookupResultResponse)
    );

    await searchLookup({ name: 'tenants' }, {}, { client, basePath: '/custom/lookups' });

    expect(client.get).toHaveBeenCalledWith('/custom/lookups/tenants', expect.any(Object));
  });
});

// silence noisy unused imports when vi is not referenced elsewhere
void vi;
