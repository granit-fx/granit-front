/**
 * Request body for `POST /dashboards/{id}/widgets`. Mirrors
 * `Granit.Dashboards.Endpoints.Dtos.AddWidgetRequest`.
 *
 * Pins a new widget into the dashboard's widget pool. The server
 * allocates the widget id (callers don't choose it). The optional
 * `metricName` / `queryName` denormalisations follow the widget kind:
 * KPI widgets carry `metricName` (or `queryName` for query-aggregate),
 * Chart / Table / Pivot / Map widgets carry `queryName`, framework
 * widgets (Markdown / Image / Text) carry neither.
 */
export interface AddWidgetRequest {
  /** PascalCase widget-kind discriminator (matches `WidgetInstanceResponse.widgetType`). */
  readonly widgetType: string;
  /** Grid column of the widget's top-left cell (0-based). */
  readonly x: number;
  /** Grid row of the widget's top-left cell (0-based). */
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly titleLocalizationKey: string;
  /** Kind-specific JSON payload — interpreted against `widgetType`. */
  readonly configJson: string;
  readonly metricName?: string | null;
  readonly queryName?: string | null;
  readonly requiredPermission?: string | null;
}

/**
 * Request body for `PUT /dashboards/{id}/widgets/{widgetId}`. Mirrors
 * `Granit.Dashboards.Endpoints.Dtos.UpdateWidgetRequest`.
 *
 * Full replacement of the widget's editable fields (layout + title +
 * config). `widgetType`, `metricName`, `queryName` and
 * `requiredPermission` are intentionally out of scope: switching widget
 * kind or rebinding to a different metric/query is delete + add, not
 * edit.
 */
export interface UpdateWidgetRequest {
  /** Grid column of the widget's top-left cell (0-based). */
  readonly x: number;
  /** Grid row of the widget's top-left cell (0-based). */
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly titleLocalizationKey: string;
  readonly configJson: string;
}
