import type { DashboardStatus } from './dashboard-status.js';
import type { DashboardCategory } from '../types/dashboard-category.js';

/**
 * Response for `POST /dashboards/from-definition/{name}`. Mirrors
 * `Granit.Dashboards.Endpoints.Dtos.DashboardImportResponse`.
 *
 * Echoes the freshly-imported `Dashboard` aggregate's identifying
 * fields so the client can navigate to the new persisted dashboard
 * immediately. Always returns `status: "Draft"` for imports.
 */
export interface DashboardImportResponse {
  readonly id: string;
  readonly name: string;
  readonly category: DashboardCategory;
  readonly status: DashboardStatus;
  readonly sourceDefinitionName: string;
  readonly sourceDefinitionVersion: string;
  readonly widgetCount: number;
}
