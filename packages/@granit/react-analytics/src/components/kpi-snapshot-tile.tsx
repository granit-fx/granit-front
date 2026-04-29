import { isKpiSnapshotEnvelope } from '@granit/analytics';
import { useTranslation } from 'react-i18next';

import { KpiTileView } from './kpi-tile-view.js';

import type { DashboardRenderedWidget } from '@granit/dashboards';

/**
 * Snapshot-driven renderer for the `'Kpi'` widget kind. Symmetric to the
 * definition-side {@link KpiTile}: both delegate to the pure presentational
 * {@link KpiTileView}, but the snapshot variant skips the `useMetric` fetch
 * — the bundle response carried the snapshot directly.
 *
 * The wrapper synthesises the `MetricResponse` shape `KpiTileView` consumes
 * by combining the envelope-level fields (sequence / emittedAt / refreshHint)
 * with the snapshot payload (= `MetricSnapshotPayload`, B3-2 / B3-8). This
 * keeps the visual identical between the two paths and avoids forking the
 * pure-presentational layer.
 */
export function KpiSnapshotTile({ widget }: { readonly widget: DashboardRenderedWidget }) {
  const { i18n } = useTranslation();

  if (!isKpiSnapshotEnvelope(widget) || !widget.snapshot) return null;

  return (
    <KpiTileView
      data={{
        // The bundle response doesn't carry the metric name (it's a render
        // identity, not a wire field). The KpiTileView only uses `name` for
        // an aria-label fallback — passing the widget id keeps a stable hook.
        name: widget.id,
        snapshot: widget.snapshot,
        sequence: widget.sequence,
        emittedAt: widget.emittedAt,
        refreshHint: widget.refreshHint,
      }}
      isLoading={false}
      error={null}
      locale={i18n.language}
    />
  );
}
