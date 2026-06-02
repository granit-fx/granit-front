import { createQueryWrapper } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { buildLookupQueryKey } from '../hooks/query-keys';
import { useLookup } from '../hooks/use-lookup';

import type { LookupDescriptor, LookupResult } from '@granit/data-lookup';

describe('useLookup', () => {
  it('emits a search request when scope is satisfied', async () => {
    const client = createMockClient();
    const payload: LookupResult = { items: [{ value: '1', label: 'Acme' }] };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(payload));

    const { result } = renderHook(
      () => useLookup({ name: 'tenants' }, { search: 'ac' }, { client }),
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(payload);
    expect(result.current.missingScopeKey).toBeNull();
    expect(client.get).toHaveBeenCalled();
  });

  it('stays disabled and does NOT fire when a scope key is missing (Empty Scope Trap)', async () => {
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

  it('fires again once the missing scope key is filled', async () => {
    const client = createMockClient();
    const payload: LookupResult = { items: [{ value: 'm1', label: 'Meter One' }] };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(payload));

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
    expect(result.current.missingScopeKey).toBe('tenantId');

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
});

describe('buildLookupQueryKey', () => {
  it('includes the culture in the key so caches are per-language', () => {
    const descriptor: LookupDescriptor = { name: 'tenants' };
    const key1 = buildLookupQueryKey(descriptor, { search: 'acme' }, 'fr');
    const key2 = buildLookupQueryKey(descriptor, { search: 'acme' }, 'en');

    expect(key1).not.toEqual(key2);
  });

  it('has the granit/data-lookup/search prefix', () => {
    const key = buildLookupQueryKey({ name: 'tenants' }, { search: '' });

    expect(key[0]).toBe('granit');
    expect(key[1]).toBe('data-lookup');
    expect(key[2]).toBe('search');
    expect(key[3]).toBe('tenants');
  });
});
