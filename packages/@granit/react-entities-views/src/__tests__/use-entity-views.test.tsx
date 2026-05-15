import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { defaultEntityViewQueryKey, useDefaultEntityView } from '../api/use-default-entity-view.js';
import { entityViewQueryKey, useEntityView } from '../api/use-entity-view.js';
import { entityViewsQueryKey, useEntityViews } from '../api/use-entity-views.js';

import type { EntityViewResponse } from '@granit/entities-views';
import type { ReactNode } from 'react';

const ENTITY = 'Granit.Parties.Party';
const ENCODED = encodeURIComponent(ENTITY);

const VIEW_A: EntityViewResponse = {
  id: '8c6b1e10-0000-4000-8000-000000000001',
  entityName: ENTITY,
  basedOn: 'default',
  kind: 'list',
  name: 'My open parties',
  description: null,
  icon: null,
  state: { filters: [] },
  visibility: 'Personal',
  ownerId: '00000000-0000-0000-0000-000000000001',
  sharedWith: null,
  isPinned: false,
  isDefault: false,
  isPersonalDefault: true,
  sortOrder: 0,
};

const VIEW_B: EntityViewResponse = {
  ...VIEW_A,
  id: '8c6b1e10-0000-4000-8000-000000000002',
  name: 'Tenant overdue',
  visibility: 'Tenant',
  ownerId: null,
  isPersonalDefault: false,
  isDefault: true,
  sortOrder: 10,
};

function freshHandlers() {
  return [
    http.get(`http://localhost/api/v1/entities/${ENCODED}/views`, () =>
      HttpResponse.json([VIEW_A, VIEW_B])
    ),
    http.get(
      `http://localhost/api/v1/entities/${ENCODED}/views/${encodeURIComponent(VIEW_A.id)}`,
      () => HttpResponse.json(VIEW_A)
    ),
    http.get(`http://localhost/api/v1/entities/${ENCODED}/views/_default`, () =>
      HttpResponse.json(VIEW_A)
    ),
  ];
}

const server = setupServer(...freshHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers(...freshHandlers()));
afterAll(() => server.close());

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>{children}</GranitClientProvider>
    </QueryClientProvider>
  );
  return { wrapper, queryClient };
}

describe('useEntityViews', () => {
  it('returns the list of accessible views', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(() => useEntityViews(ENTITY), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([VIEW_A, VIEW_B]);
    expect(queryClient.getQueryData(entityViewsQueryKey(ENTITY))).toEqual([VIEW_A, VIEW_B]);
  });

  it('skips the request when entityName is empty', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityViews(''), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useEntityView', () => {
  it('fetches a single view by id', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(() => useEntityView(ENTITY, VIEW_A.id), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(VIEW_A);
    expect(queryClient.getQueryData(entityViewQueryKey(ENTITY, VIEW_A.id))).toEqual(VIEW_A);
  });

  it('reports 404 as an error', async () => {
    server.use(
      http.get(
        `http://localhost/api/v1/entities/${ENCODED}/views/${encodeURIComponent(VIEW_A.id)}`,
        () => HttpResponse.json({ error: 'not found' }, { status: 404 })
      )
    );
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityView(ENTITY, VIEW_A.id), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('skips the request when id is empty', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEntityView(ENTITY, ''), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useDefaultEntityView', () => {
  it('returns the resolved default view', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(() => useDefaultEntityView(ENTITY), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(VIEW_A);
    expect(queryClient.getQueryData(defaultEntityViewQueryKey(ENTITY))).toEqual(VIEW_A);
  });

  it('normalises 204 No Content into null', async () => {
    server.use(
      http.get(`http://localhost/api/v1/entities/${ENCODED}/views/_default`, () =>
        HttpResponse.text('', { status: 204 })
      )
    );
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDefaultEntityView(ENTITY), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
