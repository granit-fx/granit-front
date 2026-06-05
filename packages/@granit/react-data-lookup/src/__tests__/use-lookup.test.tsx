import { createQueryWrapper } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { buildLookupQueryKey } from '../hooks/query-keys';
import { useLookup } from '../hooks/use-lookup';

import type { AxiosInstance } from '@granit/api-client';
import type { LookupDescriptor, LookupItem, LookupResult } from '@granit/data-lookup';

/** Builds N sample items: `{ value: "0", label: "Item 0" }`, … */
function sampleItems(count: number): LookupItem[] {
  return Array.from({ length: count }, (_, i) => ({
    value: String(i),
    label: `Item ${i}`,
    extra: null,
  }));
}

/** Reads the query params axios was called with on its most recent search request. */
function lastParams(client: AxiosInstance): Record<string, unknown> {
  const calls = vi.mocked(client.get).mock.calls;
  const search = [...calls].reverse().find((c) => !String(c[0]).includes('/resolve'));
  return (search?.[1] as { params?: Record<string, unknown> } | undefined)?.params ?? {};
}

describe('useLookup', () => {
  it('emits a search request and exposes flattened items when scope is satisfied', async () => {
    const client = createMockClient();
    const payload: LookupResult = {
      items: [{ value: '1', label: 'Acme', extra: null }],
      totalCount: 1,
      continuationToken: null,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(payload));

    const { result } = renderHook(
      () => useLookup({ name: 'tenants' }, { search: 'ac' }, { client }),
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.items).toEqual(payload.items);
    expect(result.current.totalCount).toBe(1);
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.missingScopeKey).toBeNull();
  });

  it('stays disabled and does NOT fire when a scope key is missing (Empty Scope Trap)', () => {
    const client = createMockClient();

    const { result } = renderHook(
      () =>
        useLookup(
          { name: 'meters', scopeKeys: ['tenantId'] },
          { search: 'kwh', scope: {} },
          { client }
        ),
      { wrapper: createQueryWrapper() }
    );

    expect(result.current.missingScopeKey).toBe('tenantId');
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('fires once the missing scope key is filled', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({
        items: sampleItems(1),
        totalCount: 1,
        continuationToken: null,
      } as LookupResult)
    );

    const { result, rerender } = renderHook(
      ({ scope }: { scope: Record<string, string | null | undefined> }) =>
        useLookup(
          { name: 'meters', scopeKeys: ['tenantId'] },
          { search: 'kwh', scope },
          { client }
        ),
      {
        wrapper: createQueryWrapper(),
        initialProps: { scope: { tenantId: '' } as Record<string, string | null | undefined> },
      }
    );

    expect(client.get).not.toHaveBeenCalled();

    rerender({ scope: { tenantId: 'acme' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.missingScopeKey).toBeNull();
    expect(client.get).toHaveBeenCalledTimes(1);
  });

  it('forced enabled=false overrides even when scope is satisfied', () => {
    const client = createMockClient();

    renderHook(() => useLookup({ name: 'tenants' }, { search: 'ac' }, { client, enabled: false }), {
      wrapper: createQueryWrapper(),
    });

    expect(client.get).not.toHaveBeenCalled();
  });

  it('paginates in OFFSET mode: fetchNextPage accumulates until totalCount is reached', async () => {
    const client = createMockClient();
    const all = sampleItems(5);
    vi.mocked(client.get).mockImplementation((_url, config) => {
      const page = Number((config as { params?: { page?: number } }).params?.page ?? 1);
      const pageSize = 2;
      const start = (page - 1) * pageSize;
      return Promise.resolve(
        axiosResponse({
          items: all.slice(start, start + pageSize),
          totalCount: all.length,
          continuationToken: null,
        } as LookupResult)
      );
    });

    const { result } = renderHook(
      () => useLookup({ name: 'tenants' }, { pageSize: 2 }, { client }),
      {
        wrapper: createQueryWrapper(),
      }
    );

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.totalCount).toBe(5);

    act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.items).toHaveLength(4));

    act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.items).toHaveLength(5));
    expect(result.current.hasNextPage).toBe(false);
    expect(lastParams(client).page).toBe(3);
  });

  it('paginates in CURSOR mode: forwards continuationToken, stops when it comes back null', async () => {
    const client = createMockClient();
    const all = sampleItems(5);
    vi.mocked(client.get).mockImplementation((_url, config) => {
      const token = (config as { params?: { continuationToken?: string } }).params
        ?.continuationToken;
      const start = token ? Number(token) : 0;
      const pageSize = 2;
      const end = start + pageSize;
      return Promise.resolve(
        axiosResponse({
          items: all.slice(start, end),
          totalCount: null,
          continuationToken: end < all.length ? String(end) : null,
        } as LookupResult)
      );
    });

    const { result } = renderHook(
      () => useLookup({ name: 'tenants' }, { pageSize: 2 }, { client }),
      {
        wrapper: createQueryWrapper(),
      }
    );

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.totalCount).toBeNull();
    expect(result.current.hasNextPage).toBe(true);

    act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.items).toHaveLength(4));

    act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.items).toHaveLength(5));
    expect(result.current.hasNextPage).toBe(false);
    expect(lastParams(client).continuationToken).toBe('4');
  });

  it('debounces the search term so rapid keystrokes coalesce into one request', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ items: [], totalCount: 0, continuationToken: null } as LookupResult)
    );

    const { rerender } = renderHook(
      ({ s }: { s: string }) =>
        useLookup({ name: 'tenants' }, { search: s }, { client, debounceMs: 80 }),
      { wrapper: createQueryWrapper(), initialProps: { s: '' } }
    );

    await waitFor(() => expect(client.get).toHaveBeenCalledTimes(1));

    rerender({ s: 'a' });
    rerender({ s: 'ab' });
    rerender({ s: 'abc' });

    await waitFor(() => expect(lastParams(client).search).toBe('abc'));
    // Initial '' + the single coalesced 'abc' — never 'a' or 'ab'.
    expect(client.get).toHaveBeenCalledTimes(2);
  });
});

describe('buildLookupQueryKey', () => {
  it('includes the culture so caches are per-language', () => {
    const descriptor: LookupDescriptor = { name: 'tenants' };
    expect(buildLookupQueryKey(descriptor, { search: 'acme' }, 'fr')).not.toEqual(
      buildLookupQueryKey(descriptor, { search: 'acme' }, 'en')
    );
  });

  it('has the granit/data-lookup/search prefix and omits the page cursor', () => {
    const key = buildLookupQueryKey({ name: 'tenants' }, { search: '', pageSize: 10 });
    expect(key.slice(0, 4)).toEqual(['granit', 'data-lookup', 'search', 'tenants']);
    expect(key[4]).not.toHaveProperty('page');
    expect(key[4]).not.toHaveProperty('continuationToken');
  });
});
