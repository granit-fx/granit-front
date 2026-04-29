import type { DashboardStatus } from './dashboard-status.js';
import type { DashboardCategory } from '../types/dashboard-category.js';

/**
 * Lightweight projection of a persisted `Dashboard` for the list endpoint
 * (`GET /dashboards/`, paged). Mirrors
 * `Granit.Dashboards.Endpoints.Dtos.DashboardSummaryResponse`.
 *
 * Strips the widget tree — `GET /dashboards/{id}` ({@link DashboardDetailResponse})
 * carries the full payload.
 */
export interface DashboardSummaryResponse {
  /** Persisted dashboard identifier. */
  readonly id: string;
  /** Tenant-renamable display name. */
  readonly name: string;
  /** Coarse grouping. */
  readonly category: DashboardCategory;
  /** Lifecycle state. */
  readonly status: DashboardStatus;
  /** When `true`, only re-syncable; never deletable by tenant admins. */
  readonly isSystem: boolean;
  /**
   * Wire identifier of the source `DashboardDefinition`. `null` for
   * ad-hoc dashboards composed entirely in the UI.
   */
  readonly sourceDefinitionName: string | null;
  /** Version of the source definition at import time. `null` for ad-hoc dashboards. */
  readonly sourceDefinitionVersion: string | null;
  /** Number of widgets currently pinned on the dashboard. */
  readonly widgetCount: number;
}
