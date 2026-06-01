import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

import { formatDeltaRatio, formatMetricValue } from '../lib/format-metric-value';

import type { MetricResponse } from '@granit/analytics';
import type { ComponentType, ReactNode } from 'react';

const NO_VALUE = '—';

const TREND_ICON: Record<
  MetricResponse['snapshot']['previous'] extends infer P
    ? P extends { trend: infer T }
      ? T extends string
        ? T
        : never
      : never
    : never,
  ComponentType<{ readonly className?: string; readonly 'aria-hidden'?: boolean }>
> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

export interface KpiTileViewProps {
  readonly title?: string;
  readonly data: MetricResponse | undefined;
  readonly isLoading: boolean;
  readonly error: unknown;
  readonly onRetry?: () => void;
  /** BCP 47 tag for value/delta formatting. Defaults to runtime default. */
  readonly locale?: string;
  /** Localised text for the no-data hover hint. */
  readonly noDataLabel?: string;
  readonly errorTitle?: string;
  readonly errorRetryLabel?: string;
  readonly className?: string;
  /**
   * Optional slot for a sparkline / mini-chart rendered next to the value —
   * consumers wire this with `@granit/react-charts`'s `<SparklineChart>`.
   * Kept as a slot rather than a built-in dep so packages that ship a KPI
   * without trend visualization don't pull in the chart bundle.
   */
  readonly trendVisual?: ReactNode;
  /**
   * Click handler fired on body interaction. When set, the tile gains
   * cursor / `role="button"` / keyboard activation affordances. Wired
   * by the smart `<KpiTile>` from `widget.actions` (Click trigger);
   * standalone consumers can wire their own.
   */
  readonly onClick?: () => void;
}

/**
 * Pure presentational KPI tile. Decoupled from data fetching so Storybook
 * stories drive it directly with fixtures (no QueryClient required) and
 * the smart wrapper {@link KpiTile} handles loading / error / success
 * transitions.
 *
 * Renders **body only** (value + delta + optional trend visual). Card
 * chrome (border, shadow, padding) and title rendering are owned by the
 * surrounding `<WidgetCard>` — the framework's universal frame the
 * dispatcher (`<WidgetRenderer>` / `<RenderedWidget>`) wraps every widget
 * in. Standalone usages outside a dashboard wrap manually.
 */
export function KpiTileView({
  title,
  data,
  isLoading,
  error,
  onRetry,
  locale,
  noDataLabel = 'No data for this period',
  errorTitle = 'Failed to load metric',
  errorRetryLabel = 'Retry',
  className,
  trendVisual,
  onClick,
}: KpiTileViewProps) {
  const containerClass = joinClasses('flex h-full flex-col gap-3', className);
  const inner = (
    <>
      {title ? (
        <header data-slot="kpi-tile-header">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </header>
      ) : null}
      <div data-slot="kpi-tile-body" className="flex-1 min-h-0">
        {renderBody({
          data,
          isLoading,
          error,
          locale,
          noDataLabel,
          errorTitle,
          errorRetryLabel,
          onRetry,
          trendVisual,
        })}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        data-slot="kpi-tile"
        data-interactive=""
        onClick={onClick}
        className={joinClasses(
          containerClass,
          'cursor-pointer text-left bg-transparent border-0 p-0'
        )}
      >
        {inner}
      </button>
    );
  }
  return (
    <div data-slot="kpi-tile" className={containerClass}>
      {inner}
    </div>
  );
}

interface RenderBodyArgs {
  readonly data: MetricResponse | undefined;
  readonly isLoading: boolean;
  readonly error: unknown;
  readonly locale: string | undefined;
  readonly noDataLabel: string;
  readonly errorTitle: string;
  readonly errorRetryLabel: string;
  readonly onRetry?: () => void;
  readonly trendVisual: ReactNode;
}

function renderBody({
  data,
  isLoading,
  error,
  locale,
  noDataLabel,
  errorTitle,
  errorRetryLabel,
  onRetry,
  trendVisual,
}: RenderBodyArgs): ReactNode {
  if (isLoading && !data) return <Skeleton />;
  if (error) {
    return <ErrorState title={errorTitle} retryLabel={errorRetryLabel} onRetry={onRetry} />;
  }
  if (data) {
    return <Body data={data} locale={locale} noDataLabel={noDataLabel} trendVisual={trendVisual} />;
  }
  return null;
}

function Skeleton() {
  return (
    <div data-slot="kpi-tile-skeleton" className="space-y-2">
      <div className="h-8 w-24 animate-pulse rounded-md bg-accent" />
      <div className="h-4 w-16 animate-pulse rounded-md bg-accent" />
    </div>
  );
}

function ErrorState({
  title,
  retryLabel,
  onRetry,
}: {
  readonly title: string;
  readonly retryLabel: string;
  readonly onRetry?: () => void;
}) {
  return (
    <div
      data-slot="kpi-tile-error"
      className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive"
    >
      <span>{title}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="self-start rounded-md border border-destructive/40 bg-background px-2 py-1 font-medium hover:bg-destructive/10"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

function Body({
  data,
  locale,
  noDataLabel,
  trendVisual,
}: {
  readonly data: MetricResponse;
  readonly locale: string | undefined;
  readonly noDataLabel: string;
  readonly trendVisual: ReactNode;
}) {
  const { snapshot } = data;
  const formattedValue = snapshot.noData
    ? NO_VALUE
    : formatMetricValue({
        value: snapshot.value,
        valueKind: snapshot.valueKind,
        currency: snapshot.currency,
        locale,
      });

  return (
    <div className="flex h-full items-end justify-between gap-3">
      <div className="space-y-1">
        <span
          data-slot="kpi-tile-value"
          title={snapshot.noData ? noDataLabel : undefined}
          className="text-2xl font-semibold tracking-tight"
        >
          {formattedValue}
        </span>
        <Delta previous={snapshot.previous} locale={locale} />
      </div>
      {trendVisual ? (
        <div data-slot="kpi-tile-trend" className="w-24 shrink-0">
          {trendVisual}
        </div>
      ) : null}
    </div>
  );
}

function Delta({
  previous,
  locale,
}: {
  readonly previous: MetricResponse['snapshot']['previous'];
  readonly locale: string | undefined;
}) {
  if (!previous || previous.deltaRatio === null) return null;

  const Icon = TREND_ICON[previous.trend];
  const colourClass = resolveDeltaColourClass(previous.isFavorable);

  return (
    <div
      data-slot="kpi-tile-delta"
      className={joinClasses('flex items-center gap-1 text-xs font-medium', colourClass)}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span>{formatDeltaRatio(previous.deltaRatio, locale)}</span>
    </div>
  );
}

function resolveDeltaColourClass(isFavorable: boolean | null | undefined): string {
  if (isFavorable === true) return 'text-success-600';
  if (isFavorable === false) return 'text-destructive';
  return 'text-muted-foreground';
}

function joinClasses(...parts: ReadonlyArray<string | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
