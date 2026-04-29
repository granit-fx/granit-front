// ---------------------------------------------------------------------------
// @granit/dashboards/rendering — wire contracts for the dashboard render
// pipeline. Mirrors `Granit.Dashboards.Rendering` + the per-kind snapshots
// shipped by static-content renderers in `Granit.Dashboards.Endpoints.Rendering`
// + the bundle response shape from `POST /dashboards/{id}/render`
// (B3-1 / B3-3 / B4-render, ADR-039).
// ---------------------------------------------------------------------------

export type { DashboardRenderRequest } from './dashboard-render-request.js';
export type {
  DashboardRenderedWidget,
  DashboardRenderPeriod,
  DashboardRenderResponse,
} from './dashboard-render-response.js';
export { isImageSnapshotEnvelope } from './image-widget-snapshot.js';
export type { ImageSnapshotEnvelope, ImageWidgetSnapshot } from './image-widget-snapshot.js';
export { isMarkdownSnapshotEnvelope } from './markdown-widget-snapshot.js';
export type {
  MarkdownSnapshotEnvelope,
  MarkdownWidgetSnapshot,
} from './markdown-widget-snapshot.js';
export { isTextSnapshotEnvelope } from './text-widget-snapshot.js';
export type { TextSnapshotEnvelope, TextWidgetSnapshot } from './text-widget-snapshot.js';
export type {
  WidgetSnapshotEnvelope,
  WidgetSnapshotEnvelopeOf,
} from './widget-snapshot-envelope.js';
export type { WidgetSnapshotStatus } from './widget-snapshot-status.js';
