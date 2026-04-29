import {
  RenderedWidget,
  useWidgetRender,
  type WidgetRenderContext,
} from '@granit/react-dashboards';

import type { ChartWidgetDefinition } from '@granit/analytics';

/**
 * Smart chart tile — registered as the renderer for
 * `ChartWidgetDefinition` (`type: 'chart'`) in the analytics widget
 * registry (definition path).
 *
 * Calls `POST /widgets/chart/render` via {@link useWidgetRender}, then
 * dispatches the resulting envelope through `<RenderedWidget>` — same
 * snapshot widget the bundle path uses (`<ChartSnapshotWidget>`).
 * Symmetry-by-construction: zero kind-specific transformation
 * duplicated between the two paths.
 *
 * `framed=false` is forwarded to `<RenderedWidget>` because the
 * surrounding `<WidgetCard>` (mounted by `<WidgetRenderer>` /
 * `<EditableDashboard>`) already provides the chrome — re-wrapping
 * here would double the card.
 */
export interface ChartTileProps {
  readonly widget: ChartWidgetDefinition;
  /**
   * Optional render context (period bounds, locale, filters). Filter
   * values from the surrounding `<DashboardFilterProvider>` merge in
   * automatically.
   */
  readonly context?: WidgetRenderContext;
}

export function ChartTile({ widget, context }: ChartTileProps) {
  const query = useWidgetRender('chart', widget, context);

  if (query.isLoading) {
    return <Skeleton kind="chart" />;
  }
  if (query.isError) {
    return <ErrorSlot kind="chart" />;
  }
  if (!query.data) return null;

  return <RenderedWidget widget={query.data} framed={false} />;
}

function Skeleton({ kind }: { readonly kind: string }) {
  return (
    <div
      data-slot={`${kind}-tile-skeleton`}
      className="flex h-full w-full animate-pulse items-center justify-center rounded-md bg-accent text-xs text-muted-foreground"
      aria-hidden
    />
  );
}

function ErrorSlot({ kind }: { readonly kind: string }) {
  return (
    <div
      data-slot={`${kind}-tile-error`}
      className="flex h-full w-full items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
    >
      Failed to render widget.
    </div>
  );
}
