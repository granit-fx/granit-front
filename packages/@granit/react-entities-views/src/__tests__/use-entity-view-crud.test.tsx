import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { defaultEntityViewQueryKey } from '../api/use-default-entity-view.js';
import {
  useCreateEntityView,
  useDeleteEntityView,
  useUpdateEntityView,
} from '../api/use-entity-view-crud.js';
import { entityViewQueryKey } from '../api/use-entity-view.js';
import { entityViewsQueryKey, useEntityViews } from '../api/use-entity-views.js';

import type { EntityViewResponse } from '@granit/entities-views';
import type { ReactNode } from 'react';

const ENTITY = 'Granit.Parties.Party';
const ENCODED = encodeURIComponent(ENTITY);
const VIEW_ID = '8c6b1e10-0000-4000-8000-000000000001';

const VIEW: EntityViewResponse = {
  id: VIEW_ID,
  entityName: ENTITY,
  basedOn: 'default',
  kind: 'list',
  name: 'My open parties',
  description: null,
  icon: null,
  state: { filters: [] },
  visibility: 'Personal',
  ownerId: '00000000-0000-0000-0000-000000000010',
  sharedWith: null,
  isPinned: false,
  isDefault: false,
  isPersonalDefault: false,
  sortOrder: 0,
};

let lastBody: unknown = null;
let listCalls = 0;

function freshHandlers() {
  return [
    http.get(`http://localhost/entities/${ENCODED}/views`, () => {
      listCalls += 1;
      return HttpResponse.json([VIEW]);
    }),
    http.post(`http://localhost/entities/${ENCODED}/views`, async ({ request }) => {
      lastBody = await request.json();
      return HttpResponse.json(VIEW, { status: 201 });
    }),
    http.put(
      `http://localhost/entities/${ENCODED}/views/${encodeURIComponent(VIEW_ID)}`,
      async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ ...VIEW, name: 'Renamed' });
      }
    ),
    http.delete(
      `http://localhost/entities/${ENCODED}/views/${encodeURIComponent(VIEW_ID)}`,
      () => new HttpResponse(null, { status: 204 })
    ),
  ];
}

const server = setupServer(...freshHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(...freshHandlers());
  lastBody = null;
  listCalls = 0;
});
afterAll(() => server.close());

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>{children}</GranitClientProvider>
    </QueryClientProvider>
  );
  return { wrapper, queryClient };
}

describe('useCreateEntityView', () => {
  it('POSTs the body and returns the persisted descriptor', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreateEntityView(ENTITY), { wrapper });
    let returned: EntityViewResponse | undefined;
    await act(async () => {
      returned = await result.current.mutateAsync({
        basedOn: 'default',
        kind: 'list',
        name: 'My open parties',
        description: null,
        icon: null,
        state: { filters: [] },
      });
    });
    expect(returned).toEqual(VIEW);
    expect(lastBody).toMatchObject({ name: 'My open parties', kind: 'list' });
  });

  it('invalidates the list and default-view caches on success', async () => {
    const { wrapper } = makeWrapper();
    const { result: list } = renderHook(() => useEntityViews(ENTITY), { wrapper });
    await waitFor(() => expect(list.current.isSuccess).toBe(true));
    expect(listCalls).toBe(1);

    const { result: create } = renderHook(() => useCreateEntityView(ENTITY), { wrapper });
    await act(async () => {
      await create.current.mutateAsync({
        basedOn: 'default',
        kind: 'list',
        name: 'X',
        description: null,
        icon: null,
        state: {},
      });
    });
    await waitFor(() => expect(listCalls).toBe(2));
  });
});

describe('useUpdateEntityView', () => {
  it('PUTs the body and writes the response into the single-view cache', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(() => useUpdateEntityView(ENTITY), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        id: VIEW_ID,
        request: {
          name: 'Renamed',
          description: null,
          icon: null,
          state: { filters: [] },
        },
      });
    });
    expect(lastBody).toMatchObject({ name: 'Renamed' });
    expect(queryClient.getQueryData(entityViewQueryKey(ENTITY, VIEW_ID))).toEqual({
      ...VIEW,
      name: 'Renamed',
    });
  });

  it('invalidates the list + default-view caches on success', async () => {
    const { wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData(entityViewsQueryKey(ENTITY), [VIEW]);
    queryClient.setQueryData(defaultEntityViewQueryKey(ENTITY), VIEW);

    const { result } = renderHook(() => useUpdateEntityView(ENTITY), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        id: VIEW_ID,
        request: { name: 'X', description: null, icon: null, state: {} },
      });
    });
    expect(queryClient.getQueryState(entityViewsQueryKey(ENTITY))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(defaultEntityViewQueryKey(ENTITY))?.isInvalidated).toBe(true);
  });
});

describe('useDeleteEntityView', () => {
  it('DELETEs and removes the single-view cache entry', async () => {
    const { wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData(entityViewQueryKey(ENTITY, VIEW_ID), VIEW);
    const { result } = renderHook(() => useDeleteEntityView(ENTITY), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(VIEW_ID);
    });
    expect(queryClient.getQueryData(entityViewQueryKey(ENTITY, VIEW_ID))).toBeUndefined();
  });

  it('invalidates the list cache on success', async () => {
    const { wrapper } = makeWrapper();
    const { result: list } = renderHook(() => useEntityViews(ENTITY), { wrapper });
    await waitFor(() => expect(list.current.isSuccess).toBe(true));
    expect(listCalls).toBe(1);

    const { result: del } = renderHook(() => useDeleteEntityView(ENTITY), { wrapper });
    await act(async () => {
      await del.current.mutateAsync(VIEW_ID);
    });
    await waitFor(() => expect(listCalls).toBe(2));
  });
});
