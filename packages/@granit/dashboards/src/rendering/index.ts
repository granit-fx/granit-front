// ---------------------------------------------------------------------------
// @granit/dashboards/rendering — wire contracts for the dashboard render
// pipeline. Mirrors `Granit.Dashboards.Rendering` + the per-kind snapshots
// shipped by static-content renderers in `Granit.Dashboards.Endpoints.Rendering`
// + the bundle response shape from `POST /dashboards/{id}/render`
// (B3-1 / B3-3 / B4-render, ADR-039).
// ---------------------------------------------------------------------------

export type { DashboardDriftStatus } from './dashboard-drift-status';
export type { DashboardRenderRequest } from './dashboard-render-request';
export type {
  DashboardRenderedWidget,
  DashboardRenderPeriod,
  DashboardRenderResponse,
} from './dashboard-render-response';
export { isImageSnapshotEnvelope } from './image-widget-snapshot';
export type { ImageSnapshotEnvelope, ImageWidgetSnapshot } from './image-widget-snapshot';
export { isMarkdownSnapshotEnvelope } from './markdown-widget-snapshot';
export type { MarkdownSnapshotEnvelope, MarkdownWidgetSnapshot } from './markdown-widget-snapshot';
export { isTextSnapshotEnvelope } from './text-widget-snapshot';
export type { TextSnapshotEnvelope, TextWidgetSnapshot } from './text-widget-snapshot';
export type { WidgetSnapshotEnvelope, WidgetSnapshotEnvelopeOf } from './widget-snapshot-envelope';
export type { WidgetSnapshotStatus } from './widget-snapshot-status';
export type { WidgetTransport } from './widget-transport';
