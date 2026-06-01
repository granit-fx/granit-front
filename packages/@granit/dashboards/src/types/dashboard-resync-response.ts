import type { DashboardStatus } from './dashboard-status';

/**
 * Wire shape for `POST /dashboards/{id}/resync` (ADR-038 §3). Mirrors
 * `Granit.Dashboards.Endpoints.Dtos.DashboardResyncResponse`.
 *
 * Echoes the dashboard's identifying fields alongside a change-summary so
 * admins can audit what the resync actually moved without re-reading the
 * aggregate. The user-renamable {@link name} and lifecycle {@link status}
 * are intentionally preserved by the backend — a published dashboard stays
 * published, a renamed one keeps its tenant rename.
 */
export interface DashboardResyncResponse {
  /** Persisted dashboard identifier (unchanged). */
  readonly id: string;
  /** Dashboard name — preserved across the resync. */
  readonly name: string;
  /** Dashboard status — preserved across the resync. */
  readonly status: DashboardStatus;
  /** Wire identifier of the source definition (unchanged). */
  readonly sourceDefinitionName: string;
  /**
   * Source-definition version recorded on the dashboard before this
   * resync ran. `null` when the dashboard had never carried a version
   * (legacy data shipped before the version field was introduced).
   */
  readonly previousSourceDefinitionVersion: string | null;
  /**
   * Source-definition version captured by the resync — pulled from the
   * currently-registered descriptor. Always non-null since resync
   * requires the source to be registered.
   */
  readonly sourceDefinitionVersion: string;
  /**
   * Count of widgets the descriptor introduced (matched by
   * `Widget:{Name}.{slug}`).
   */
  readonly widgetsAdded: number;
  /** Count of widgets the descriptor no longer declares. */
  readonly widgetsRemoved: number;
  /**
   * Count of widgets whose persisted overrides were preserved on the
   * new instances via slug match. Slugs the descriptor renamed silently
   * lose their overrides.
   */
  readonly overridesCarriedOver: number;
}
