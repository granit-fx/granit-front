import type { MetricSnapshotPayload } from './metric';
import type { WidgetSnapshotEnvelopeOf } from '@granit/dashboards';

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
 * Narrowed `WidgetSnapshotEnvelope` for the `'Kpi'` widget kind. Use the
 * `isKpiSnapshotEnvelope` type guard to refine a heterogeneous dashboard
 * render response to KPI envelopes only.
 */
export type KpiSnapshotEnvelope = WidgetSnapshotEnvelopeOf<'Kpi', KpiSnapshot>;
