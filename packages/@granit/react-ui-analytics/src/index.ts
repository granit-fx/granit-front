// ---------------------------------------------------------------------------
// @granit/react-ui-analytics — shadcn-styled config forms + shared query-binding
// editor controls for the analytics dashboard widgets (kpi / chart / table /
// pivot). The react-ui-dependent UI tier of @granit/react-analytics (which stays
// headless: hooks, unstyled tiles, registry, widget metadata + validation).
//
// Imported only by editor-enabled apps (the dashboard composer); tree-shaken
// away for read-only consumers.
// ---------------------------------------------------------------------------

import { ChartConfigForm } from './components/chart-config-form';
import { KpiConfigForm } from './components/kpi-config-form';
import { PivotConfigForm } from './components/pivot-config-form';
import { TableConfigForm } from './components/table-config-form';

import type { WidgetConfigForm, WidgetConfigFormRegistry } from '@granit/react-dashboard-editor';

// Shared query-binding editor controls — reused by the map widget config form
// (and any downstream widget that binds to a query-engine query).
export {
  EnumSelect,
  MetaFieldInput,
  MetaMultiFieldInput,
  QueryNameCombobox,
  RequiredMark,
} from './components/query-field-controls';
export { ChartConfigForm } from './components/chart-config-form';
export { KpiConfigForm } from './components/kpi-config-form';
export { PivotConfigForm } from './components/pivot-config-form';
export { TableConfigForm } from './components/table-config-form';

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
