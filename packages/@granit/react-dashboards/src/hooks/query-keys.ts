import type { UseDashboardListParams } from './use-dashboard-list';
import type { WidgetRenderContext, WidgetRenderKind } from './use-widget-render';
import type { DashboardsConfig } from '../providers/dashboards-provider';
import type {
  DashboardCategory,
  DashboardRenderRequest,
  WidgetDefinitionBase,
} from '@granit/dashboards';

/**
 * Single query-key builder for the dashboards package — the family-standard
 * `build{Module}QueryKey(config, ...segments)` shape (mirrors
 * `buildBlobStorageQueryKey` / `buildTaxonomyQueryKey` in sibling packages).
 *
 * When the provider supplies a `queryKeyPrefix` it is prepended; otherwise the
 * `segments` alone form the tuple.
 *
 * @param config - Provider config carrying an optional `queryKeyPrefix`.
 * @param segments - Segments appended after the (optional) prefix.
 */
export function buildDashboardsQueryKey(
  config: Pick<DashboardsConfig, 'queryKeyPrefix'>,
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? []), ...segments];
}

/**
 * Canonical query-key factory for the dashboards package (mirrors
 * `cmsRedirectsKeys` in the CMS-redirects package). Every cache tuple the
 * package addresses is composed here, so the roots stay consistent and the
 * SSE-critical per-widget key is **single-sourced**:
 *
 * `usePushedDashboard` writes push snapshots via `setQueryData(widget(...))`,
 * `useDashboardRender` populates the same tuple on every bundle refetch, and
 * `useDashboardWidget` reads it. Routing all three through `widget()` makes a
 * byte-identity drift structurally impossible — see the `SSE push cache-identity`
 * test.
 */
export const dashboardsKeys = {
  catalog: (category?: DashboardCategory) =>
    category
      ? buildDashboardsQueryKey({}, 'dashboards', 'catalog', category)
      : buildDashboardsQueryKey({}, 'dashboards', 'catalog'),
  list: (params: UseDashboardListParams) =>
    buildDashboardsQueryKey({}, 'dashboards', 'list', params),
  detail: (id: string) => buildDashboardsQueryKey({}, 'dashboards', 'detail', id),
  render: (dashboardId: string, request: DashboardRenderRequest) =>
    buildDashboardsQueryKey({}, 'dashboard', dashboardId, 'render', request),
  widget: (dashboardId: string, widgetId: string) =>
    buildDashboardsQueryKey({}, 'dashboard', dashboardId, 'widget', widgetId),
  widgetRender: <TDefinition extends WidgetDefinitionBase>(
    kind: WidgetRenderKind,
    definition: TDefinition,
    context: WidgetRenderContext
  ) => buildDashboardsQueryKey({}, 'widget', kind, 'render', definition, context),
} as const;
