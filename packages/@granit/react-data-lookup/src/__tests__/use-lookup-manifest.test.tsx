import { createQueryWrapper } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useLookupManifest } from '../hooks/use-lookup-manifest';

import type { LookupManifest } from '@granit/data-lookup';

const manifest: LookupManifest = {
  lookups: [
    { name: 'countries', kind: 'ReferenceData', requiredPermission: null, scopeKeys: [] },
    { name: 'tenants', kind: 'QueryEngine', requiredPermission: 'Tenant.Read', scopeKeys: [] },
  ],
};

describe('useLookupManifest', () => {
  it('fetches the manifest and exposes the full source list', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(manifest));

    const { result } = renderHook(() => useLookupManifest({ client }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.lookups).toHaveLength(2);
    expect(result.current.getEntry('tenants')?.requiredPermission).toBe('Tenant.Read');
    expect(result.current.getEntry('missing')).toBeUndefined();
  });

  it('treats every source as accessible when no permission predicate is supplied', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(manifest));

    const { result } = renderHook(() => useLookupManifest({ client }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.accessibleLookups).toHaveLength(2);
    expect(result.current.canUse('tenants')).toBe(true);
  });

  it('hides sources whose requiredPermission the user lacks (permission gating)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(manifest));

    const { result } = renderHook(
      () => useLookupManifest({ client, hasPermission: (p) => p !== 'Tenant.Read' }),
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.accessibleLookups.map((e) => e.name)).toEqual(['countries']);
    expect(result.current.canUse('countries')).toBe(true);
    expect(result.current.canUse('tenants')).toBe(false);
  });
});
