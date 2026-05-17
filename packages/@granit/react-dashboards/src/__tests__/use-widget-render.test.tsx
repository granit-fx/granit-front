import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useWidgetRender, widgetRenderQueryKey } from '../hooks/use-widget-render.js';
import { DashboardsProvider } from '../providers/dashboards-provider.js';

import type { DashboardRenderedWidget, WidgetDefinitionBase } from '@granit/dashboards';
import type { ReactNode } from 'react';

interface MarkdownStub extends WidgetDefinitionBase {
  readonly type: 'markdown';
  readonly contentLocalizationKey: string;
}

const definition: MarkdownStub = {
  slug: 'Banner',
  type: 'markdown',
  position: 0,
  size: { width: 12, height: 1 },
  contentLocalizationKey: 'Widget:Test.Banner',
};

const ENVELOPE: DashboardRenderedWidget = {
  id: '8c6b1e10-0000-0000-0000-000000000001',
  widgetType: 'Markdown',
  slug: 'Banner',
  position: 0,
  width: 12,
  height: 1,
  titleLocalizationKey: 'Widget:Test.Banner',
  actions: null,
  requiredPermission: null,
  status: 'Snapshot',
  sequence: 1,
  emittedAt: '2026-04-30T12:34:56.789Z',
  refreshHint: 'Static',
  snapshot: { contentLocalizationKey: 'Widget:Test.Banner' },
  reasonLocalizationKey: null,
};

let lastBody: unknown = null;

const server = setupServer(
  http.post('http://localhost/api/v1/widgets/markdown/render', async ({ request }) => {
    lastBody = await request.json();
    return HttpResponse.json(ENVELOPE);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(
    http.post('http://localhost/api/v1/widgets/markdown/render', async ({ request }) => {
      lastBody = await request.json();
      return HttpResponse.json(ENVELOPE);
    })
  );
  lastBody = null;
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

describe('widgetRenderQueryKey', () => {
  it('produces a kind-namespaced cache key keyed by definition + context', () => {
    expect(widgetRenderQueryKey('chart', definition, {})).toEqual([
      'widget',
      'chart',
      'render',
      definition,
      {},
    ]);
  });
});

describe('useWidgetRender', () => {
  it('POSTs the typed definition + context to the kind-specific endpoint', async () => {
    const { wrapper } = makeWrapper();
    // Note the 'markdown' kind is not in the public WidgetRenderKind union but the
    // hook is generic over the kind string — tests use markdown to avoid pulling
    // analytics widget shapes into the dashboards package's tests.
    const { result } = renderHook(
      () =>
        useWidgetRender('markdown' as unknown as 'chart', definition, {
          periodToken: 'mtd',
        }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(lastBody).toMatchObject({
      definition: { slug: 'Banner', type: 'markdown' },
      context: { periodToken: 'mtd' },
    });
  });

  it('returns the DashboardRenderedWidget envelope verbatim', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useWidgetRender('markdown' as unknown as 'chart', definition),
      { wrapper }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe(ENVELOPE.id);
    expect(result.current.data?.titleLocalizationKey).toBe('Widget:Test.Banner');
  });

  it('respects the enabled flag', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useWidgetRender('markdown' as unknown as 'chart', definition, {}, { enabled: false }),
      { wrapper }
    );
    expect(result.current.fetchStatus).toBe('idle');
  });
});
