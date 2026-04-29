/**
 * Runtime outcome of a single widget render — the "what happened" axis of
 * the per-widget envelope. Decoupled from `WidgetSnapshotEnvelope.widgetType`
 * (the declarative kind) so a frontend `useDashboard` hook can branch on
 * "render the snapshot" vs "render an unavailable / error placeholder"
 * without inspecting the snapshot payload itself.
 *
 * Mirrors `Granit.Dashboards.Rendering.WidgetSnapshotStatus`. PascalCase
 * wire values — backend's host registers a `JsonStringEnumConverter()`
 * with no naming policy.
 *
 * See ADR-039 §2 for why the original draft's single `kind` field was split
 * into `status` (this) + `widgetType` on the envelope.
 */
export type WidgetSnapshotStatus =
  /** The renderer produced a typed snapshot — `WidgetSnapshotEnvelope.snapshot` is non-null. */
  | 'Snapshot'
  /** The current user lacks the widget's required permission. The dashboard render endpoint short-circuits before invoking the underlying metric / query. */
  | 'Unavailable'
  /** The renderer threw an unexpected exception. Logged server-side; the bundle response stays 200 so a single bad widget does not break the whole dashboard. */
  | 'Error';
