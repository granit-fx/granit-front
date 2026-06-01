import { useCallback, useMemo, useState, type CSSProperties } from 'react';

import { type UseDashboardRenderOptions } from '../hooks/use-dashboard-render';
import { usePushedDashboard } from '../hooks/use-pushed-dashboard';
import { mergeFilterValuesIntoRequest } from '../lib/merge-filter-values';

import { useDashboardFilters } from './dashboard-filter-context';
import { DashboardViewProvider } from './dashboard-view-context';
import { RenderedWidget } from './rendered-widget';

import type { DashboardRenderRequest, DashboardRenderedWidget } from '@granit/dashboards';

/**
 * Read-mode dashboard component. Calls
 * {@link usePushedDashboard}(`dashboardId`) to fetch the seed bundle and
 * subscribe to live updates when the backend's push transport
 * (ADR-043) is wired, then iterates `data.widgets` and dispatches each
 * through {@link RenderedWidget} (which reads the active
 * {@link SnapshotWidgetRegistry}). Pull-only dashboards never open a
 * stream — the hook collapses to a plain pull fetch.
 *
 * The grid layout reconstructs from the structural metadata each
 * widget envelope carries (`width` / `height` / `position` — backend
 * P1). Default `columns: 12` and `rowHeight: 80` match the framework
 * defaults; apps with persisted dashboards override via the
 * `columns` / `rowHeight` props (typically piped from
 * `useDashboardDetail(id)`'s `layoutColumns` / `layoutRowHeight`).
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
   * Number of grid columns. Defaults to `12` (framework convention).
   * Apps with persisted dashboards pipe this from the dashboard's
   * `layoutColumns` so the bundle path layout matches the definition path.
   */
  readonly columns?: number;
  /** Row height in CSS pixels. Defaults to `80` (framework convention). */
  readonly rowHeight?: number;
  /**
   * Active view name (P2.1, controlled). When set, propagates to
   * `request.viewName` so the bundle renderer dispatches against
   * that view. When omitted, the component manages internal state
   * seeded from the response's `activeViewName` after first fetch.
   */
  readonly currentView?: string;
  /**
   * Notification fired when an action handler or view switcher
   * requests a different view. Apps wire this to URL sync /
   * breadcrumb sync.
   */
  readonly onViewChange?: (name: string) => void;
  /**
   * Optional wrapper className applied to the grid root — host apps style
   * the dashboard chrome (header, period selector) outside this component.
   */
  readonly className?: string;
}

const DEFAULT_COLUMNS = 12;
const DEFAULT_ROW_HEIGHT = 80;

export function RenderedDashboard({
  dashboardId,
  request,
  options,
  columns = DEFAULT_COLUMNS,
  rowHeight = DEFAULT_ROW_HEIGHT,
  currentView,
  onViewChange,
  className,
}: RenderedDashboardProps) {
  // Internal view state for uncontrolled usage — uses the response's
  // `activeViewName` once the first fetch lands. Until then, undefined
  // → request omits `viewName` → server resolves the default chain.
  const [internalView, setInternalView] = useState<string | null>(null);
  const activeViewName = currentView ?? internalView;

  const setView = useCallback(
    (name: string) => {
      if (currentView === undefined) setInternalView(name);
      onViewChange?.(name);
    },
    [currentView, onViewChange]
  );

  // Surrounding `<DashboardFilterProvider>` (when mounted) drives live
  // filter values into the bundle render request. Apps wanting fully
  // static rendering omit the provider entirely; the merge becomes a
  // no-op identity.
  const filters = useDashboardFilters();
  const effectiveRequest = useMemo(
    () =>
      mergeFilterValuesIntoRequest(
        activeViewName === null ? (request ?? {}) : { ...request, viewName: activeViewName },
        filters?.values
      ),
    [request, filters?.values, activeViewName]
  );

  // Push-aware fetch: identical to useDashboardRender for pull-only
  // dashboards (no stream opens), then surgically merges live snapshot
  // events into the per-widget cache when the bundle declares
  // `transport: 'Push'` on at least one widget. ADR-043 §6.
  const query = usePushedDashboard(dashboardId, effectiveRequest, options);

  // Once the first response lands, mirror the server's
  // `activeViewName` into our internal state so an uncontrolled view
  // switcher reads it back. The state-during-render pattern keeps
  // the sync without a useEffect cascade.
  if (
    currentView === undefined &&
    query.data?.activeViewName != null &&
    query.data.activeViewName !== internalView
  ) {
    setInternalView(query.data.activeViewName);
  }

  if (query.isLoading) {
    return <LoadingSkeleton className={className} columns={columns} rowHeight={rowHeight} />;
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

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridAutoFlow: 'dense',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gridAutoRows: `${rowHeight}px`,
    gap: '1rem',
  };

  // Bundle widgets arrive in `position` order (backend invariant), so
  // we iterate verbatim. The structural fields (`width`, `height`)
  // drive per-cell `gridColumn` / `gridRow` spans.
  return (
    <DashboardViewProvider
      value={{ currentView: query.data.activeViewName, setCurrentView: setView }}
    >
      <div
        data-slot="rendered-dashboard"
        data-state="ready"
        data-dashboard-id={dashboardId}
        data-active-view-name={query.data.activeViewName ?? undefined}
        className={className}
        style={gridStyle}
      >
        {query.data.widgets.map((widget) => (
          <RenderedDashboardCell key={widget.id} widget={widget} />
        ))}
      </div>
    </DashboardViewProvider>
  );
}

function RenderedDashboardCell({ widget }: { readonly widget: DashboardRenderedWidget }) {
  const cellStyle: CSSProperties = {
    gridColumn: `span ${widget.width}`,
    gridRow: `span ${widget.height}`,
  };
  return (
    <div
      data-slot="rendered-dashboard-cell"
      data-widget-slug={widget.slug}
      data-widget-id={widget.id}
      style={cellStyle}
    >
      <RenderedWidget widget={widget} />
    </div>
  );
}

function LoadingSkeleton({
  className,
  columns,
  rowHeight,
}: {
  readonly className?: string;
  readonly columns: number;
  readonly rowHeight: number;
}) {
  const gridStyle: CSSProperties = {
    display: 'grid',
    gridAutoFlow: 'dense',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gridAutoRows: `${rowHeight}px`,
    gap: '1rem',
  };
  return (
    <div
      data-slot="rendered-dashboard"
      data-state="loading"
      className={className}
      style={gridStyle}
    >
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          style={{ gridColumn: 'span 4', gridRow: 'span 2' }}
          className="animate-pulse rounded-xl border bg-card p-4 shadow-sm"
          aria-hidden
        />
      ))}
    </div>
  );
}

function joinClasses(...parts: ReadonlyArray<string | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
