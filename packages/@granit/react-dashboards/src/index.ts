// ---------------------------------------------------------------------------
// @granit/react-dashboards — public API
// ---------------------------------------------------------------------------

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
