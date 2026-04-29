import type { WidgetSnapshotStatus } from './widget-snapshot-status.js';
import type { RefreshHint } from '../types/refresh-hint.js';

/**
 * Non-generic envelope returned by every widget renderer (one per
 * `WidgetInstance`). Bundles the runtime {@link status}, the declarative
 * {@link widgetType}, and a pre-serialised {@link snapshot} so the dashboard
 * render endpoint can compose heterogeneous widgets into one response without
 * leaking per-kind generics.
 *
 * Mirrors `Granit.Dashboards.Rendering.WidgetSnapshotEnvelope`. See
 * ADR-039 §2 for the design rationale and §2.1 for why the snapshot is
 * pre-serialised JSON (not a typed `object?`) at the boundary.
 *
 * On the wire, {@link snapshot} is the concrete typed payload for the
 * widget's kind — `KpiSnapshot` for `Kpi`, `ChartSnapshot` for `Chart`, etc.
 * Frontend consumers cast to the kind-specific type after dispatching on
 * {@link widgetType} via the widget registry; until B3-2/3/4/5/6 land per-kind
 * snapshots, the type stays `unknown`.
 */
export interface WidgetSnapshotEnvelope {
  /** Runtime outcome (snapshot / unavailable / error). */
  readonly status: WidgetSnapshotStatus;
  /**
   * Declarative kind discriminator — mirrors `WidgetDefinition.type`'s
   * `[JsonDerivedType]` tag (`'Kpi'`, `'Chart'`, `'Markdown'`, ...).
   * Carried even on `Unavailable` / `Error` so the frontend keeps a typed
   * slot for the absent widget.
   */
  readonly widgetType: string;
  /**
   * Pre-serialised typed payload. `null` when {@link status} is not
   * `'Snapshot'`. Frontend renderers narrow this to a kind-specific shape
   * (e.g. `KpiSnapshot`) by inspecting {@link widgetType} via the widget
   * registry.
   */
  readonly snapshot: unknown | null;
  /**
   * Always `1` in pull mode; future push transport increments per
   * (widget instance, tenant). Locked v1 per EPIC #1366 invariant #2.
   */
  readonly sequence: number;
  /** Server-side timestamp of the computation (ISO 8601 UTC). */
  readonly emittedAt: string;
  /** Pull / push transport hint inherited from the underlying definition. */
  readonly refreshHint: RefreshHint;
  /**
   * Localization key for the user-facing reason. Set on both
   * `'Unavailable'` envelopes (e.g. `'Widget:Unavailable.MetricNotFound'`,
   * default `'Widget:Unavailable'`) and `'Error'` envelopes
   * (e.g. `'Widget:Error.UnknownWidgetType'`, default `'Widget:Error'`);
   * `null` on `'Snapshot'`. The dashboard render endpoint never resolves
   * the key server-side — the frontend is the only translation point so
   * the same envelope can be cached across user locales.
   */
  readonly reasonLocalizationKey: string | null;
}

/**
 * Narrowed flavour of {@link WidgetSnapshotEnvelope} for a specific widget
 * kind. Per-kind packages (e.g. `@granit/analytics`) compose their own typed
 * envelope by binding `TKind` to the discriminator value (`'Kpi'`, `'Chart'`,
 * …) and `TSnapshot` to the kind's payload shape:
 *
 *     export type KpiSnapshotEnvelope =
 *       WidgetSnapshotEnvelopeOf<'Kpi', MetricSnapshotPayload>;
 *
 * Pair with a runtime type guard (`widgetType === 'Kpi'`) to narrow a
 * generic envelope obtained from the dashboard render endpoint to the
 * kind-specific shape.
 */
export type WidgetSnapshotEnvelopeOf<TKind extends string, TSnapshot> = Omit<
  WidgetSnapshotEnvelope,
  'widgetType' | 'snapshot'
> & {
  readonly widgetType: TKind;
  readonly snapshot: TSnapshot | null;
};
