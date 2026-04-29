/**
 * Declarative click-handler descriptor attached to a {@link WidgetDefinitionBase}.
 * Mirrors `Granit.Dashboards.WidgetAction` (P1.5).
 *
 * No code injection, no expression evaluation — only a typed
 * (`trigger`, `kind`, `target`, optional `params`) tuple that the frontend
 * dispatches to a known handler. Param values may reference variables
 * resolved by `IVariableSubstituter` (P3.3) at dispatch time, e.g.
 * `{ customerId: '${row.customerId}', status: 'unpaid' }`.
 */
export interface WidgetAction {
  readonly trigger: WidgetActionTrigger;
  readonly kind: WidgetActionKind;
  /**
   * Target identifier. Interpretation depends on {@link kind}:
   * - `Navigate` — frontend route (e.g. `/invoicing?status=unpaid`)
   * - `OpenDashboardView` — a view name on the same dashboard (P2.1)
   * - `OpenDashboard` — a `DashboardDefinition.Name`
   * - `ExportData` — an `ExportDefinition.Name` (Granit.DataExchange)
   * - `OpenDetail` — a side-drawer name (typically the row's full detail)
   */
  readonly target: string;
  /**
   * Static parameters merged with the dynamic data row at dispatch time.
   * `null` (or missing) = no extra parameters beyond the row data itself.
   */
  readonly params?: Readonly<Record<string, string>> | null;
}

/**
 * What user gesture fires a {@link WidgetAction}. PascalCase wire values —
 * the backend registers a `JsonStringEnumConverter` without a naming policy.
 */
export type WidgetActionTrigger =
  /** Clicking the widget body or KPI value. */
  | 'Click'
  /** Clicking a row inside a Table / Pivot widget. */
  | 'RowClick'
  /** Clicking a series segment inside a Chart widget (a bar, a line point, a slice). */
  | 'SeriesClick'
  /** Clicking a legend item inside a Chart widget. */
  | 'LegendClick';

/**
 * Type of dispatch the frontend performs when a {@link WidgetAction} fires.
 * PascalCase wire values — same convention as {@link WidgetActionTrigger}.
 */
export type WidgetActionKind =
  /** Frontend route navigation (preserves dashboard context if possible). */
  | 'Navigate'
  /** Switch to another view of the current dashboard (P2.1). */
  | 'OpenDashboardView'
  /** Navigate to another full dashboard definition by name. */
  | 'OpenDashboard'
  /** Trigger an export via Granit.DataExchange (target = `ExportDefinition.Name`). */
  | 'ExportData'
  /** Open a side drawer with the row's full detail (typical for table widgets). */
  | 'OpenDetail';
