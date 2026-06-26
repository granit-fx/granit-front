import { useTranslation } from 'react-i18next';

import {
  CONTROL_CLASS,
  MetaFieldInput,
  QueryNameCombobox,
  useQueryFieldMetadata,
} from './query-field-controls';

import type { ChartType, ChartWidgetDefinition } from '@granit/analytics';
import type { AggregateFunction } from '@granit/dashboards';
import type { WidgetConfigFormProps } from '@granit/react-dashboard-editor';

const CHART_TYPES: readonly ChartType[] = ['Bar', 'HorizontalBar', 'Line', 'Area', 'Pie', 'Donut'];
const AGGREGATIONS: readonly AggregateFunction[] = ['Count', 'Sum', 'Avg', 'Min', 'Max'];

/**
 * Built-in config form for {@link ChartWidgetDefinition}. Edits the
 * essential fields needed to bind a query: queryName, groupBy, the
 * aggregation function, the optional aggregated field, and the chart
 * type. Visual styling (palette, theme) is inherited from the active
 * `<EChartsThemeProvider>` and stays out of scope for the form.
 *
 * When wrapped in a `<QueryCatalogProvider>`, the query field offers a
 * catalogue-backed combobox and groupBy/field become dropdowns sourced from
 * the selected query's metadata. Without a provider it degrades to the
 * free-text inputs, so the form keeps working in any host.
 */
export function ChartConfigForm({
  widget,
  onChange,
}: WidgetConfigFormProps<ChartWidgetDefinition>) {
  const { t } = useTranslation();
  const { catalogEntries, hasCatalog, groupByOptions, fieldOptions } = useQueryFieldMetadata(
    widget.queryName
  );

  const isCount = widget.aggregation === 'Count';

  return (
    <div data-slot="chart-config-form" className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Chart.QueryName.Label')}
        </span>
        <QueryNameCombobox
          slot="chart-query-name"
          datalistId="chart-query-name-options"
          value={widget.queryName}
          onChange={(value) => onChange({ ...widget, queryName: value })}
          entries={catalogEntries}
          hasCatalog={hasCatalog}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Chart.GroupBy.Label')}
        </span>
        <MetaFieldInput
          slot="chart-group-by"
          value={widget.groupBy}
          options={groupByOptions}
          onChange={(value) => onChange({ ...widget, groupBy: value })}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Chart.Aggregation.Label')}
        </span>
        <select
          data-slot="chart-aggregation"
          value={widget.aggregation}
          onChange={(event) =>
            onChange({ ...widget, aggregation: event.target.value as AggregateFunction })
          }
          className={CONTROL_CLASS}
        >
          {AGGREGATIONS.map((agg) => (
            <option key={agg} value={agg}>
              {agg}
            </option>
          ))}
        </select>
      </label>
      {/* Field is required for everything except Count. The label hints at it. */}
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Chart.Field.Label')}
        </span>
        <MetaFieldInput
          slot="chart-field"
          value={widget.field ?? ''}
          options={fieldOptions}
          disabled={isCount}
          allowEmpty
          onChange={(value) => onChange({ ...widget, field: value === '' ? null : value })}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Chart.ChartType.Label')}
        </span>
        <select
          data-slot="chart-type"
          value={widget.chartType}
          onChange={(event) => onChange({ ...widget, chartType: event.target.value as ChartType })}
          className={CONTROL_CLASS}
        >
          {CHART_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
