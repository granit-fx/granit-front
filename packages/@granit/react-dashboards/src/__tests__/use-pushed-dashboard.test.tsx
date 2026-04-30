import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { dashboardRenderQueryKey, dashboardWidgetQueryKey } from '../api/use-dashboard-render.js';
import { applyStreamSnapshot, type DashboardStreamSnapshot } from '../api/use-dashboard-stream.js';
import { usePushedDashboard } from '../api/use-pushed-dashboard.js';

import type { DashboardRenderedWidget, DashboardRenderResponse } from '@granit/dashboards';
import type { ReactNode } from 'react';

const DASHBOARD_ID = '8c6b1e10-0000-4000-8000-000000000000';
const KPI_ID = '8c6b1e10-0000-0000-0000-000000000001';
const BANNER_ID = '8c6b1e10-0000-0000-0000-000000000002';

const KPI_WIDGET: DashboardRenderedWidget = {
  id: KPI_ID,
  widgetType: 'Kpi',
  slug: 'UnpaidCount',
  position: 0,
  width: 3,
  height: 2,
  titleLocalizationKey: 'Widget:Test.UnpaidCount',
  actions: null,
  requiredPermission: null,
  status: 'Snapshot',
  sequence: 1,
  emittedAt: '2026-04-29T12:34:56.789Z',
  refreshHint: 'Realtime',
  snapshot: { value: 12, valueKind: 'Count' },
  reasonLocalizationKey: null,
  transport: 'Push',
};

const BANNER_WIDGET: DashboardRenderedWidget = {
  id: BANNER_ID,
  widgetType: 'Markdown',
  slug: 'Banner',
  position: 1,
  width: 12,
  height: 1,
  titleLocalizationKey: 'Widget:Test.Banner',
  actions: null,
  requiredPermission: null,
  status: 'Snapshot',
  sequence: 1,
  emittedAt: '2026-04-29T12:34:56.789Z',
  refreshHint: 'Static',
  snapshot: { contentLocalizationKey: 'Widget:Test.Banner.Content' },
  reasonLocalizationKey: null,
  transport: 'Pull',
};

const PUSH_BUNDLE: DashboardRenderResponse = {
  dashboardId: DASHBOARD_ID,
  renderedAt: '2026-04-29T12:34:56.789Z',
  period: null,
  activeViewName: null,
  driftStatus: 'Aligned',
  sourceDefinitionVersion: '1.0.0',
  registeredVersion: '1.0.0',
  widgets: [KPI_WIDGET, BANNER_WIDGET],
};

const PULL_ONLY_BUNDLE: DashboardRenderResponse = {
  ...PUSH_BUNDLE,
  widgets: [BANNER_WIDGET, { ...KPI_WIDGET, transport: 'Pull' }],
};

// ---------------------------------------------------------------------------
// Mock EventSource — JSDOM doesn't ship it. Capture every instance so tests
// can dispatch typed events synchronously.
// ---------------------------------------------------------------------------

interface MockListener {
  readonly type: string;
  readonly handler: (event: Event) => void;
}

class MockEventSource {
  static instances: MockEventSource[] = [];
  readonly url: string;
  readonly listeners: MockListener[] = [];
  closed = false;
  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }
  addEventListener(type: string, handler: (event: Event) => void): void {
    this.listeners.push({ type, handler });
  }
  removeEventListener(type: string, handler: (event: Event) => void): void {
    const idx = this.listeners.findIndex((l) => l.type === type && l.handler === handler);
    if (idx >= 0) this.listeners.splice(idx, 1);
  }
  close(): void {
    this.closed = true;
  }
  dispatch(type: string, data?: unknown): void {
    const event =
      data === undefined
        ? (new Event(type) as Event)
        : (new MessageEvent(type, { data: JSON.stringify(data) }) as Event);
    for (const listener of this.listeners) {
      if (listener.type === type) listener.handler(event);
    }
  }
}

beforeEach(() => {
  MockEventSource.instances = [];
  vi.stubGlobal('EventSource', MockEventSource);
});

// ---------------------------------------------------------------------------
// MSW seed
// ---------------------------------------------------------------------------

let nextBundle: DashboardRenderResponse = PUSH_BUNDLE;
const server = setupServer(
  http.post(`http://localhost/dashboards/${DASHBOARD_ID}/render`, async () =>
    HttpResponse.json(nextBundle)
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllGlobals();
  nextBundle = PUSH_BUNDLE;
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

// ---------------------------------------------------------------------------
// Pure helper
// ---------------------------------------------------------------------------

describe('applyStreamSnapshot', () => {
  const event: DashboardStreamSnapshot = {
    widgetId: KPI_ID,
    widgetType: 'Kpi',
    status: 'Snapshot',
    sequence: 5,
    emittedAt: '2026-05-01T08:00:00.000Z',
    refreshHint: 'Realtime',
    snapshot: { value: 99, valueKind: 'Count' },
    reasonLocalizationKey: null,
  };

  it('returns undefined when there is no seed envelope', () => {
    expect(applyStreamSnapshot(undefined, event)).toBeUndefined();
  });

  it('drops out-of-order events when current.sequence > event.sequence', () => {
    const stale: DashboardStreamSnapshot = { ...event, sequence: 0 };
    expect(applyStreamSnapshot(KPI_WIDGET, stale)).toBe(KPI_WIDGET);
  });

  it('merges dynamic fields and preserves structural fields', () => {
    const merged = applyStreamSnapshot(KPI_WIDGET, event);
    expect(merged).toMatchObject({
      slug: 'UnpaidCount',
      position: 0,
      width: 3,
      height: 2,
      titleLocalizationKey: 'Widget:Test.UnpaidCount',
      transport: 'Push',
      sequence: 5,
      snapshot: { value: 99, valueKind: 'Count' },
      emittedAt: '2026-05-01T08:00:00.000Z',
    });
  });
});

// ---------------------------------------------------------------------------
// usePushedDashboard
// ---------------------------------------------------------------------------

describe('usePushedDashboard', () => {
  it('opens an EventSource only when the bundle carries push widgets', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => usePushedDashboard(DASHBOARD_ID), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));
    expect(MockEventSource.instances[0]?.url).toBe(
      `http://localhost/dashboards/${DASHBOARD_ID}/stream`
    );
  });

  it('does not open a stream when the bundle is pull-only', async () => {
    nextBundle = PULL_ONLY_BUNDLE;
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => usePushedDashboard(DASHBOARD_ID), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(MockEventSource.instances).toHaveLength(0);
  });

  it('merges snapshot events into the per-widget cache', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(() => usePushedDashboard(DASHBOARD_ID), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));

    const source = MockEventSource.instances[0]!;
    act(() => {
      source.dispatch('snapshot', {
        widgetId: KPI_ID,
        widgetType: 'Kpi',
        status: 'Snapshot',
        sequence: 7,
        emittedAt: '2026-05-01T08:00:00.000Z',
        refreshHint: 'Realtime',
        snapshot: { value: 42, valueKind: 'Count' },
        reasonLocalizationKey: null,
      });
    });

    const cached = queryClient.getQueryData<DashboardRenderedWidget>(
      dashboardWidgetQueryKey(DASHBOARD_ID, KPI_ID)
    );
    expect(cached?.sequence).toBe(7);
    expect(cached?.snapshot).toEqual({ value: 42, valueKind: 'Count' });
    // Structural fields survive the merge.
    expect(cached?.slug).toBe('UnpaidCount');
    expect(cached?.transport).toBe('Push');
  });

  it('invalidates the seed render query on resume-failed', async () => {
    const { wrapper, queryClient } = makeWrapper();
    const { result } = renderHook(() => usePushedDashboard(DASHBOARD_ID), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));

    const source = MockEventSource.instances[0]!;
    act(() => {
      source.dispatch('resume-failed');
    });

    expect(
      queryClient.getQueryState(dashboardRenderQueryKey(DASHBOARD_ID, {}))?.isInvalidated
    ).toBe(true);
  });

  it('closes the stream on unmount', async () => {
    const { wrapper } = makeWrapper();
    const { result, unmount } = renderHook(() => usePushedDashboard(DASHBOARD_ID), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));
    const source = MockEventSource.instances[0]!;
    unmount();
    expect(source.closed).toBe(true);
  });
});
