import type { DashboardStatus } from './dashboard-status';
import type { DashboardTimeWindow } from './dashboard-time-window';
import type { WidgetInstanceResponse } from './widget-instance-response';
import type { DashboardCategory } from '../types/dashboard-category';

/**
 * Full payload for `GET /dashboards/{id}`. Mirrors
 * `Granit.Dashboards.Endpoints.Dtos.DashboardDetailResponse`.
 *
 * Summary fields plus the widget tree and layout values needed to
 * render the dashboard.
 */
export interface DashboardDetailResponse {
  readonly id: string;
  readonly name: string;
  readonly category: DashboardCategory;
  readonly status: DashboardStatus;
  readonly isSystem: boolean;
  readonly sourceDefinitionName: string | null;
  readonly sourceDefinitionVersion: string | null;
  /** Grid columns at the base viewport. */
  readonly layoutColumns: number;
  /** Grid row height in CSS pixels at the base viewport. */
  readonly layoutRowHeight: number;
  /**
   * Default time window seeding the top-of-dashboard time-range control. `null`
   * leaves the range to the frontend's global default (Last 30 days).
   */
  readonly defaultTimeWindow: DashboardTimeWindow | null;
  /** Widgets pinned on the dashboard, ordered by grid coordinate (y, then x). */
  readonly widgets: readonly WidgetInstanceResponse[];
}
