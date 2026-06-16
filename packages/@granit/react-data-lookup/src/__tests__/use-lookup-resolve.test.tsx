import { createQueryWrapper } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useLookupResolve } from '../hooks/use-lookup-resolve';

import type { LookupItemResponse } from '@granit/data-lookup';

describe('useLookupResolve', () => {
  it('fetches the item when value is defined', async () => {
    const client = createMockClient();
    const item: LookupItemResponse = { value: 'BE', label: 'Belgium', extra: null };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(item));

    const { result } = renderHook(
      () => useLookupResolve({ name: 'ref-country' }, 'BE', { client }),
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(item);
  });

  it('stays disabled when value is null / undefined / empty', () => {
    const client = createMockClient();

    const { result: rNull } = renderHook(
      () => useLookupResolve({ name: 'ref-country' }, null, { client }),
      { wrapper: createQueryWrapper() }
    );
    const { result: rUndef } = renderHook(
      () => useLookupResolve({ name: 'ref-country' }, undefined, { client }),
      { wrapper: createQueryWrapper() }
    );
    const { result: rEmpty } = renderHook(
      () => useLookupResolve({ name: 'ref-country' }, '', { client }),
      { wrapper: createQueryWrapper() }
    );

    expect(rNull.current.fetchStatus).toBe('idle');
    expect(rUndef.current.fetchStatus).toBe('idle');
    expect(rEmpty.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('respects forced enabled=false even when value is defined', () => {
    const client = createMockClient();

    renderHook(() => useLookupResolve({ name: 'ref-country' }, 'BE', { client, enabled: false }), {
      wrapper: createQueryWrapper(),
    });

    expect(client.get).not.toHaveBeenCalled();
  });
});
