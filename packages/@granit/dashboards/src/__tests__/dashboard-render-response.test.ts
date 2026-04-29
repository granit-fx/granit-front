import { describe, expect, it } from 'vitest';

import type {
  DashboardRenderedWidget,
  DashboardRenderRequest,
  DashboardRenderResponse,
} from '../rendering/index.js';

// Pinned wire-format fixtures mirroring B4-render
// (Granit.Dashboards.Endpoints.Dtos.DashboardRenderResponse). Each widget
// slot is a flattened WidgetSnapshotEnvelope plus the persisted widget id.

const KPI_WIDGET: DashboardRenderedWidget = {
  id: '8c6b1e10-0000-0000-0000-000000000001',
  widgetType: 'Kpi',
  status: 'Snapshot',
  sequence: 1,
  emittedAt: '2026-04-29T12:34:56.789Z',
  refreshHint: 'Dynamic',
  snapshot: {
    value: 12,
    valueKind: 'Count',
    currency: null,
    isHigherBetter: false,
    noData: false,
    previous: null,
  },
  unavailableReasonLocalizationKey: null,
};

const MARKDOWN_WIDGET: DashboardRenderedWidget = {
  id: '8c6b1e10-0000-0000-0000-000000000002',
  widgetType: 'Markdown',
  status: 'Snapshot',
  sequence: 1,
  emittedAt: '2026-04-29T12:34:56.789Z',
  refreshHint: 'Static',
  snapshot: { contentLocalizationKey: 'Widget:Test.Banner' },
  unavailableReasonLocalizationKey: null,
};

const UNAVAILABLE_WIDGET: DashboardRenderedWidget = {
  id: '8c6b1e10-0000-0000-0000-000000000003',
  widgetType: 'Chart',
  status: 'Unavailable',
  sequence: 1,
  emittedAt: '2026-04-29T12:34:56.789Z',
  refreshHint: 'Static',
  snapshot: null,
  unavailableReasonLocalizationKey: 'Widget:Unavailable',
};

const BUNDLE_FIXTURE: DashboardRenderResponse = {
  dashboardId: '8c6b1e10-0000-4000-8000-000000000000',
  renderedAt: '2026-04-29T12:34:56.789Z',
  period: {
    from: '2026-04-01T00:00:00Z',
    to: '2026-04-29T00:00:00Z',
    token: 'mtd',
  },
  widgets: [KPI_WIDGET, MARKDOWN_WIDGET, UNAVAILABLE_WIDGET],
};

describe('DashboardRenderResponse — wire format', () => {
  it('carries the dashboardId, renderedAt and echoed period', () => {
    expect(BUNDLE_FIXTURE.dashboardId).toBe('8c6b1e10-0000-4000-8000-000000000000');
    expect(BUNDLE_FIXTURE.period?.token).toBe('mtd');
  });

  it('flattens each widget into id + envelope fields, in position order', () => {
    expect(BUNDLE_FIXTURE.widgets).toHaveLength(3);
    expect(BUNDLE_FIXTURE.widgets[0]?.widgetType).toBe('Kpi');
    expect(BUNDLE_FIXTURE.widgets[1]?.widgetType).toBe('Markdown');
    expect(BUNDLE_FIXTURE.widgets[2]?.widgetType).toBe('Chart');
  });

  it('round-trips the full bundle through JSON without mutation', () => {
    expect(JSON.parse(JSON.stringify(BUNDLE_FIXTURE))).toEqual(BUNDLE_FIXTURE);
  });

  it('null period (request omitted bounds) round-trips cleanly', () => {
    const noPeriod: DashboardRenderResponse = { ...BUNDLE_FIXTURE, period: null };
    expect(JSON.parse(JSON.stringify(noPeriod))).toEqual(noPeriod);
  });
});

describe('DashboardRenderRequest — wire format', () => {
  it('accepts the absolute-bounds + token + locale + filters shape', () => {
    const req: DashboardRenderRequest = {
      periodFrom: '2026-04-01T00:00:00Z',
      periodTo: '2026-04-29T00:00:00Z',
      periodToken: 'mtd',
      locale: 'fr-CA',
      filters: { Status: 'Open' },
    };
    expect(req.periodToken).toBe('mtd');
    expect(req.filters?.Status).toBe('Open');
  });

  it('accepts an empty request (defaults — backend fills locale="en")', () => {
    const req: DashboardRenderRequest = {};
    expect(JSON.parse(JSON.stringify(req))).toEqual({});
  });
});
