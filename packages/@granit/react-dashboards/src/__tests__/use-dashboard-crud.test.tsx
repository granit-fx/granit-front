import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  dashboardListQueryKey,
  dashboardQueryKey,
  useCreateDashboard,
  useDashboard,
  useDashboards,
  useDeleteDashboard,
  useUpdateDashboard,
} from '../api/use-dashboard-crud.js';

import type { DashboardDefinition } from '@granit/dashboards';
import type { ReactNode } from 'react';

const NAME = 'Granit.Showcase.Demo';

const DEFINITION: DashboardDefinition = {
  name: NAME,
  category: 'General',
  isSystem: false,
  version: '1.0.0',
  layout: { columns: 12, rowHeight: 80 },
  widgets: [
    {
      slug: 'Banner',
      type: 'markdown',
      position: 0,
      size: { width: 12, height: 1 },
      contentLocalizationKey: 'Widget:Granit.Showcase.Demo.Banner',
    },
  ],
};

const UPDATED: DashboardDefinition = { ...DEFINITION, version: '1.1.0' };

let lastPostedBody: unknown = null;
let lastPutBody: unknown = null;
let lastDeleteName: string | null = null;

const server = setupServer(
  http.get('http://localhost/dashboards', () => HttpResponse.json([DEFINITION])),
  http.get(`http://localhost/dashboards/${encodeURIComponent(NAME)}`, () =>
    HttpResponse.json(DEFINITION)
  ),
  http.post('http://localhost/dashboards', async ({ request }) => {
    lastPostedBody = await request.json();
    return HttpResponse.json(DEFINITION);
  }),
  http.put(`http://localhost/dashboards/${encodeURIComponent(NAME)}`, async ({ request }) => {
    lastPutBody = await request.json();
    return HttpResponse.json(UPDATED);
  }),
  http.delete(`http://localhost/dashboards/${encodeURIComponent(NAME)}`, () => {
    lastDeleteName = NAME;
    return new HttpResponse(null, { status: 204 });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(
    http.get('http://localhost/dashboards', () => HttpResponse.json([DEFINITION])),
    http.get(`http://localhost/dashboards/${encodeURIComponent(NAME)}`, () =>
      HttpResponse.json(DEFINITION)
    ),
    http.post('http://localhost/dashboards', async ({ request }) => {
      lastPostedBody = await request.json();
      return HttpResponse.json(DEFINITION);
    }),
    http.put(`http://localhost/dashboards/${encodeURIComponent(NAME)}`, async ({ request }) => {
      lastPutBody = await request.json();
      return HttpResponse.json(UPDATED);
    }),
    http.delete(`http://localhost/dashboards/${encodeURIComponent(NAME)}`, () => {
      lastDeleteName = NAME;
      return new HttpResponse(null, { status: 204 });
    })
  );
  lastPostedBody = null;
  lastPutBody = null;
  lastDeleteName = null;
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

describe('cache keys', () => {
  it('list key is a single-element tuple so all CRUD invalidations target the same root', () => {
    expect(dashboardListQueryKey()).toEqual(['dashboards']);
  });

  it('per-dashboard key namespaces under the list key for prefix-based invalidation', () => {
    expect(dashboardQueryKey(NAME)).toEqual(['dashboards', NAME]);
  });
});

describe('useDashboards', () => {
  it('fetches the catalogue and exposes descriptors', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDashboards(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.name).toBe(NAME);
  });

  it('respects the enabled flag', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDashboards({ enabled: false }), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useDashboard', () => {
  it('fetches a single dashboard by name', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDashboard(NAME), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe(NAME);
    expect(result.current.data?.widgets).toHaveLength(1);
  });

  it('stays idle when name is empty', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDashboard(''), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateDashboard', () => {
  it('POSTs the definition and refreshes the list cache', async () => {
    const { wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData(dashboardListQueryKey(), []);
    const { result } = renderHook(() => useCreateDashboard(), { wrapper });
    await result.current.mutateAsync(DEFINITION);
    expect(lastPostedBody).toMatchObject({ name: NAME });
    expect(queryClient.getQueryState(dashboardListQueryKey())?.isInvalidated).toBe(true);
    // Single-dashboard cache is seeded with the server response.
    expect(queryClient.getQueryData(dashboardQueryKey(NAME))).toMatchObject({ name: NAME });
  });
});

describe('useUpdateDashboard', () => {
  it('PUTs the definition and updates the per-dashboard cache', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(() => useUpdateDashboard(), { wrapper });
    await result.current.mutateAsync(DEFINITION);
    expect(lastPutBody).toMatchObject({ name: NAME });
    expect(queryClient.getQueryData<DashboardDefinition>(dashboardQueryKey(NAME))?.version).toBe(
      '1.1.0'
    );
  });
});

describe('useDeleteDashboard', () => {
  it('DELETEs by name and removes the per-dashboard cache entry', async () => {
    const { wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData(dashboardQueryKey(NAME), DEFINITION);
    const { result } = renderHook(() => useDeleteDashboard(), { wrapper });
    await result.current.mutateAsync(NAME);
    expect(lastDeleteName).toBe(NAME);
    expect(queryClient.getQueryData(dashboardQueryKey(NAME))).toBeUndefined();
  });
});
