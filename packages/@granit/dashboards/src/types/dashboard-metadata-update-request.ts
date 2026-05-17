/**
 * Request body for `PUT /dashboards/{id}`. Mirrors
 * `Granit.Dashboards.Endpoints.Dtos.DashboardMetadataUpdateRequest`.
 *
 * Full replacement of the dashboard's editable metadata (name + grid
 * layout). Status, source-definition fields, and the widget pool are
 * **immutable** through this endpoint and are managed by dedicated
 * routes (state transitions via `/publish` / `/archive` / `/restore`,
 * widget endpoints via `/widgets[/{widgetId}]`).
 */
export interface DashboardMetadataUpdateRequest {
  readonly name: string;
  readonly layoutColumns: number;
  readonly layoutRowHeight: number;
}
