import type { WidgetSnapshotStatus } from './widget-snapshot-status.js';
import type { RefreshHint } from '../types/refresh-hint.js';

/**
 * Wire shape for `POST /dashboards/{id}/render`. Mirrors
 * `Granit.Dashboards.Endpoints.Dtos.DashboardRenderResponse` (B4-render,
 * ADR-039 §6).
 *
 * The bundle is a **transport optimisation**, not the cache identity. The
 * `useDashboardRender` hook splits the response into per-widget TanStack
 * entries (`['dashboard', dashboardId, 'widget', widgetId]`) before storing
 * it — see ADR-039 §6.2. Frontends that bypass the hook and store the
 * full bundle as a single cache entry will need to refactor when the push
 * transport (P2.4) lands.
 */
export interface DashboardRenderResponse {
  /** Dashboard identifier — matches `Dashboard.Id`. */
  readonly dashboardId: string;
  /** Server-side timestamp at which the bundle was composed (ISO 8601 UTC). */
  readonly renderedAt: string;
  /**
   * Period the renderer ran against. `null` when the request omitted period
   * bounds.
   */
  readonly period: DashboardRenderPeriod | null;
  /** One flat record per widget, in `WidgetInstance.Position` order. */
  readonly widgets: readonly DashboardRenderedWidget[];
}

/**
 * Period echoed back to the client. {@link token} mirrors the request's
 * named-token field unchanged — useful for clients that compose UIs around
 * rotating presets (`'mtd'`, `'qtd'`, …).
 */
export interface DashboardRenderPeriod {
  /** Inclusive lower bound (ISO 8601 UTC). */
  readonly from: string;
  /** Exclusive upper bound (ISO 8601 UTC). */
  readonly to: string;
  /** Optional named token echoed from the request. */
  readonly token: string | null;
}

/**
 * One widget's slot in the dashboard render bundle. Flattens
 * {@link WidgetSnapshotEnvelope} alongside the widget's persisted `id` —
 * the wire shape ADR-039 §6 locks for every framework dashboard endpoint.
 *
 * To narrow a generic `DashboardRenderedWidget` to a kind-specific shape,
 * use the per-kind type guards from `@granit/dashboards`
 * (`isMarkdownSnapshotEnvelope`, `isImageSnapshotEnvelope`, …) or
 * `@granit/analytics` (`isKpiSnapshotEnvelope`).
 */
export interface DashboardRenderedWidget {
  /** Persisted `WidgetInstance.Id`. */
  readonly id: string;
  /**
   * Declarative kind discriminator — mirrors `WidgetDefinition.type`'s
   * `[JsonDerivedType]` tag (`'Kpi'`, `'Markdown'`, …).
   */
  readonly widgetType: string;
  /** Runtime outcome (`'Snapshot'` / `'Unavailable'` / `'Error'`). */
  readonly status: WidgetSnapshotStatus;
  /**
   * Always `1` in pull mode; future push transport increments per
   * (widget, tenant). EPIC #1366 invariant #2.
   */
  readonly sequence: number;
  /** Server-side timestamp of the widget's computation (ISO 8601 UTC). */
  readonly emittedAt: string;
  /** Pull / push transport hint — drives the per-widget cache TTL. */
  readonly refreshHint: RefreshHint;
  /**
   * Pre-serialised typed payload. `null` when {@link status} is not
   * `'Snapshot'`. Frontend renderers narrow this to a kind-specific shape
   * (e.g. `KpiSnapshot`) by inspecting {@link widgetType} via the widget
   * registry.
   */
  readonly snapshot: unknown | null;
  /**
   * Localization key for the user-facing reason. Set on both
   * `'Unavailable'` and `'Error'` envelopes (defaults `'Widget:Unavailable'`
   * / `'Widget:Error'`); `null` on `'Snapshot'`.
   */
  readonly reasonLocalizationKey: string | null;
}
