import type { DashboardDriftStatus } from './dashboard-drift-status';
import type { WidgetSnapshotStatus } from './widget-snapshot-status';
import type { WidgetTransport } from './widget-transport';
import type { RefreshHint } from '../types/refresh-hint';
import type { WidgetAction } from '../types/widget-action';

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
  /**
   * Active view name when the dashboard ships multi-view (P2.1) — `null`
   * for single-view dashboards or when the renderer falls back to the
   * top-level pool. Lets the frontend's view switcher reflect which
   * view the bundle was rendered against (request fallback chain:
   * `request.viewName → DashboardDefinition.DefaultView → first view`).
   */
  readonly activeViewName: string | null;
  /**
   * Drift status between the persisted dashboard's
   * `sourceDefinitionVersion` and the currently-registered descriptor's
   * version (ADR-038 §3, semver-aware on the backend). Lets the
   * frontend surface a "Dashboard outdated, click to resync" affordance
   * without an extra round-trip.
   */
  readonly driftStatus: DashboardDriftStatus;
  /**
   * Persisted version captured at import time. `null` when the dashboard
   * was custom-built (no source definition).
   */
  readonly sourceDefinitionVersion: string | null;
  /**
   * Currently-registered descriptor version. `null` when the source
   * definition is no longer registered (`driftStatus` =
   * `'SourceUnregistered'`) or the dashboard has no source
   * (`driftStatus` = `'NotApplicable'`).
   */
  readonly registeredVersion: string | null;
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
  /**
   * Widget-local identifier (PascalCase) extracted from
   * {@link titleLocalizationKey} server-side. Stable across reorder,
   * matches the `WidgetDefinition.slug` invariant on the definition
   * side. Used for the `key` prop + `data-widget-slug` attributes.
   */
  readonly slug: string;
  /** Dense-ranked grid order — 0-based, contiguous. */
  readonly position: number;
  /** Grid columns occupied by the widget. */
  readonly width: number;
  /** Grid rows occupied by the widget. */
  readonly height: number;
  /**
   * Localization key for the widget's title — typically
   * `Widget:{DashboardName}.{Slug}`. Resolved via `useTranslation()`
   * by the frame component (`<WidgetCard>`).
   */
  readonly titleLocalizationKey: string;
  /**
   * Declarative click-handler descriptors copied from the source
   * `WidgetDefinition.actions`. `null` when the widget declares no
   * actions; the framework's dispatcher leaves the renderer
   * non-interactive in that case.
   */
  readonly actions: readonly WidgetAction[] | null;
  /**
   * Optional per-widget permission override echoed from
   * `WidgetInstance.RequiredPermission`. Already enforced server-side;
   * surfaced to the frontend only for defensive UI hides (preserves
   * cache identity stable across permission flips).
   */
  readonly requiredPermission: string | null;
  /** Runtime outcome (`'Snapshot'` / `'Unavailable'` / `'Error'`). */
  readonly status: WidgetSnapshotStatus;
  /**
   * Monotonically-increasing delivery counter per (widget, tenant).
   * Always `1` in pull mode; push transport increments per SSE frame.
   * Serialised as int64 on the wire — JSON may represent large values as
   * strings; always coerce with `Number()` before comparing.
   */
  readonly sequence: number | string;
  /** Server-side timestamp of the widget's computation (ISO 8601 UTC). */
  readonly emittedAt: string;
  /** Pull / push transport hint — drives the per-widget cache TTL. */
  readonly refreshHint: RefreshHint;
  /**
   * Effective transport selected for this widget at render time
   * (ADR-043 §2.3). `'Push'` means the frontend should consume live
   * updates from `GET /dashboards/{id}/stream`; `'Pull'` means polling
   * via the render endpoint per `refreshHint` cadence. Hosts that
   * haven't loaded `Granit.Dashboards.Push` always emit `'Pull'`.
   */
  readonly transport: WidgetTransport;
  /**
   * Pre-serialised typed payload. `null` when {@link status} is not
   * `'Snapshot'`. Frontend renderers narrow this to a kind-specific shape
   * (e.g. `KpiSnapshot`) by inspecting {@link widgetType} via the widget
   * registry.
   */
  readonly snapshot: unknown;
  /**
   * Localization key for the user-facing reason. Set on both
   * `'Unavailable'` and `'Error'` envelopes (defaults `'Widget:Unavailable'`
   * / `'Widget:Error'`); `null` on `'Snapshot'`.
   */
  readonly reasonLocalizationKey: string | null;
}
