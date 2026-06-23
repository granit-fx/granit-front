import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { mockPersonalView, sampleShareRequest } from '@granit/react-entities-views/testing';

import { defaultEntityViewQueryKey } from '../hooks/use-default-entity-view';
import { entityViewQueryKey } from '../hooks/use-entity-view';
import {
  useSetEntityViewPersonalDefault,
  useSetEntityViewPinned,
  useSetEntityViewTenantDefault,
  useShareEntityView,
} from '../hooks/use-entity-view-flags';
import { entityViewsQueryKey } from '../hooks/use-entity-views';

import type { EntityViewResponse } from '@granit/entities-views';
import type { ReactNode } from 'react';

const ENTITY = 'Granit.Parties.Party';
const ENCODED = encodeURIComponent(ENTITY);
const VIEW_ID = mockPersonalView.id;
const VIEW_PATH = `http://localhost/api/v1/entities/${ENCODED}/views/${encodeURIComponent(VIEW_ID)}`;

const VIEW: EntityViewResponse = {
  ...mockPersonalView,
  state: {},
  ownerId: '00000000-0000-0000-0000-000000000010',
  isPersonalDefault: false,
};

const lastBodyByEndpoint = new Map<string, unknown>();

function freshHandlers() {
  return [
    http.post(`${VIEW_PATH}/pin`, async ({ request }) => {
      lastBodyByEndpoint.set('pin', await request.json());
      return HttpResponse.json({ ...VIEW, isPinned: true });
    }),
    http.post(`${VIEW_PATH}/set-default`, async ({ request }) => {
      lastBodyByEndpoint.set('set-default', await request.json());
      return HttpResponse.json({ ...VIEW, isDefault: true });
    }),
    http.post(`${VIEW_PATH}/star`, async ({ request }) => {
      lastBodyByEndpoint.set('star', await request.json());
      return HttpResponse.json({ ...VIEW, isPersonalDefault: true });
    }),
    http.post(`${VIEW_PATH}/share`, async ({ request }) => {
      lastBodyByEndpoint.set('share', await request.json());
      return HttpResponse.json({
        ...VIEW,
        visibility: 'Shared',
        sharedWith: { roles: ['admin'], users: [] },
      });
    }),
  ];
}

const server = setupServer(...freshHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(...freshHandlers());
  lastBodyByEndpoint.clear();
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

describe('useSetEntityViewPinned', () => {
  it('POSTs the pin flag and updates the single-view + list caches', async () => {
    const { wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData(entityViewsQueryKey(ENTITY), [VIEW]);
    const { result } = renderHook(() => useSetEntityViewPinned(ENTITY), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: VIEW_ID, value: true });
    });

    expect(lastBodyByEndpoint.get('pin')).toEqual({ value: true });
    expect(queryClient.getQueryData(entityViewQueryKey(ENTITY, VIEW_ID))).toEqual({
      ...VIEW,
      isPinned: true,
    });
    expect(queryClient.getQueryState(entityViewsQueryKey(ENTITY))?.isInvalidated).toBe(true);
  });
});

describe('useSetEntityViewTenantDefault', () => {
  it('POSTs the tenant-default flag', async () => {
    const { wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData(defaultEntityViewQueryKey(ENTITY), VIEW);
    const { result } = renderHook(() => useSetEntityViewTenantDefault(ENTITY), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: VIEW_ID, value: true });
    });

    expect(lastBodyByEndpoint.get('set-default')).toEqual({ value: true });
    expect(queryClient.getQueryState(defaultEntityViewQueryKey(ENTITY))?.isInvalidated).toBe(true);
  });
});

describe('useSetEntityViewPersonalDefault', () => {
  it('POSTs the personal-default flag', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSetEntityViewPersonalDefault(ENTITY), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: VIEW_ID, value: true });
    });

    expect(lastBodyByEndpoint.get('star')).toEqual({ value: true });
  });

  it('accepts false to clear the flag', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSetEntityViewPersonalDefault(ENTITY), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: VIEW_ID, value: false });
    });

    expect(lastBodyByEndpoint.get('star')).toEqual({ value: false });
  });
});

describe('useShareEntityView', () => {
  it('POSTs the audience and writes the response to the single-view cache', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(() => useShareEntityView(ENTITY), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: VIEW_ID, request: sampleShareRequest });
    });

    expect(lastBodyByEndpoint.get('share')).toEqual({ roles: ['admin'], users: [] });
    expect(queryClient.getQueryData(entityViewQueryKey(ENTITY, VIEW_ID))).toMatchObject({
      visibility: 'Shared',
      sharedWith: { roles: ['admin'], users: [] },
    });
  });
});
