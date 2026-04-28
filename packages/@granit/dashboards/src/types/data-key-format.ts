/**
 * Per-series presentation hints attached to a {@link Datasource} rather than
 * to the consuming widget. Mirrors `Granit.Dashboards.DataKeyFormat` (P2.2).
 *
 * The same chart widget can be reused with different data shapes — a
 * "Revenue by Region" chart and a "Revenue by Product" chart are the same
 * `ChartWidgetDefinition` with different datasources — so colors and units
 * belong to the data binding, not the visual.
 */
export interface DataKeyFormat {
  /**
   * Series identifier — matches the group-by value (chart) or the field name
   * (multi-series KPI / pivot).
   */
  readonly key: string;
  /**
   * Localization key for the display label (legend, tooltip). `null` = the
   * frontend falls back to {@link key}.
   */
  readonly labelLocalizationKey: string | null;
  /**
   * Hex color override. `null` = the active theme palette by series index.
   */
  readonly color: string | null;
  /**
   * Unit suffix (e.g. `"€"`, `"kWh"`, `"°C"`). When prefixed with `Unit:`,
   * resolved via i18n. `null` = no unit suffix.
   */
  readonly unit: string | null;
  /**
   * Decimal places for numeric formatting. `null` = the widget's default
   * (typically 0 for counts, 2 for currency).
   */
  readonly decimals: number | null;
}
