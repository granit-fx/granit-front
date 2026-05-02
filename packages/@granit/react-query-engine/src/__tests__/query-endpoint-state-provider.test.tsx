import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  QueryEndpointStateProvider,
  QueryProvider,
  useQueryEndpoint,
  useQueryEndpointState,
} from '../index.js';

import type { ReactNode } from 'react';

const BASE_PATH = '/api/v1/parties';

let lastQuery: Record<string, string> | null = null;

const server = setupServer(
  http.get(`http://localhost${BASE_PATH}`, ({ request }) => {
    const url = new URL(request.url);
    lastQuery = Object.fromEntries(url.searchParams.entries());
    return HttpResponse.json({ items: [], totalCount: 0, page: 1, pageSize: 20 });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  lastQuery = null;
});
afterAll(() => server.close());

function makeWrapper(opts: { withProvider?: boolean } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  const wrapper = ({ children }: { children: ReactNode }) => {
    const tree = (
      <QueryProvider config={{ basePath: BASE_PATH }}>
        {opts.withProvider ? (
          <QueryEndpointStateProvider>{children}</QueryEndpointStateProvider>
        ) : (
          children
        )}
      </QueryProvider>
    );
    return (
      <QueryClientProvider client={queryClient}>
        <GranitClientProvider client={apiClient}>{tree}</GranitClientProvider>
      </QueryClientProvider>
    );
  };
  return wrapper;
}

describe('QueryEndpointStateProvider', () => {
  it('useQueryEndpointState returns a no-op default outside any provider', () => {
    const wrapper = makeWrapper({ withProvider: false });
    const { result } = renderHook(() => useQueryEndpointState(), { wrapper });
    expect(result.current.params).toEqual({ page: 1, pageSize: 20 });
    // Dispatchers are noops; calling them must not throw.
    expect(() => result.current.setSearch('hello')).not.toThrow();
  });

  it('shares params + dispatchers across two useQueryEndpoint calls below the provider', async () => {
    const wrapper = makeWrapper({ withProvider: true });
    const { result } = renderHook(
      () => {
        const a = useQueryEndpoint();
        const b = useQueryEndpoint();
        return { a, b };
      },
      { wrapper }
    );
    expect(result.current.a.params).toEqual(result.current.b.params);
    act(() => result.current.a.setSearch('acme'));
    await waitFor(() => expect(result.current.b.params.search).toBe('acme'));
    // Single fetch even with two callers — React Query dedupes by queryKey.
    await waitFor(() => expect(lastQuery?.search).toBe('acme'));
  });

  it('useQueryEndpoint creates an independent reducer when no provider is mounted', () => {
    const wrapper = makeWrapper({ withProvider: false });
    const { result } = renderHook(
      () => {
        const a = useQueryEndpoint();
        const b = useQueryEndpoint();
        return { a, b };
      },
      { wrapper }
    );
    act(() => result.current.a.setSearch('foo'));
    // Separate reducers — `a` gets the change, `b` keeps the default.
    expect(result.current.a.params.search).toBe('foo');
    expect(result.current.b.params.search).toBeUndefined();
  });

  it('seeds the shared reducer from initialParams when supplied', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const apiClient = axios.create({ baseURL: 'http://localhost' });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <GranitClientProvider client={apiClient}>
          <QueryProvider config={{ basePath: BASE_PATH }}>
            <QueryEndpointStateProvider initialParams={{ page: 1, pageSize: 25, search: 'preset' }}>
              {children}
            </QueryEndpointStateProvider>
          </QueryProvider>
        </GranitClientProvider>
      </QueryClientProvider>
    );
    const { result } = renderHook(() => useQueryEndpointState(), { wrapper });
    expect(result.current.params).toEqual({ page: 1, pageSize: 25, search: 'preset' });
  });
});
