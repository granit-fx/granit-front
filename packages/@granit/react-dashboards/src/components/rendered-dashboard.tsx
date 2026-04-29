import { useDashboardRender, type UseDashboardRenderOptions } from '../api/use-dashboard-render.js';

import { RenderedWidget } from './rendered-widget.js';

import type { DashboardRenderRequest } from '@granit/dashboards';

/**
 * Read-mode dashboard component. Calls
 * {@link useDashboardRender}(`dashboardId`) to fetch the bundle, then
 * iterates `data.widgets` and dispatches each through {@link RenderedWidget}
 * (which reads the active {@link SnapshotWidgetRegistry}).
 *
 * Until the bundle response carries layout metadata (sizes / positions —
 * pending backend story B4-catalog), the widgets render as a flat
 * responsive grid. Apps that need richer layout can drop down to the lower-
 * level pieces (`useDashboardRender` + `<RenderedWidget>`) and own the grid
 * themselves; this component is the reasonable default.
 *
 * Wrap the parent tree with:
 *
 *     <QueryClientProvider client={...}>
 *       <GranitClientProvider client={...}>
 *         <SnapshotWidgetRegistryProvider registries={[
 *           defaultSnapshotWidgetRegistry,
 *           defaultAnalyticsSnapshotWidgetRegistry,
 *           // ...app registries
 *         ]}>
 *           <RenderedDashboard dashboardId={id} />
 */
export interface RenderedDashboardProps {
  readonly dashboardId: string;
  /** Forwarded to {@link useDashboardRender} — period bounds, locale, filters. */
  readonly request?: DashboardRenderRequest;
  readonly options?: UseDashboardRenderOptions;
  /**
   * Optional wrapper className applied to the grid root — host apps style
   * the dashboard chrome (header, period selector) outside this component.
   */
  readonly className?: string;
}

export function RenderedDashboard({
  dashboardId,
  request,
  options,
  className,
}: RenderedDashboardProps) {
  const query = useDashboardRender(dashboardId, request, options);

  if (query.isLoading) {
    return <LoadingSkeleton className={className} />;
  }
  if (query.isError) {
    return (
      <div
        data-slot="rendered-dashboard"
        data-state="error"
        className={joinClasses(
          'rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive',
          className
        )}
      >
        Failed to load dashboard.
      </div>
    );
  }
  if (!query.data) return null;

  return (
    <div
      data-slot="rendered-dashboard"
      data-state="ready"
      data-dashboard-id={dashboardId}
      className={joinClasses('grid gap-3 md:grid-cols-2 xl:grid-cols-3', className)}
    >
      {query.data.widgets.map((widget) => (
        <RenderedWidget key={widget.id} widget={widget} />
      ))}
    </div>
  );
}

function LoadingSkeleton({ className }: { readonly className?: string }) {
  return (
    <div
      data-slot="rendered-dashboard"
      data-state="loading"
      className={joinClasses('grid gap-3 md:grid-cols-2 xl:grid-cols-3', className)}
    >
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-xl border bg-card p-4 shadow-sm"
          aria-hidden
        />
      ))}
    </div>
  );
}

function joinClasses(...parts: ReadonlyArray<string | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
