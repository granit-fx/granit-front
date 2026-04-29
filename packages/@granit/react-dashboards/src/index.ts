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

// CRUD hooks (B4-write — list / get / create / update / delete)
export {
  dashboardListQueryKey,
  dashboardQueryKey,
  useCreateDashboard,
  useDashboard,
  useDashboards,
  useDeleteDashboard,
  useUpdateDashboard,
} from './api/use-dashboard-crud.js';

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
export { useEffectiveTimeWindow } from './hooks/use-effective-time-window.js';
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
