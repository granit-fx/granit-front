import { describe, expect, it } from 'vitest';

import { buildDashboardsQueryKey } from '../hooks/query-keys';
import { dashboardCatalogQueryKey } from '../hooks/use-dashboard-catalog';
import { dashboardDetailQueryKey } from '../hooks/use-dashboard-detail';
import { dashboardListQueryKey } from '../hooks/use-dashboard-list';
import { dashboardRenderQueryKey, dashboardWidgetQueryKey } from '../hooks/use-dashboard-render';
import { widgetRenderQueryKey } from '../hooks/use-widget-render';

const DASHBOARD_ID = '11111111-1111-1111-1111-111111111111';
const WIDGET_ID = '22222222-2222-2222-2222-222222222222';

describe('buildDashboardsQueryKey — family-standard factory', () => {
  it('returns the raw segments when no prefix is configured', () => {
    expect(buildDashboardsQueryKey({}, 'dashboards', 'detail', DASHBOARD_ID)).toEqual([
      'dashboards',
      'detail',
      DASHBOARD_ID,
    ]);
  });

  it('prepends a configured queryKeyPrefix', () => {
    expect(
      buildDashboardsQueryKey(
        { queryKeyPrefix: ['tenant-a'] },
        'dashboards',
        'detail',
        DASHBOARD_ID
      )
    ).toEqual(['tenant-a', 'dashboards', 'detail', DASHBOARD_ID]);
  });
});

describe('deprecated per-operation aliases — byte-identical to the pre-refactor tuples', () => {
  it('dashboardCatalogQueryKey', () => {
    expect(dashboardCatalogQueryKey()).toEqual(['dashboards', 'catalog']);
    expect(dashboardCatalogQueryKey('Finance')).toEqual(['dashboards', 'catalog', 'Finance']);
  });

  it('dashboardListQueryKey', () => {
    const params = { status: 'Published', page: 1, pageSize: 25 } as const;
    expect(dashboardListQueryKey(params)).toEqual(['dashboards', 'list', params]);
  });

  it('dashboardDetailQueryKey', () => {
    expect(dashboardDetailQueryKey(DASHBOARD_ID)).toEqual(['dashboards', 'detail', DASHBOARD_ID]);
  });

  it('dashboardRenderQueryKey', () => {
    const request = { periodToken: 'mtd' } as const;
    expect(dashboardRenderQueryKey(DASHBOARD_ID, request)).toEqual([
      'dashboard',
      DASHBOARD_ID,
      'render',
      request,
    ]);
  });

  it('dashboardWidgetQueryKey', () => {
    expect(dashboardWidgetQueryKey(DASHBOARD_ID, WIDGET_ID)).toEqual([
      'dashboard',
      DASHBOARD_ID,
      'widget',
      WIDGET_ID,
    ]);
  });

  it('widgetRenderQueryKey', () => {
    const definition = { type: 'chart' } as const;
    const context = { locale: 'en' } as const;
    expect(widgetRenderQueryKey('chart', definition, context)).toEqual([
      'widget',
      'chart',
      'render',
      definition,
      context,
    ]);
  });

  it('each alias equals the builder invoked with the same segments', () => {
    expect(dashboardWidgetQueryKey(DASHBOARD_ID, WIDGET_ID)).toEqual(
      buildDashboardsQueryKey({}, 'dashboard', DASHBOARD_ID, 'widget', WIDGET_ID)
    );
    expect(dashboardDetailQueryKey(DASHBOARD_ID)).toEqual(
      buildDashboardsQueryKey({}, 'dashboards', 'detail', DASHBOARD_ID)
    );
  });
});

describe('SSE push cache-identity invariant', () => {
  // The SSE push (`usePushedDashboard`) writes per-widget snapshots via
  // `setQueryData(dashboardWidgetQueryKey(id, widgetId))`; `useDashboardWidget`
  // reads the same key and `useDashboardRender` populates it. All three MUST
  // resolve to a byte-identical tuple or real-time widget updates silently
  // land on a cache entry nobody reads.
  it('the push write key equals the expected per-widget read tuple', () => {
    // `usePushedDashboard` builds its `setQueryData` key with exactly this call
    // (see use-pushed-dashboard.ts → handleSnapshot). `useDashboardWidget` and
    // `useDashboardRender` populate/read the same tuple. Pin it here so a future
    // refactor of the builder cannot silently shift the push target.
    const writeKey = dashboardWidgetQueryKey(DASHBOARD_ID, WIDGET_ID);
    expect(writeKey).toEqual(['dashboard', DASHBOARD_ID, 'widget', WIDGET_ID]);
  });

  it('the per-widget key is stable across independent invocations', () => {
    const first = dashboardWidgetQueryKey(DASHBOARD_ID, WIDGET_ID);
    const second = dashboardWidgetQueryKey(DASHBOARD_ID, WIDGET_ID);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it('distinct widgets resolve to distinct keys', () => {
    expect(dashboardWidgetQueryKey(DASHBOARD_ID, WIDGET_ID)).not.toEqual(
      dashboardWidgetQueryKey(DASHBOARD_ID, 'other-widget')
    );
  });
});
