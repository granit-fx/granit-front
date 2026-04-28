import type { DashboardCategory } from './dashboard-category.js';
import type { DashboardDefinition } from './dashboard-definition.js';
import type { DashboardLayout } from './dashboard-layout.js';
import type { WidgetDefinition } from './widget-definition.js';

/**
 * Lightweight descriptor returned by the dashboard registry's catalogue
 * endpoint. Lists every dashboard the host knows about without dragging in
 * widget payloads — useful for catalog screens (left rail, picker) where
 * only metadata matters.
 *
 * Mirrors `IDashboardDefinitionDescriptor` on the backend.
 *
 * User-facing strings are resolved from localization:
 *
 * - `Dashboard:{name}` — title (required)
 * - `Dashboard:{name}.Description` — secondary description (optional, P3.1)
 * - `Widget:{dashboardName}.{slug}` — widget content (per widget convention)
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
  readonly widgets: readonly WidgetDefinition[];
}

/**
 * Frontend-facing analogue of `IDashboardDefinitionRegistry`. Hosts plug in
 * their preferred fetching strategy (REST, embedded JSON, GraphQL) behind
 * this contract; the React layer consumes only the interface.
 */
export interface DashboardDefinitionRegistry {
  /** Returns descriptors for every dashboard the host exposes to the caller. */
  list(signal?: AbortSignal): Promise<readonly DashboardDefinitionDescriptor[]>;
  /** Returns the full definition for one dashboard, or null when unknown. */
  get(name: string, signal?: AbortSignal): Promise<DashboardDefinition | null>;
}
