import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { entityDiscoveryQueryKey, useEntityDiscovery } from '../hooks/use-entity-discovery.js';

import type { EntityDiscoveryResponse } from '@granit/entities';
import type { ReactNode } from 'react';

const DISCOVERY: EntityDiscoveryResponse = {
  schemaVersion: 1,
  modules: [
    {
      module: 'Parties',
      items: [
        {
          name: 'Granit.Parties.Party',
          displayKey: 'Granit.Parties.Party.DisplayName',
          icon: 'users',
          permissionGroup: 'Parties.Parties',
          links: {
            manifest: '/api/entities/Granit.Parties.Party',
            list: '/api/v1/parties',
          },
        },
      ],
    },
  ],
};

let getCalls = 0;

function freshHandlers() {
  return [
    http.get('http://localhost/api/v1/entities', () => {
      getCalls += 1;
      return HttpResponse.json(DISCOVERY);
    }),
  ];
}

const server = setupServer(...freshHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(...freshHandlers());
  getCalls = 0;
});
afterAll(() => server.close());

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>{children}</GranitClientProvider>
    </QueryClientProvider>
  );
  return { wrapper, queryClient };
}

describe('useEntityDiscovery', () => {
  it('returns the discovery tree on success', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityDiscovery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(DISCOVERY);
    expect(getCalls).toBe(1);
  });

  it('honours enabled: false', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityDiscovery({ enabled: false }), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getCalls).toBe(0);
  });

  it('caches under the discovery query key', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(() => useEntityDiscovery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(entityDiscoveryQueryKey())).toEqual(DISCOVERY);
  });

  it('surfaces the error when the endpoint returns 500', async () => {
    server.use(
      http.get('http://localhost/api/v1/entities', () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 })
      )
    );
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityDiscovery(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
