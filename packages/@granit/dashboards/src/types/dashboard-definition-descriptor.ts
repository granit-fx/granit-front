import type { DashboardCategory } from './dashboard-category';
import type { DashboardDefinition } from './dashboard-definition';
import type { DashboardFilter } from './dashboard-filter';
import type { DashboardLayout } from './dashboard-layout';
import type { DashboardTimeWindow } from './dashboard-time-window';
import type { DashboardView } from './dashboard-view';
import type { EntityAlias } from './entity-alias';
import type { WidgetDefinition } from './widget-definition';

/**
 * Type-erased descriptor exposed by `IDashboardDefinitionRegistry`. Mirrors
 * `Granit.Dashboards.IDashboardDefinitionDescriptor` 1-for-1 — i.e. the
 * same shape `DashboardDefinition` carries, but reachable as an interface
 * (the framework's lookup APIs don't need the concrete subclass).
 *
 * Distinct from the `DashboardCatalogEntryResponse` exposed by
 * `GET /dashboards/catalog`: that response is a stripped projection
 * (name + version + feature flags) used for the import dialog. The
 * descriptor here carries the full declarative content.
 *
 * User-facing strings are not on the descriptor — they resolve from
 * localization keys composed off the descriptor's `name`:
 *
 * - `Dashboard:{name}` — title (required, ships in all default cultures)
 * - `Dashboard:{name}.Description` — secondary description (optional, P3.1)
 * - `Widget:{name}.{slug}` — per-widget content (the exact key is on each
 *   widget's `*LocalizationKey` property)
 *
 * Modules ship the keys for their default cultures; tenants override them
 * via `Granit.Localization.Overrides`.
 */
export interface DashboardDefinitionDescriptor {
  readonly name: string;
  readonly category: DashboardCategory;
  readonly isSystem: boolean;
  readonly version: string;
  readonly layout: DashboardLayout;
  /**
   * Default time window applied to every data-bound widget that does
   * not carry its own override. `null` / missing = the frontend falls
   * back to its global default.
   */
  readonly defaultTimeWindow?: DashboardTimeWindow | null;
  /** Widgets shipped by this dashboard, in declared order (single-view dashboards). */
  readonly widgets: readonly WidgetDefinition[];
  /**
   * Named views — separate widget arrangements within the same
   * dashboard. `null` / missing = single-view dashboard rendering
   * {@link widgets}.
   */
  readonly views?: readonly DashboardView[] | null;
  /** Entry-view name when {@link views} is non-null. */
  readonly defaultView?: string | null;
  /** Dashboard-scoped filters declared by this dashboard. */
  readonly filters?: readonly DashboardFilter[] | null;
  /** Named entity bindings — see `EntityAlias`. */
  readonly aliases?: readonly EntityAlias[] | null;
}

/**
 * Frontend-facing analogue of `IDashboardDefinitionRegistry`. Hosts
 * plug in their preferred fetching strategy (REST, embedded JSON,
 * GraphQL) behind this contract; the React layer consumes only the
 * interface.
 */
export interface DashboardDefinitionRegistry {
  /** Returns descriptors for every dashboard the host exposes to the caller. */
  list(signal?: AbortSignal): Promise<readonly DashboardDefinitionDescriptor[]>;
  /** Returns the full definition for one dashboard, or null when unknown. */
  get(name: string, signal?: AbortSignal): Promise<DashboardDefinition | null>;
}
