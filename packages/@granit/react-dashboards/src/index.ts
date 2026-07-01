// ---------------------------------------------------------------------------
// @granit/react-dashboards — public API
// ---------------------------------------------------------------------------

// Provider
export { DashboardsProvider, useDashboardsConfig } from './providers/dashboards-provider';
export type {
  DashboardsConfig,
  DashboardsProviderProps,
  ResolvedDashboardsConfig,
} from './providers/dashboards-provider';

// Query-key factory (family-standard `build{Module}QueryKey(config, ...segments)`).
// The per-operation `*QueryKey` fns below are `@deprecated` byte-identical aliases.
export { buildDashboardsQueryKey } from './hooks/query-keys';

// Render hook (B4-render — POST /dashboards/{id}/render bundle + per-widget cache split)
export {
  dashboardRenderQueryKey,
  dashboardWidgetQueryKey,
  useDashboardRender,
} from './hooks/use-dashboard-render';
export type { UseDashboardRenderOptions } from './hooks/use-dashboard-render';
export { useDashboardWidget } from './hooks/use-dashboard-widget';
export { resolveWidgetTitle } from './lib/resolve-widget-title';
export { useWidgetRender, widgetRenderQueryKey } from './hooks/use-widget-render';
export type {
  UseWidgetRenderOptions,
  WidgetRenderContext,
  WidgetRenderKind,
} from './hooks/use-widget-render';

// Push transport (P2.4 — ADR-043). SSE-driven live updates that
// surgically merge into the per-widget cache entries; pull-only
// dashboards bypass the stream entirely.
export { useDashboardStream } from './hooks/use-dashboard-stream';
export type {
  DashboardStreamSnapshot,
  UseDashboardStreamOptions,
} from './hooks/use-dashboard-stream';
export { usePushedDashboard } from './hooks/use-pushed-dashboard';

// Lifecycle / CRUD hooks (B4-write — Granit.Dashboards.Endpoints).
// Surface mirrors the persisted-Dashboard aggregate model: the catalog
// lists *available definitions*, the list lists *imported instances*, and
// dashboards are addressed by Guid. Lifecycle is publish/archive/restore
// (no DELETE), metadata edits are name+layout only, widget pool is
// managed via dedicated endpoints.
export { dashboardCatalogQueryKey, useDashboardCatalog } from './hooks/use-dashboard-catalog';
export { dashboardListQueryKey, useDashboardList } from './hooks/use-dashboard-list';
export type { UseDashboardListParams } from './hooks/use-dashboard-list';
export { dashboardDetailQueryKey, useDashboardDetail } from './hooks/use-dashboard-detail';
export { useImportDashboard } from './hooks/use-import-dashboard';
export { useUpdateDashboardMetadata } from './hooks/use-update-dashboard-metadata';
export type { UpdateDashboardMetadataVariables } from './hooks/use-update-dashboard-metadata';
export {
  useArchiveDashboard,
  usePublishDashboard,
  useRestoreDashboard,
} from './hooks/use-dashboard-state-transitions';
export { useResyncDashboard } from './hooks/use-resync-dashboard';
export { useAddWidget, useRemoveWidget, useUpdateWidget } from './hooks/use-widget-crud';
export type {
  AddWidgetVariables,
  RemoveWidgetVariables,
  UpdateWidgetVariables,
} from './hooks/use-widget-crud';

// Layout + dispatcher
export { Dashboard } from './components/dashboard';
export type { DashboardProps } from './components/dashboard';
export {
  DashboardContextProvider,
  useDashboardContext,
  useDashboardTimeWindowState,
} from './components/dashboard-context';
export type {
  DashboardContextProviderProps,
  DashboardContextValue,
} from './components/dashboard-context';
export { DashboardViewProvider, useDashboardView } from './components/dashboard-view-context';
export type {
  DashboardViewContextValue,
  DashboardViewProviderProps,
} from './components/dashboard-view-context';
export { DashboardViewSwitcher } from './components/dashboard-view-switcher';
export type { DashboardViewSwitcherProps } from './components/dashboard-view-switcher';
export { resolveActiveView } from './lib/resolve-active-view';
export type { ActiveDashboardView } from './lib/resolve-active-view';
export {
  DashboardFilterProvider,
  useDashboardFilters,
} from './components/dashboard-filter-context';
export type {
  DashboardFilterContextValue,
  DashboardFilterProviderProps,
  DashboardFilterValues,
} from './components/dashboard-filter-context';
export { DashboardFilterToolbar } from './components/dashboard-filter-toolbar';
export type { DashboardFilterToolbarProps } from './components/dashboard-filter-toolbar';
export { mergeFilterValuesIntoRequest } from './lib/merge-filter-values';

// Entity alias runtime (P2.3) — resolution context, provider, helpers
export { DashboardAliasProvider, useDashboardAliases } from './components/dashboard-alias-context';
export type {
  DashboardAliasProviderProps,
  DashboardAliasValues,
} from './components/dashboard-alias-context';
export {
  resolveDashboardAliases,
  resolveEntityAlias,
  resolveEntityAliasResolver,
} from './lib/resolve-entity-alias';
export type { AliasResolutionContext } from './lib/resolve-entity-alias';
export { substituteAliases, substituteAliasesInRecord } from './lib/substitute-aliases';

// Widget action dispatcher (P1.5) — declarative click handlers
export {
  useStableWidgetActionDispatcher,
  useWidgetActionDispatcher,
  WidgetActionProvider,
} from './components/widget-action-context';
export type {
  WidgetActionDispatcher,
  WidgetActionProviderProps,
} from './components/widget-action-context';
export { defaultWidgetActionHandlers } from './lib/default-widget-action-handlers';
export {
  expandActionParams,
  expandActionPlaceholders,
  expandActionTargetAndParams,
} from './lib/expand-action-params';
export { composeWidgetActionHandlers } from './lib/widget-action-handler';
export type {
  WidgetActionDispatchContext,
  WidgetActionHandler,
  WidgetActionHandlerRegistry,
} from './lib/widget-action-handler';
export { useEffectiveTimeWindow } from './hooks/use-effective-time-window';
export { useWidgetTriggerHandler } from './hooks/use-widget-trigger-handler';
export {
  DASHBOARD_BREAKPOINT_MIN_WIDTH,
  useDashboardBreakpoint,
} from './hooks/use-dashboard-breakpoint';
export { applyLayoutOverride, resolveEffectiveLayout } from './lib/resolve-effective-layout';
export type { EffectiveDashboardLayout } from './lib/resolve-effective-layout';
export { WidgetRenderer } from './components/widget-renderer';
export type { WidgetRendererProps } from './components/widget-renderer';
export { WidgetCard } from './components/widget-card';
export type { WidgetCardProps } from './components/widget-card';

// Built-in widgets (exported for advanced composition / overriding)
export { ImageWidget } from './components/widgets/image-widget';
export { MarkdownWidget } from './components/widgets/markdown-widget';
export { TextWidget } from './components/widgets/text-widget';

// Registry
export { defaultWidgetRegistry } from './registry/default-widget-registry';
export { WidgetRegistryProvider, useWidgetRegistry } from './registry/widget-registry-context';
export type { WidgetRegistryProviderProps } from './registry/widget-registry-context';
export { composeRegistries } from './registry/widget-registry';
// Renamed `WidgetRenderer` (type) → `WidgetRendererFn` to avoid collision with
// the dispatcher component of the same name; consumers register components
// matching this signature.
export type {
  WidgetRegistry,
  WidgetRenderer as WidgetRendererFn,
} from './registry/widget-registry';

// ---------------------------------------------------------------------------
// Read-mode rendering (B5 — bundle-driven, snapshot-aware)
// ---------------------------------------------------------------------------

export { RenderedDashboard } from './components/rendered-dashboard';
export type { RenderedDashboardProps } from './components/rendered-dashboard';
export { RenderedWidget } from './components/rendered-widget';
export type { RenderedWidgetProps } from './components/rendered-widget';

// Built-in snapshot renderers (mirror of the definition-side widgets)
export { ImageSnapshotWidget } from './components/widgets/image-snapshot-widget';
export { MarkdownSnapshotWidget } from './components/widgets/markdown-snapshot-widget';
export { TextSnapshotWidget } from './components/widgets/text-snapshot-widget';

// Snapshot widget registry (PascalCase widgetType discriminator — B5)
export { defaultSnapshotWidgetRegistry } from './registry/default-snapshot-widget-registry';
export {
  SnapshotWidgetRegistryProvider,
  useSnapshotWidgetRegistry,
} from './registry/snapshot-widget-registry-context';
export type { SnapshotWidgetRegistryProviderProps } from './registry/snapshot-widget-registry-context';
export { composeSnapshotRegistries } from './registry/snapshot-widget-registry';
export type {
  SnapshotWidgetRegistry,
  SnapshotWidgetRenderer,
} from './registry/snapshot-widget-registry';
