import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { entityManifestQueryKey, useEntityMetadata } from '../api/use-entity-metadata.js';

import type { EntityManifestResponse } from '@granit/entities';
import type { ReactNode } from 'react';

const ENTITY_NAME = 'Granit.Parties.Party';
const ENCODED = encodeURIComponent(ENTITY_NAME);
const ETAG = '"f1d2d2f924e986ac86fdf7b36c94bcdf32beec15"';

const FULL: EntityManifestResponse = {
  schemaVersion: 1,
  identity: {
    name: ENTITY_NAME,
    entityClrType: 'Granit.Parties.Domain.Party',
    displayKey: 'Granit.Parties.Party.DisplayName',
    icon: 'users',
    permissionGroup: 'Parties.Parties',
    displayProperty: 'Number',
    subtitleProperty: 'Kind',
  },
  permissions: {
    canRead: true,
    canCreate: true,
    canUpdate: true,
    canDelete: false,
    canManage: false,
    canExecute: false,
  },
  forms: [],
  details: [],
  collections: null,
  relations: [],
};

let lastRequest: { url: string; ifNoneMatch: string | null } | null = null;
let getCalls = 0;

function freshHandlers() {
  return [
    http.get(`http://localhost/entities/${ENCODED}`, ({ request }) => {
      getCalls += 1;
      const url = new URL(request.url);
      lastRequest = {
        url: `${url.pathname}${url.search}`,
        ifNoneMatch: request.headers.get('if-none-match'),
      };
      if (lastRequest.ifNoneMatch === ETAG) {
        return new HttpResponse(null, { status: 304, headers: { ETag: ETAG } });
      }
      return HttpResponse.json(FULL, { headers: { ETag: ETAG } });
    }),
  ];
}

const server = setupServer(...freshHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(...freshHandlers());
  lastRequest = null;
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

describe('useEntityMetadata', () => {
  it('returns the manifest and URL-encodes the name', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityMetadata(ENTITY_NAME), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(FULL);
    expect(lastRequest?.url).toBe(`/entities/${ENCODED}`);
  });

  it('serialises facets as a sorted CSV under ?facets=', async () => {
    const { wrapper } = makeWrapper();
    renderHook(() => useEntityMetadata(ENTITY_NAME, { facets: ['forms', 'identity'] }), {
      wrapper,
    });
    await waitFor(() => expect(lastRequest?.url.includes('facets=')).toBe(true));
    expect(lastRequest?.url).toBe(`/entities/${ENCODED}?facets=forms,identity`);
  });

  it('shares the cache slot regardless of the facets array order', () => {
    const a = entityManifestQueryKey(ENTITY_NAME, ['forms', 'identity']);
    const b = entityManifestQueryKey(ENTITY_NAME, ['identity', 'forms']);
    expect(a).toEqual(b);
    expect(a).not.toEqual(entityManifestQueryKey(ENTITY_NAME));
  });

  it('honours enabled: false', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityMetadata(ENTITY_NAME, { enabled: false }), {
      wrapper,
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(getCalls).toBe(0);
  });

  it('skips the request when name is empty', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityMetadata(''), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(getCalls).toBe(0);
  });

  it('sends If-None-Match on refetch and keeps cached data on 304', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(() => useEntityMetadata(ENTITY_NAME), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getCalls).toBe(1);

    await queryClient.refetchQueries({ queryKey: entityManifestQueryKey(ENTITY_NAME) });

    expect(lastRequest?.ifNoneMatch).toBe(ETAG);
    expect(getCalls).toBe(2);
    expect(result.current.data).toEqual(FULL);
  });

  it('surfaces the error when the endpoint returns 500', async () => {
    server.use(
      http.get(`http://localhost/entities/${ENCODED}`, () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 })
      )
    );
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityMetadata(ENTITY_NAME), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
