import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SAMPLE_FINANCE_BUNDLE,
  SAMPLE_FINANCE_DASHBOARD_ID,
} from '@granit/react-dashboards/testing';

import { dashboardRenderQueryKey, dashboardWidgetQueryKey } from '../hooks/use-dashboard-render';
import { applyStreamSnapshot, type DashboardStreamSnapshot } from '../hooks/use-dashboard-stream';
import { usePushedDashboard } from '../hooks/use-pushed-dashboard';
import { DashboardsProvider } from '../providers/dashboards-provider';

import type { DashboardRenderedWidget, DashboardRenderResponse } from '@granit/dashboards';
import type { ReactNode } from 'react';

const DASHBOARD_ID = SAMPLE_FINANCE_DASHBOARD_ID;

const KPI_WIDGET = SAMPLE_FINANCE_BUNDLE.widgets.find(
  (w) => w.widgetType === 'Kpi' && w.transport === 'Push'
)!;
const KPI_ID = KPI_WIDGET.id;

const PUSH_BUNDLE = SAMPLE_FINANCE_BUNDLE;

const PULL_ONLY_BUNDLE: DashboardRenderResponse = {
  ...PUSH_BUNDLE,
  widgets: PUSH_BUNDLE.widgets.map((w) =>
    w.transport === 'Push' ? { ...w, transport: 'Pull' as const } : w
  ),
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
  http.post(`http://localhost/api/v1/dashboards/${DASHBOARD_ID}/render`, async () =>
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
      <GranitClientProvider client={apiClient}>
        <DashboardsProvider config={{}}>{children}</DashboardsProvider>
      </GranitClientProvider>
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
      slug: KPI_WIDGET.slug,
      position: KPI_WIDGET.position,
      width: KPI_WIDGET.width,
      height: KPI_WIDGET.height,
      titleLocalizationKey: KPI_WIDGET.titleLocalizationKey,
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
      `http://localhost/api/v1/dashboards/${DASHBOARD_ID}/stream`
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
