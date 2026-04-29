import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { dashboardCatalogQueryKey, useDashboardCatalog } from '../api/use-dashboard-catalog.js';
import { dashboardDetailQueryKey, useDashboardDetail } from '../api/use-dashboard-detail.js';
import { useDashboardList } from '../api/use-dashboard-list.js';
import {
  useArchiveDashboard,
  usePublishDashboard,
  useRestoreDashboard,
} from '../api/use-dashboard-state-transitions.js';
import { useImportDashboard } from '../api/use-import-dashboard.js';
import { useUpdateDashboardMetadata } from '../api/use-update-dashboard-metadata.js';
import { useAddWidget, useRemoveWidget, useUpdateWidget } from '../api/use-widget-crud.js';

import type {
  DashboardCatalogEntryResponse,
  DashboardDetailResponse,
  DashboardImportResponse,
  DashboardSummaryResponse,
  PagedResponse,
  WidgetInstanceResponse,
} from '@granit/dashboards';
import type { ReactNode } from 'react';

const ID = '8c6b1e10-0000-4000-8000-000000000001';
const WIDGET_ID = '8c6b1e10-0000-0000-0000-000000000010';
const DEFINITION_NAME = 'Granit.Showcase.InvoicingOverview';

const CATALOG_ENTRY: DashboardCatalogEntryResponse = {
  name: DEFINITION_NAME,
  category: 'Finance',
  isSystem: false,
  version: '1.0.0',
  widgetCount: 4,
  hasViews: false,
  hasAliases: false,
  hasFilters: false,
};

const SUMMARY: DashboardSummaryResponse = {
  id: ID,
  name: 'Invoicing overview',
  category: 'Finance',
  status: 'Draft',
  isSystem: false,
  sourceDefinitionName: DEFINITION_NAME,
  sourceDefinitionVersion: '1.0.0',
  widgetCount: 4,
};

const DETAIL: DashboardDetailResponse = {
  ...SUMMARY,
  layoutColumns: 12,
  layoutRowHeight: 80,
  widgets: [],
};

const IMPORTED: DashboardImportResponse = {
  id: ID,
  name: SUMMARY.name,
  category: 'Finance',
  status: 'Draft',
  sourceDefinitionName: DEFINITION_NAME,
  sourceDefinitionVersion: '1.0.0',
  widgetCount: 4,
};

const WIDGET: WidgetInstanceResponse = {
  id: WIDGET_ID,
  widgetType: 'Markdown',
  position: 0,
  width: 12,
  height: 1,
  titleLocalizationKey: 'Widget:Test.Banner',
  metricName: null,
  queryName: null,
  configJson: '{}',
  requiredPermission: null,
};

let lastQueryParams: URLSearchParams | null = null;
let lastBody: unknown = null;

function freshHandlers() {
  return [
    http.get('http://localhost/dashboards/catalog', () => HttpResponse.json([CATALOG_ENTRY])),
    http.get('http://localhost/dashboards', ({ request }) => {
      lastQueryParams = new URL(request.url).searchParams;
      const response: PagedResponse<DashboardSummaryResponse> = {
        items: [SUMMARY],
        totalCount: 1,
        page: 0,
        pageSize: 50,
      };
      return HttpResponse.json(response);
    }),
    http.get(`http://localhost/dashboards/${encodeURIComponent(ID)}`, () =>
      HttpResponse.json(DETAIL)
    ),
    http.post(
      `http://localhost/dashboards/from-definition/${encodeURIComponent(DEFINITION_NAME)}`,
      () => HttpResponse.json(IMPORTED, { status: 201 })
    ),
    http.put(`http://localhost/dashboards/${encodeURIComponent(ID)}`, async ({ request }) => {
      lastBody = await request.json();
      return HttpResponse.json(SUMMARY);
    }),
    http.post(
      `http://localhost/dashboards/${encodeURIComponent(ID)}/publish`,
      () => new HttpResponse(null, { status: 204 })
    ),
    http.post(
      `http://localhost/dashboards/${encodeURIComponent(ID)}/archive`,
      () => new HttpResponse(null, { status: 204 })
    ),
    http.post(
      `http://localhost/dashboards/${encodeURIComponent(ID)}/restore`,
      () => new HttpResponse(null, { status: 204 })
    ),
    http.post(
      `http://localhost/dashboards/${encodeURIComponent(ID)}/widgets`,
      async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json(WIDGET, { status: 201 });
      }
    ),
    http.put(
      `http://localhost/dashboards/${encodeURIComponent(ID)}/widgets/${encodeURIComponent(WIDGET_ID)}`,
      async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json(WIDGET);
      }
    ),
    http.delete(
      `http://localhost/dashboards/${encodeURIComponent(ID)}/widgets/${encodeURIComponent(WIDGET_ID)}`,
      () => new HttpResponse(null, { status: 204 })
    ),
  ];
}

const server = setupServer(...freshHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(...freshHandlers());
  lastQueryParams = null;
  lastBody = null;
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
  it('catalog key namespaces under [dashboards, catalog] for prefix-based invalidation', () => {
    expect(dashboardCatalogQueryKey()).toEqual(['dashboards', 'catalog']);
  });

  it('detail key carries the dashboard id', () => {
    expect(dashboardDetailQueryKey(ID)).toEqual(['dashboards', 'detail', ID]);
  });
});

describe('useDashboardCatalog', () => {
  it('fetches the catalog of available definitions', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDashboardCatalog(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.name).toBe(DEFINITION_NAME);
  });
});

describe('useDashboardList', () => {
  it('forwards the status / page / pageSize query params to the backend', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useDashboardList({ status: 'Draft', page: 1, pageSize: 25 }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(lastQueryParams?.get('status')).toBe('Draft');
    expect(lastQueryParams?.get('page')).toBe('1');
    expect(lastQueryParams?.get('pageSize')).toBe('25');
  });

  it('returns the paged envelope shape verbatim', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDashboardList(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalCount).toBe(1);
    expect(result.current.data?.items[0]?.id).toBe(ID);
  });
});

describe('useDashboardDetail', () => {
  it('fetches the full payload by Guid', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDashboardDetail(ID), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.layoutColumns).toBe(12);
  });

  it('stays idle when id is empty (avoids a 404)', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDashboardDetail(''), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useImportDashboard', () => {
  it('POSTs to /from-definition/{name} and invalidates the list', async () => {
    const { wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData(['dashboards', 'list', {}], { items: [] });
    const { result } = renderHook(() => useImportDashboard(), { wrapper });
    const imported = await result.current.mutateAsync(DEFINITION_NAME);
    expect(imported.id).toBe(ID);
    expect(queryClient.getQueryState(['dashboards', 'list', {}])?.isInvalidated).toBe(true);
  });
});

describe('useUpdateDashboardMetadata', () => {
  it('PUTs the metadata payload and invalidates the per-id detail', async () => {
    const { wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData(dashboardDetailQueryKey(ID), DETAIL);
    const { result } = renderHook(() => useUpdateDashboardMetadata(), { wrapper });
    await result.current.mutateAsync({
      id: ID,
      request: { name: 'New name', layoutColumns: 12, layoutRowHeight: 100 },
    });
    expect(lastBody).toMatchObject({ name: 'New name', layoutColumns: 12, layoutRowHeight: 100 });
    expect(queryClient.getQueryState(dashboardDetailQueryKey(ID))?.isInvalidated).toBe(true);
  });
});

describe('useArchiveDashboard / useRestoreDashboard / usePublishDashboard', () => {
  it('archive: POSTs to /archive and invalidates list + detail', async () => {
    const { wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData(dashboardDetailQueryKey(ID), DETAIL);
    const { result } = renderHook(() => useArchiveDashboard(), { wrapper });
    await result.current.mutateAsync(ID);
    expect(queryClient.getQueryState(dashboardDetailQueryKey(ID))?.isInvalidated).toBe(true);
  });

  it('publish: POSTs to /publish', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => usePublishDashboard(), { wrapper });
    await expect(result.current.mutateAsync(ID)).resolves.toBeUndefined();
  });

  it('restore: POSTs to /restore', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useRestoreDashboard(), { wrapper });
    await expect(result.current.mutateAsync(ID)).resolves.toBeUndefined();
  });
});

describe('useAddWidget / useUpdateWidget / useRemoveWidget', () => {
  it('add: POSTs the widget payload and invalidates the parent dashboard detail', async () => {
    const { wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData(dashboardDetailQueryKey(ID), DETAIL);
    const { result } = renderHook(() => useAddWidget(), { wrapper });
    await result.current.mutateAsync({
      dashboardId: ID,
      request: {
        widgetType: 'Markdown',
        position: 0,
        width: 12,
        height: 1,
        titleLocalizationKey: 'Widget:Test.Banner',
        configJson: '{}',
      },
    });
    expect(lastBody).toMatchObject({ widgetType: 'Markdown', position: 0 });
    expect(queryClient.getQueryState(dashboardDetailQueryKey(ID))?.isInvalidated).toBe(true);
  });

  it('update: PUTs the editable fields', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useUpdateWidget(), { wrapper });
    await result.current.mutateAsync({
      dashboardId: ID,
      widgetId: WIDGET_ID,
      request: {
        position: 1,
        width: 6,
        height: 1,
        titleLocalizationKey: 'Widget:Test.Banner',
        configJson: '{"content":"updated"}',
      },
    });
    expect(lastBody).toMatchObject({ position: 1, width: 6 });
  });

  it('remove: DELETEs and invalidates the parent dashboard detail', async () => {
    const { wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData(dashboardDetailQueryKey(ID), DETAIL);
    const { result } = renderHook(() => useRemoveWidget(), { wrapper });
    await result.current.mutateAsync({ dashboardId: ID, widgetId: WIDGET_ID });
    expect(queryClient.getQueryState(dashboardDetailQueryKey(ID))?.isInvalidated).toBe(true);
  });
});
