import type { DashboardStatus } from './dashboard-status';
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
  /** Widgets pinned on the dashboard, in declared `position` order. */
  readonly widgets: readonly WidgetInstanceResponse[];
}
