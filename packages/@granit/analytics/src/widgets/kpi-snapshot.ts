import type { MetricSnapshotPayload } from '../metrics/metric-response';
import type { WidgetSnapshotEnvelope, WidgetSnapshotEnvelopeOf } from '@granit/dashboards';

/**
 * Snapshot payload returned by the KPI widget renderer. Mirrors the backend
 * `KpiWidgetInstanceRenderer` output (B3-2, ADR-039 §7.bis): the renderer
 * dispatches on the persisted `Datasource.kind` and reuses
 * `MetricSnapshotPayload` as the wire shape regardless of which datasource
 * (metric / query-aggregate / telemetry) produced the value.
 *
 * Effectively a structural alias for {@link MetricSnapshotPayload} — kept
 * named so consumers reading `widget.snapshot` see the KPI semantics rather
 * than the inline-metric envelope.
 */
export type KpiSnapshot = MetricSnapshotPayload;

/**
 * Narrowed {@link WidgetSnapshotEnvelope} for the `'Kpi'` widget kind. Use
 * the {@link isKpiSnapshotEnvelope} type guard to refine a heterogeneous
 * dashboard render response to KPI envelopes only.
 */
export type KpiSnapshotEnvelope = WidgetSnapshotEnvelopeOf<'Kpi', KpiSnapshot>;

/**
 * Type guard refining a generic {@link WidgetSnapshotEnvelope} to the
 * KPI-specific {@link KpiSnapshotEnvelope}. Drives renderer dispatch in the
 * frontend `useDashboard` hook (and in any consumer that walks the bundle
 * response widget by widget).
 */
export function isKpiSnapshotEnvelope(
  envelope: WidgetSnapshotEnvelope
): envelope is KpiSnapshotEnvelope {
  return envelope.widgetType === 'Kpi';
}
