/**
 * Wire-level projection of a persisted `WidgetInstance`. Mirrors
 * `Granit.Dashboards.Endpoints.Dtos.WidgetInstanceResponse`.
 *
 * Carries the type discriminator + denormalised metric / query
 * references for client-side validation, plus the kind-specific JSON
 * config blob the frontend interprets against `widgetType`. The full
 * `Datasource` for KPI widgets lives inside `configJson`.
 */
export interface WidgetInstanceResponse {
  /** Widget instance identifier. */
  readonly id: string;
  /**
   * Kind discriminator. PascalCase per ADR-039 §6.1
   * (`Markdown` / `Image` / `Text` / `Kpi` / `Chart` / `Table` / `Pivot` / `Map` / ...).
   */
  readonly widgetType: string;
  /** Dense-ranked grid order — 0-based. */
  readonly position: number;
  /** Grid columns. */
  readonly width: number;
  /** Grid rows. */
  readonly height: number;
  /**
   * Localization key for the widget title — typically
   * `Widget:{DashboardName}.{Slug}`.
   */
  readonly titleLocalizationKey: string;
  /**
   * Denormalised metric reference for KPI widgets bound to a
   * `MetricDatasource`; `null` otherwise.
   */
  readonly metricName: string | null;
  /**
   * Denormalised query reference for KPI widgets bound to a
   * `QueryAggregateDatasource`, or for Chart / Table / Pivot / Map
   * widgets; `null` otherwise.
   */
  readonly queryName: string | null;
  /**
   * Kind-specific JSON payload — interpreted by the frontend against
   * `widgetType`. Includes the full `Datasource` for KPI widgets.
   */
  readonly configJson: string;
  /** Optional per-widget permission override. */
  readonly requiredPermission: string | null;
}
