import { describe, expect, it } from 'vitest';

import { buildDashboardsQueryKey, dashboardsKeys } from '../hooks/query-keys';

const DASHBOARD_ID = '11111111-1111-1111-1111-111111111111';
const WIDGET_ID = '22222222-2222-2222-2222-222222222222';

describe('buildDashboardsQueryKey — family-standard builder', () => {
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

describe('dashboardsKeys — canonical per-operation key factory', () => {
  it('catalog', () => {
    expect(dashboardsKeys.catalog()).toEqual(['dashboards', 'catalog']);
    expect(dashboardsKeys.catalog('Finance')).toEqual(['dashboards', 'catalog', 'Finance']);
  });

  it('list', () => {
    const params = { status: 'Published', page: 1, pageSize: 25 } as const;
    expect(dashboardsKeys.list(params)).toEqual(['dashboards', 'list', params]);
  });

  it('detail', () => {
    expect(dashboardsKeys.detail(DASHBOARD_ID)).toEqual(['dashboards', 'detail', DASHBOARD_ID]);
  });

  it('render', () => {
    const request = { periodToken: 'mtd' } as const;
    expect(dashboardsKeys.render(DASHBOARD_ID, request)).toEqual([
      'dashboard',
      DASHBOARD_ID,
      'render',
      request,
    ]);
  });

  it('widget', () => {
    expect(dashboardsKeys.widget(DASHBOARD_ID, WIDGET_ID)).toEqual([
      'dashboard',
      DASHBOARD_ID,
      'widget',
      WIDGET_ID,
    ]);
  });

  it('widgetRender', () => {
    const definition = { type: 'chart' } as const;
    const context = { locale: 'en' } as const;
    expect(dashboardsKeys.widgetRender('chart', definition, context)).toEqual([
      'widget',
      'chart',
      'render',
      definition,
      context,
    ]);
  });
});

describe('SSE push cache-identity invariant', () => {
  // The SSE push (`usePushedDashboard`) writes per-widget snapshots via
  // `setQueryData(dashboardsKeys.widget(id, widgetId))`; `useDashboardWidget`
  // reads the same key and `useDashboardRender` populates it. All three route
  // through the single `dashboardsKeys.widget` factory, so the tuple can never
  // drift onto a cache entry nobody reads.
  it('the push write key equals the expected per-widget read tuple', () => {
    const writeKey = dashboardsKeys.widget(DASHBOARD_ID, WIDGET_ID);
    expect(writeKey).toEqual(['dashboard', DASHBOARD_ID, 'widget', WIDGET_ID]);
  });

  it('the per-widget key is stable across independent invocations', () => {
    const first = dashboardsKeys.widget(DASHBOARD_ID, WIDGET_ID);
    const second = dashboardsKeys.widget(DASHBOARD_ID, WIDGET_ID);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it('distinct widgets resolve to distinct keys', () => {
    expect(dashboardsKeys.widget(DASHBOARD_ID, WIDGET_ID)).not.toEqual(
      dashboardsKeys.widget(DASHBOARD_ID, 'other-widget')
    );
  });
});
