import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
// We hand-roll an Axios-shaped client because the real `@granit/api-client`
// factory drags in browser globals (CSRF / session interceptors) the test
// environment doesn't need. The Granit client provider only consumes
// `post / get / put / delete`, so any object exposing them suffices.
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  SAMPLE_FINANCE_BUNDLE,
  SAMPLE_FINANCE_DASHBOARD_ID,
} from '@granit/react-dashboards/testing';

import { dashboardsKeys } from '../hooks/query-keys';
import {
  normalizeDashboardRenderRequest,
  strongestRefreshHint,
  useDashboardRender,
} from '../hooks/use-dashboard-render';
import { useDashboardWidget } from '../hooks/use-dashboard-widget';
import { DashboardsProvider } from '../providers/dashboards-provider';

import type { DashboardRenderedWidget, DashboardRenderRequest } from '@granit/dashboards';
import type { ReactNode } from 'react';

const DASHBOARD_ID = SAMPLE_FINANCE_DASHBOARD_ID;
const BUNDLE = SAMPLE_FINANCE_BUNDLE;

const KPI_WIDGET = BUNDLE.widgets.find((w) => w.widgetType === 'Kpi')!;
const MARKDOWN_WIDGET = BUNDLE.widgets.find((w) => w.widgetType === 'Markdown')!;
const KPI_ID = KPI_WIDGET.id;
const MARKDOWN_ID = MARKDOWN_WIDGET.id;

const server = setupServer(
  http.post(`http://localhost/api/v1/dashboards/${DASHBOARD_ID}/render`, async () =>
    HttpResponse.json(BUNDLE)
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>
        <DashboardsProvider config={{}}>{children}</DashboardsProvider>
      </GranitClientProvider>
    </QueryClientProvider>
  );
  return { wrapper, queryClient };
}

describe('normalizeDashboardRenderRequest', () => {
  it('drops undefined fields so the cache key collapses', () => {
    const a: DashboardRenderRequest = { periodToken: 'mtd' };
    const b: DashboardRenderRequest = { periodToken: 'mtd', locale: undefined };
    expect(JSON.stringify(normalizeDashboardRenderRequest(a))).toBe(
      JSON.stringify(normalizeDashboardRenderRequest(b))
    );
  });

  it('canonicalises filter key order', () => {
    const a: DashboardRenderRequest = { filters: { Status: 'Open', Region: 'EU' } };
    const b: DashboardRenderRequest = { filters: { Region: 'EU', Status: 'Open' } };
    expect(JSON.stringify(normalizeDashboardRenderRequest(a))).toBe(
      JSON.stringify(normalizeDashboardRenderRequest(b))
    );
  });
});

describe('strongestRefreshHint', () => {
  it('returns Static for an empty bundle', () => {
    expect(strongestRefreshHint([])).toBe('Static');
  });

  it('upgrades to Dynamic when any widget is Dynamic', () => {
    expect(
      strongestRefreshHint([
        { ...MARKDOWN_WIDGET, refreshHint: 'Static' },
        { ...KPI_WIDGET, refreshHint: 'Dynamic' },
      ])
    ).toBe('Dynamic');
  });

  it('upgrades to Realtime when any widget is Realtime', () => {
    expect(
      strongestRefreshHint([
        { ...MARKDOWN_WIDGET, refreshHint: 'Dynamic' },
        { ...KPI_WIDGET, refreshHint: 'Realtime' },
      ])
    ).toBe('Realtime');
  });
});

describe('dashboard render query keys', () => {
  it('renders the bundle key with the request payload', () => {
    expect(dashboardsKeys.render(DASHBOARD_ID, { periodToken: 'mtd' })).toEqual([
      'dashboard',
      DASHBOARD_ID,
      'render',
      { periodToken: 'mtd' },
    ]);
  });

  it('renders the per-widget key', () => {
    expect(dashboardsKeys.widget(DASHBOARD_ID, KPI_ID)).toEqual([
      'dashboard',
      DASHBOARD_ID,
      'widget',
      KPI_ID,
    ]);
  });
});

describe('useDashboardRender — bundle fetch + per-widget cache split (ADR-039 §6.2)', () => {
  it('fetches the bundle and exposes it through TanStack Query', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDashboardRender(DASHBOARD_ID), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.widgets).toHaveLength(BUNDLE.widgets.length);
  });

  it('populates one TanStack entry per widget', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(() => useDashboardRender(DASHBOARD_ID), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() =>
      expect(
        queryClient.getQueryData<DashboardRenderedWidget>(
          dashboardsKeys.widget(DASHBOARD_ID, KPI_ID)
        )
      ).toBeDefined()
    );
    expect(
      queryClient.getQueryData<DashboardRenderedWidget>(
        dashboardsKeys.widget(DASHBOARD_ID, MARKDOWN_ID)
      )?.widgetType
    ).toBe('Markdown');
  });
});

describe('useDashboardWidget — passive reader', () => {
  it('surfaces the per-widget cache entry without firing its own fetch', async () => {
    const { wrapper, queryClient } = makeWrapper();
    // Pre-populate as if useDashboardRender had already split the bundle.
    queryClient.setQueryData(dashboardsKeys.widget(DASHBOARD_ID, KPI_ID), KPI_WIDGET);

    const { result } = renderHook(() => useDashboardWidget(DASHBOARD_ID, KPI_ID), {
      wrapper,
    });
    await waitFor(() => expect(result.current.data).toEqual(KPI_WIDGET));
  });

  it('returns undefined for an unknown widget id (no network call)', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDashboardWidget(DASHBOARD_ID, 'unknown'), {
      wrapper,
    });
    // Hook is `enabled: false` — never fires, so isLoading stays false.
    expect(result.current.data).toBeUndefined();
  });
});
