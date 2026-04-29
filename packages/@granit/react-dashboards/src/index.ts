// ---------------------------------------------------------------------------
// @granit/react-dashboards — public API
// ---------------------------------------------------------------------------

// Render hook (B4-render — POST /dashboards/{id}/render bundle + per-widget cache split)
export {
  dashboardRenderQueryKey,
  dashboardWidgetQueryKey,
  normalizeDashboardRenderRequest,
  strongestRefreshHint,
  useDashboardRender,
} from './api/use-dashboard-render.js';
export type { UseDashboardRenderOptions } from './api/use-dashboard-render.js';
export { useDashboardWidget } from './api/use-dashboard-widget.js';

// Lifecycle / CRUD hooks (B4-write — Granit.Dashboards.Endpoints).
// Surface mirrors the persisted-Dashboard aggregate model: the catalog
// lists *available definitions*, the list lists *imported instances*, and
// dashboards are addressed by Guid. Lifecycle is publish/archive/restore
// (no DELETE), metadata edits are name+layout only, widget pool is
// managed via dedicated endpoints.
export { dashboardCatalogQueryKey, useDashboardCatalog } from './api/use-dashboard-catalog.js';
export { dashboardListQueryKey, useDashboardList } from './api/use-dashboard-list.js';
export type { UseDashboardListParams } from './api/use-dashboard-list.js';
export { dashboardDetailQueryKey, useDashboardDetail } from './api/use-dashboard-detail.js';
export { useImportDashboard } from './api/use-import-dashboard.js';
export { useUpdateDashboardMetadata } from './api/use-update-dashboard-metadata.js';
export type { UpdateDashboardMetadataVariables } from './api/use-update-dashboard-metadata.js';
export {
  useArchiveDashboard,
  usePublishDashboard,
  useRestoreDashboard,
} from './api/use-dashboard-state-transitions.js';
export { useAddWidget, useRemoveWidget, useUpdateWidget } from './api/use-widget-crud.js';
export type {
  AddWidgetVariables,
  RemoveWidgetVariables,
  UpdateWidgetVariables,
} from './api/use-widget-crud.js';

// Layout + dispatcher
export { Dashboard } from './components/dashboard.js';
export type { DashboardProps } from './components/dashboard.js';
export {
  DashboardContextProvider,
  useDashboardContext,
  useDashboardTimeWindowState,
} from './components/dashboard-context.js';
export type {
  DashboardContextProviderProps,
  DashboardContextValue,
} from './components/dashboard-context.js';
export { DashboardViewProvider, useDashboardView } from './components/dashboard-view-context.js';
export type {
  DashboardViewContextValue,
  DashboardViewProviderProps,
} from './components/dashboard-view-context.js';
export { DashboardViewSwitcher } from './components/dashboard-view-switcher.js';
export type { DashboardViewSwitcherProps } from './components/dashboard-view-switcher.js';
export { resolveActiveView } from './lib/resolve-active-view.js';
export type { ActiveDashboardView } from './lib/resolve-active-view.js';
export { useEffectiveTimeWindow } from './hooks/use-effective-time-window.js';
export {
  DASHBOARD_BREAKPOINT_MIN_WIDTH,
  resolveBreakpoint,
  useDashboardBreakpoint,
} from './hooks/use-dashboard-breakpoint.js';
export { applyLayoutOverride, resolveEffectiveLayout } from './lib/resolve-effective-layout.js';
export type { EffectiveDashboardLayout } from './lib/resolve-effective-layout.js';
export { WidgetRenderer } from './components/widget-renderer.js';
export type { WidgetRendererProps } from './components/widget-renderer.js';
export { WidgetCard } from './components/widget-card.js';
export type { WidgetCardProps } from './components/widget-card.js';

// Built-in widgets (exported for advanced composition / overriding)
export { ImageWidget } from './components/widgets/image-widget.js';
export { MarkdownWidget } from './components/widgets/markdown-widget.js';
export { TextWidget } from './components/widgets/text-widget.js';

// Registry
export { defaultWidgetRegistry } from './registry/default-widget-registry.js';
export { WidgetRegistryProvider, useWidgetRegistry } from './registry/widget-registry-context.js';
export type { WidgetRegistryProviderProps } from './registry/widget-registry-context.js';
export { composeRegistries } from './registry/widget-registry.js';
// Renamed `WidgetRenderer` (type) → `WidgetRendererFn` to avoid collision with
// the dispatcher component of the same name; consumers register components
// matching this signature.
export type {
  WidgetRegistry,
  WidgetRenderer as WidgetRendererFn,
} from './registry/widget-registry.js';

// ---------------------------------------------------------------------------
// Read-mode rendering (B5 — bundle-driven, snapshot-aware)
// ---------------------------------------------------------------------------

export { RenderedDashboard } from './components/rendered-dashboard.js';
export type { RenderedDashboardProps } from './components/rendered-dashboard.js';
export { RenderedWidget } from './components/rendered-widget.js';
export type { RenderedWidgetProps } from './components/rendered-widget.js';

// Built-in snapshot renderers (mirror of the definition-side widgets)
export { ImageSnapshotWidget } from './components/widgets/image-snapshot-widget.js';
export { MarkdownSnapshotWidget } from './components/widgets/markdown-snapshot-widget.js';
export { TextSnapshotWidget } from './components/widgets/text-snapshot-widget.js';

// Snapshot widget registry (PascalCase widgetType discriminator — B5)
export { defaultSnapshotWidgetRegistry } from './registry/default-snapshot-widget-registry.js';
export {
  SnapshotWidgetRegistryProvider,
  useSnapshotWidgetRegistry,
} from './registry/snapshot-widget-registry-context.js';
export type { SnapshotWidgetRegistryProviderProps } from './registry/snapshot-widget-registry-context.js';
export { composeSnapshotRegistries } from './registry/snapshot-widget-registry.js';
export type {
  SnapshotWidgetRegistry,
  SnapshotWidgetRenderer,
} from './registry/snapshot-widget-registry.js';
