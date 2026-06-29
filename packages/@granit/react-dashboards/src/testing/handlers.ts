// ---------------------------------------------------------------------------
// Dashboards MSW handlers — stand-in for B4-render (POST /:id/render),
// B4-write (lifecycle CRUD), and the catalog endpoint on
// `Granit.Dashboards.Endpoints`.
// ---------------------------------------------------------------------------
//
// Three surfaces:
//
// 1. **Render** (`POST /dashboards/{id}/render`) — synthetic bundle
//    mirroring what the KPI widget renderers (B3-2) + the static-content
//    renderers (B3-3) would emit for the seeded dashboards.
//
// 2. **Lifecycle CRUD** — paged list, detail by Guid, import from
//    catalog, metadata edit, publish/archive/restore, widget pool CRUD.
//    In-memory store keyed by `id` (Guid). Seeded with two dashboards so
//    the list isn't empty on first load.
//
// 3. **Catalog** (`GET /dashboards/catalog`) — available definitions the
//    user can import.
//
// The render path carries a `/render` suffix; CRUD doesn't intersect.

import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import {
  CATALOG,
  createDashboardsStore,
  nextSyntheticKpi,
  SAMPLE_FINANCE_BUNDLE,
  SAMPLE_FINANCE_DASHBOARD_ID,
  SAMPLE_WELCOME_BUNDLE,
  SAMPLE_WELCOME_DASHBOARD_ID,
  SYNTHETIC_ENVELOPES,
  type StoredDashboard,
} from './data';

import type {
  AddWidgetRequest,
  DashboardDetailResponse,
  DashboardImportResponse,
  DashboardMetadataUpdateRequest,
  DashboardRenderResponse,
  DashboardResyncResponse,
  DashboardStatus,
  DashboardSummaryResponse,
  PagedResponse,
  UpdateWidgetRequest,
  WidgetInstanceResponse,
} from '@granit/dashboards';

// View-specific filtering for the bundle path. Demo: the sample finance
// dashboard exposes 3 views — `'overview'` (default: banner + 2 KPIs + chart),
// `'details'` (banner + table + pivot + map), and the implicit fallback (no
// `viewName`) returning every widget. Mirrors the backend's view-dispatch
// fallback chain in spirit: requested view → match → top-level fallback when
// missing.
const VIEW_SLUG_FILTERS: Readonly<Record<string, readonly string[]>> = {
  overview: ['Banner', 'UnpaidCount', 'UnpaidTotal', 'RevenueChart'],
  details: ['Banner', 'RecentInvoices', 'RevenueByRegion', 'BranchMap'],
};

/**
 * Create MSW handlers for the dashboards endpoints. Stateful — mutations
 * (publish, resync, widget CRUD, …) are reflected by subsequent reads. The
 * in-memory store is built per invocation so handler suites don't leak state
 * across tests.
 *
 * @param baseUrl - API base path (default: `/api/v1/dashboards`)
 */
export function createDashboardsHandlers(baseUrl = DEFAULT_BASE_PATH) {
  // Per-widget render endpoints live on the analytics `/widgets` base — derived
  // from the dashboards base so a single `baseUrl` override moves both.
  const widgetsBase = baseUrl.replace(/\/dashboards$/, '/analytics/widgets');

  const store = createDashboardsStore();

  function notFound(id: string) {
    return HttpResponse.json(
      {
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: `Dashboard '${id}' not found.`,
      },
      { status: 404, headers: { 'content-type': 'application/problem+json' } }
    );
  }

  function summarize(dashboard: StoredDashboard): DashboardSummaryResponse {
    return {
      id: dashboard.id,
      name: dashboard.name,
      category: dashboard.category,
      status: dashboard.status,
      isSystem: dashboard.isSystem,
      sourceDefinitionName: dashboard.sourceDefinitionName,
      sourceDefinitionVersion: dashboard.sourceDefinitionVersion,
      widgetCount: dashboard.widgets.length,
    };
  }

  function computeDriftFields(
    id: string
  ): Pick<
    DashboardRenderResponse,
    'driftStatus' | 'sourceDefinitionVersion' | 'registeredVersion'
  > {
    const dashboard = store.get(id);
    if (!dashboard?.sourceDefinitionName) {
      return {
        driftStatus: 'NotApplicable',
        sourceDefinitionVersion: null,
        registeredVersion: null,
      };
    }
    const entry = CATALOG.find((c) => c.name === dashboard.sourceDefinitionName);
    if (!entry) {
      return {
        driftStatus: 'SourceUnregistered',
        sourceDefinitionVersion: dashboard.sourceDefinitionVersion,
        registeredVersion: null,
      };
    }
    const driftStatus =
      dashboard.sourceDefinitionVersion === entry.version
        ? 'Aligned'
        : (dashboard.sourceDefinitionVersion ?? '') < entry.version
          ? 'Behind'
          : 'Ahead';
    return {
      driftStatus,
      sourceDefinitionVersion: dashboard.sourceDefinitionVersion,
      registeredVersion: entry.version,
    };
  }

  function makeGuid(seed: number): string {
    const hex = seed.toString(16).padStart(12, '0');
    return `00000000-0000-4000-8000-${hex}`;
  }

  let nextSeed = 0xa00;
  const newGuid = () => {
    nextSeed += 1;
    return makeGuid(nextSeed);
  };

  function buildSyntheticEnvelope(kind: string, slug: string): Record<string, unknown> | null {
    const fixture = SYNTHETIC_ENVELOPES[kind];
    if (!fixture) return null;
    return {
      id: `00000000-0000-4000-8000-${kind.padStart(12, '0')}`,
      widgetType: fixture.widgetType,
      slug,
      x: 0,
      y: 0,
      width: 6,
      height: 3,
      titleLocalizationKey: `Widget:Granit.Showcase.Preview.${slug}`,
      actions: null,
      requiredPermission: null,
      status: 'Snapshot',
      sequence: 1,
      emittedAt: new Date().toISOString(),
      refreshHint: fixture.refreshHint,
      transport: 'Pull',
      snapshot: fixture.snapshot,
      reasonLocalizationKey: null,
    };
  }

  return [
    // -----------------------------------------------------------------------
    // Render (B4-render — keyed by Guid). Honors `request.viewName` (P2)
    // by filtering the bundle widgets to the matching view's slug list.
    // -----------------------------------------------------------------------
    http.post(`${baseUrl}/:id/render`, async ({ params, request }) => {
      const id = String(params.id);
      const bundle =
        id === SAMPLE_FINANCE_DASHBOARD_ID
          ? SAMPLE_FINANCE_BUNDLE
          : id === SAMPLE_WELCOME_DASHBOARD_ID
            ? SAMPLE_WELCOME_BUNDLE
            : null;
      if (!bundle) return notFound(id);
      const body = (await request.json().catch(() => ({}))) as { viewName?: string };
      const viewName = body.viewName ?? null;
      // Multi-view filtering only applies to the finance dashboard. Welcome
      // is single-view so the viewName is echoed verbatim and all widgets
      // render.
      const slugs =
        viewName && id === SAMPLE_FINANCE_DASHBOARD_ID ? VIEW_SLUG_FILTERS[viewName] : null;
      const widgets = slugs ? bundle.widgets.filter((w) => slugs.includes(w.slug)) : bundle.widgets;
      // Drift fields read live from the store + catalog so a successful
      // resync surfaces immediately on the next render — the static bundle
      // constants carry the seed values only.
      const drift = computeDriftFields(id);
      return HttpResponse.json({
        ...bundle,
        renderedAt: new Date().toISOString(),
        activeViewName: viewName,
        ...drift,
        widgets,
      });
    }),

    // -----------------------------------------------------------------------
    // Push transport (P2.4 / ADR-043) — synthetic SSE publisher.
    // Streams a fresh KPI envelope every 3 s for each push-eligible widget
    // in the bundle, drifting the value within a plausible band so consumers
    // can demo the live update path without a real backend.
    // -----------------------------------------------------------------------
    http.get(`${baseUrl}/:id/stream`, ({ params }) => {
      const id = String(params.id);
      const bundle =
        id === SAMPLE_FINANCE_DASHBOARD_ID
          ? SAMPLE_FINANCE_BUNDLE
          : id === SAMPLE_WELCOME_DASHBOARD_ID
            ? SAMPLE_WELCOME_BUNDLE
            : null;
      if (!bundle) return notFound(id);
      const pushWidgets = bundle.widgets.filter((w) => w.transport === 'Push');
      if (pushWidgets.length === 0) {
        // No live widgets → close immediately. The hook treats EOF as a
        // benign disconnect and EventSource auto-reconnects.
        return new HttpResponse(null, { headers: { 'content-type': 'text/event-stream' } });
      }
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const encoder = new TextEncoder();
          let cursor = 1_000;
          let cancelled = false;
          const tick = () => {
            if (cancelled) return;
            for (const widget of pushWidgets) {
              cursor += 1;
              const next = nextSyntheticKpi(widget);
              const payload = JSON.stringify({
                widgetId: widget.id,
                widgetType: widget.widgetType,
                status: 'Snapshot',
                sequence: cursor,
                emittedAt: new Date().toISOString(),
                refreshHint: widget.refreshHint,
                snapshot: next,
                reasonLocalizationKey: null,
              });
              controller.enqueue(
                encoder.encode(`event: snapshot\nid: ${cursor}\ndata: ${payload}\n\n`)
              );
            }
            // Heartbeat comment in addition to the event so reverse proxies
            // and dev-server pipelines don't kill the stream on idle gaps.
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          };
          // Seed an immediate frame so consumers don't wait 3 s for the first
          // observable update. Subsequent frames follow the cadence.
          tick();
          const interval = setInterval(tick, 3_000);
          // Cleanup hook — MSW invokes `cancel` when the client aborts
          // (EventSource.close on unmount, navigation, dev-server reload).
          (controller as { _cleanup?: () => void })._cleanup = () => {
            cancelled = true;
            clearInterval(interval);
          };
        },
        cancel(reason) {
          const controller = this as unknown as { _cleanup?: () => void };
          controller._cleanup?.();
          // No-op — `reason` echoes the abort signal.
          void reason;
        },
      });
      return new HttpResponse(stream, {
        headers: {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          connection: 'keep-alive',
        },
      });
    }),

    // -----------------------------------------------------------------------
    // Catalog
    // -----------------------------------------------------------------------
    http.get(`${baseUrl}/catalog`, () => HttpResponse.json(CATALOG)),

    // -----------------------------------------------------------------------
    // Persisted-instance list (paged + status filter)
    // -----------------------------------------------------------------------
    http.get(baseUrl, ({ request }) => {
      const url = new URL(request.url);
      const statusParam = url.searchParams.get('status') as DashboardStatus | null;
      const page = Number.parseInt(url.searchParams.get('page') ?? '0', 10);
      const pageSize = Math.min(Number.parseInt(url.searchParams.get('pageSize') ?? '50', 10), 200);

      const all = [...store.values()].sort((a, b) => a.name.localeCompare(b.name));
      const filtered = statusParam ? all.filter((d) => d.status === statusParam) : all;
      const slice = filtered.slice(page * pageSize, page * pageSize + pageSize).map(summarize);

      const response: PagedResponse<DashboardSummaryResponse> = {
        items: slice,
        totalCount: filtered.length,
        page,
        pageSize,
      };
      return HttpResponse.json(response);
    }),

    // -----------------------------------------------------------------------
    // Detail by Guid
    // -----------------------------------------------------------------------
    http.get(`${baseUrl}/:id`, ({ params }) => {
      const id = String(params.id);
      if (id === 'catalog') return; // delegated above
      const dashboard = store.get(id);
      if (!dashboard) return notFound(id);
      const detail: DashboardDetailResponse = { ...dashboard, widgets: [...dashboard.widgets] };
      return HttpResponse.json(detail);
    }),

    // -----------------------------------------------------------------------
    // Import from catalog
    // -----------------------------------------------------------------------
    http.post(`${baseUrl}/from-definition/:name`, ({ params }) => {
      const name = String(params.name);
      const entry = CATALOG.find((c) => c.name === name);
      if (!entry) return notFound(name);
      const id = newGuid();
      const stored: StoredDashboard = {
        id,
        name: entry.name,
        category: entry.category,
        status: 'Draft',
        isSystem: entry.isSystem,
        sourceDefinitionName: entry.name,
        sourceDefinitionVersion: entry.version,
        layoutColumns: 12,
        layoutRowHeight: 80,
        widgets: [],
      };
      store.set(id, stored);
      const response: DashboardImportResponse = {
        id,
        name: entry.name,
        category: entry.category,
        status: 'Draft',
        sourceDefinitionName: entry.name,
        sourceDefinitionVersion: entry.version,
        widgetCount: stored.widgets.length,
      };
      return HttpResponse.json(response, { status: 201 });
    }),

    // -----------------------------------------------------------------------
    // Metadata edit
    // -----------------------------------------------------------------------
    http.put(`${baseUrl}/:id`, async ({ params, request }) => {
      const id = String(params.id);
      const dashboard = store.get(id);
      if (!dashboard) return notFound(id);
      const body = (await request.json()) as DashboardMetadataUpdateRequest;
      dashboard.name = body.name;
      dashboard.layoutColumns = body.layoutColumns;
      dashboard.layoutRowHeight = body.layoutRowHeight;
      return HttpResponse.json(summarize(dashboard));
    }),

    // -----------------------------------------------------------------------
    // State transitions
    // -----------------------------------------------------------------------
    http.post(`${baseUrl}/:id/publish`, ({ params }) => {
      const dashboard = store.get(String(params.id));
      if (!dashboard) return notFound(String(params.id));
      dashboard.status = 'Published';
      return HttpResponse.json(summarize(dashboard));
    }),
    http.post(`${baseUrl}/:id/archive`, ({ params }) => {
      const dashboard = store.get(String(params.id));
      if (!dashboard) return notFound(String(params.id));
      dashboard.status = 'Archived';
      return HttpResponse.json(summarize(dashboard));
    }),
    http.post(`${baseUrl}/:id/restore`, ({ params }) => {
      const dashboard = store.get(String(params.id));
      if (!dashboard) return notFound(String(params.id));
      dashboard.status = 'Draft';
      return HttpResponse.json(summarize(dashboard));
    }),
    http.post(`${baseUrl}/:id/resync`, ({ params }) => {
      const dashboard = store.get(String(params.id));
      if (!dashboard) return notFound(String(params.id));
      if (!dashboard.sourceDefinitionName) {
        return HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Conflict',
            status: 409,
            detail: 'Dashboard has no source definition; resync not applicable.',
          },
          { status: 409, headers: { 'content-type': 'application/problem+json' } }
        );
      }
      const entry = CATALOG.find((c) => c.name === dashboard.sourceDefinitionName);
      if (!entry) {
        return HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Conflict',
            status: 409,
            detail: `Source definition '${dashboard.sourceDefinitionName}' is no longer registered.`,
          },
          { status: 409, headers: { 'content-type': 'application/problem+json' } }
        );
      }
      const previousVersion = dashboard.sourceDefinitionVersion;
      dashboard.sourceDefinitionVersion = entry.version;
      // Demo summary — real backend computes added/removed by diffing the
      // descriptor's widgets against the persisted pool. The seeded dashboard
      // is otherwise complete so the synthetic counts here are illustrative.
      const summary: DashboardResyncResponse = {
        id: dashboard.id,
        name: dashboard.name,
        status: dashboard.status,
        sourceDefinitionName: dashboard.sourceDefinitionName,
        previousSourceDefinitionVersion: previousVersion,
        sourceDefinitionVersion: entry.version,
        widgetsAdded: 1,
        widgetsRemoved: 0,
        overridesCarriedOver: dashboard.widgets.length,
      };
      return HttpResponse.json(summary);
    }),

    // -----------------------------------------------------------------------
    // Widget pool CRUD
    // -----------------------------------------------------------------------
    http.post(`${baseUrl}/:id/widgets`, async ({ params, request }) => {
      const dashboard = store.get(String(params.id));
      if (!dashboard) return notFound(String(params.id));
      const body = (await request.json()) as AddWidgetRequest;
      const widget: WidgetInstanceResponse = {
        id: newGuid(),
        widgetType: body.widgetType,
        x: body.x,
        y: body.y,
        width: body.width,
        height: body.height,
        titleLocalizationKey: body.titleLocalizationKey,
        metricName: body.metricName ?? null,
        queryName: body.queryName ?? null,
        configJson: body.configJson,
        requiredPermission: body.requiredPermission ?? null,
      };
      dashboard.widgets.push(widget);
      return HttpResponse.json(widget, { status: 201 });
    }),
    http.put(`${baseUrl}/:id/widgets/:widgetId`, async ({ params, request }) => {
      const dashboard = store.get(String(params.id));
      if (!dashboard) return notFound(String(params.id));
      const widget = dashboard.widgets.find((w) => w.id === String(params.widgetId));
      if (!widget) return notFound(String(params.widgetId));
      const body = (await request.json()) as UpdateWidgetRequest;
      widget.x = body.x;
      widget.y = body.y;
      widget.width = body.width;
      widget.height = body.height;
      widget.titleLocalizationKey = body.titleLocalizationKey;
      widget.configJson = body.configJson;
      return HttpResponse.json(widget);
    }),
    http.delete(`${baseUrl}/:id/widgets/:widgetId`, ({ params }) => {
      const dashboard = store.get(String(params.id));
      if (!dashboard) return notFound(String(params.id));
      const idx = dashboard.widgets.findIndex((w) => w.id === String(params.widgetId));
      if (idx === -1) return notFound(String(params.widgetId));
      dashboard.widgets.splice(idx, 1);
      return new HttpResponse(null, { status: 204 });
    }),

    // -----------------------------------------------------------------------
    // P3 — per-widget render endpoints (POST /analytics/widgets/{kind}/render). Symmetric
    // with the bundle path: same envelope shape, same snapshot widgets dispatched
    // by `<RenderedWidget>`. The mock synthesizes a canned snapshot per kind —
    // good enough for a live preview.
    // -----------------------------------------------------------------------
    ...['kpi', 'chart', 'table', 'pivot', 'map'].map((kind) =>
      http.post(`${widgetsBase}/${kind}/render`, async ({ request }) => {
        const body = (await request.json()) as { definition: { slug?: string; type?: string } };
        const slug = body.definition?.slug ?? `${kind}-1`;
        const envelope = buildSyntheticEnvelope(kind, slug);
        if (!envelope) return notFound(kind);
        return HttpResponse.json(envelope);
      })
    ),
  ];
}
