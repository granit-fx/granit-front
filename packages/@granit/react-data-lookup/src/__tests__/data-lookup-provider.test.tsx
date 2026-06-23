import { createQueryWrapper } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { render, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { mockCountries } from '@granit/react-data-lookup/testing';

import { LookupBadge } from '../components/lookup-badge';
import { useLookup } from '../hooks/use-lookup';
import { DataLookupProvider, useDataLookupConfig } from '../providers/data-lookup-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { LookupResultResponse } from '@granit/data-lookup';
import type { ReactNode } from 'react';

/** Wraps children in a QueryClient + DataLookupProvider with the given client. */
function createLookupWrapper(client: AxiosInstance) {
  const QueryWrapper = createQueryWrapper();
  return function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <DataLookupProvider config={{ client }}>
        <QueryWrapper>{children}</QueryWrapper>
      </DataLookupProvider>
    );
  };
}

describe('DataLookupProvider', () => {
  it('exposes the resolved config (client + default basePath)', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useDataLookupConfig(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <DataLookupProvider config={{ client }}>{children}</DataLookupProvider>
      ),
    });

    expect(result.current.client).toBe(client);
    expect(result.current.basePath).toBe('/lookups');
  });

  it('honors a custom basePath and culture', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useDataLookupConfig(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <DataLookupProvider config={{ client, basePath: '/custom', culture: 'fr' }}>
          {children}
        </DataLookupProvider>
      ),
    });

    expect(result.current.basePath).toBe('/custom');
    expect(result.current.culture).toBe('fr');
  });

  it('throws when useDataLookupConfig is used outside a provider', () => {
    expect(() => renderHook(() => useDataLookupConfig())).toThrow(/within a <DataLookupProvider>/);
  });

  it('lets useLookup resolve the client from the provider (no client option)', async () => {
    const client = createMockClient();
    const payload: LookupResultResponse = {
      items: [{ value: '1', label: 'Acme', extra: null }],
      totalCount: 1,
      continuationToken: null,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(payload));

    const { result } = renderHook(() => useLookup({ name: 'tenants' }, { search: 'ac' }), {
      wrapper: createLookupWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.items).toEqual(payload.items);
    expect(client.get).toHaveBeenCalled();
  });

  it('lets a component resolve the client from the provider (no client prop)', async () => {
    const client = createMockClient();
    const item = mockCountries[0]!;
    vi.mocked(client.get).mockResolvedValue(axiosResponse(item));

    const { container } = render(
      <LookupBadge descriptor={{ name: 'ref-country' }} value={item.value} />,
      {
        wrapper: createLookupWrapper(client),
      }
    );

    await waitFor(() =>
      expect(container.querySelector('[data-lookup-badge]')?.textContent).toBe('Belgium')
    );
  });
});
