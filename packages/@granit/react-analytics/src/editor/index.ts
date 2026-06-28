// ---------------------------------------------------------------------------
// @granit/react-analytics/editor — catalog + config forms for the dashboard
// composer (B5-C). Imported only by editor-enabled apps; tree-shaken away
// for read-only consumers.
// ---------------------------------------------------------------------------

import { ChartConfigForm } from './chart-config-form';
import { KpiConfigForm } from './kpi-config-form';
import { PivotConfigForm } from './pivot-config-form';
import { TableConfigForm } from './table-config-form';

import type { WidgetConfigForm, WidgetConfigFormRegistry } from '@granit/react-dashboard-editor';

export { analyticsWidgetCatalog } from './analytics-widget-catalog';
// Shared query-binding editor controls — reused by the map widget config form
// (and any downstream widget that binds to a query-engine query).
export {
  EnumSelect,
  MetaFieldInput,
  MetaMultiFieldInput,
  QueryNameCombobox,
  useQueryFieldMetadata,
} from './query-field-controls';
export type { FieldOption, QueryFieldMetadata } from './query-field-controls';
export { ChartConfigForm } from './chart-config-form';
export { KpiConfigForm } from './kpi-config-form';
export { PivotConfigForm } from './pivot-config-form';
export { TableConfigForm } from './table-config-form';

/**
 * Pre-composed config-form registry — the four analytics kinds in a
 * single registry shaped to drop straight into
 * `composeWidgetConfigFormRegistries(default, analyticsWidgetConfigFormRegistry)`.
 *
 * Casts route through `unknown` because TypeScript can't relate each
 * form's narrow widget type (`KpiWidgetDefinition`, etc.) to the open
 * `WidgetDefinition` union the registry's value type uses — same pattern
 * as `defaultAnalyticsWidgetRegistry` for the read-mode renderers.
 */
export const analyticsWidgetConfigFormRegistry: WidgetConfigFormRegistry = Object.freeze({
  kpi: KpiConfigForm as unknown as WidgetConfigForm,
  chart: ChartConfigForm as unknown as WidgetConfigForm,
  table: TableConfigForm as unknown as WidgetConfigForm,
  pivot: PivotConfigForm as unknown as WidgetConfigForm,
});
