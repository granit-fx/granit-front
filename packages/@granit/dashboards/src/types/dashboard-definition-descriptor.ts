import type { DashboardCategory } from './dashboard-category.js';
import type { DashboardDefinition } from './dashboard-definition.js';

/**
 * Lightweight descriptor returned by the dashboard registry's discovery
 * endpoint. Lists every dashboard the host knows about without dragging in
 * the full {@link DashboardDefinition} payload — useful for catalog screens
 * (left rail, picker) where only metadata matters.
 *
 * Matches `IDashboardDefinitionDescriptor` on the backend.
 */
export interface DashboardDefinitionDescriptor {
  readonly id: string;
  readonly name: string;
  readonly category: DashboardCategory;
  readonly description?: string;
}

/**
 * Frontend-facing analogue of `IDashboardDefinitionRegistry`. Hosts plug in
 * their preferred fetching strategy (REST, embedded JSON, GraphQL) behind
 * this contract; the React layer consumes only the interface.
 */
export interface DashboardDefinitionRegistry {
  /** Returns descriptors for every dashboard the host exposes to the caller. */
  list(signal?: AbortSignal): Promise<readonly DashboardDefinitionDescriptor[]>;
  /** Returns the full definition (widgets + layout) for one dashboard, or null when unknown. */
  get(id: string, signal?: AbortSignal): Promise<DashboardDefinition | null>;
}
