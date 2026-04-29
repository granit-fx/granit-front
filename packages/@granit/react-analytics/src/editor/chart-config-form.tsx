import { useTranslation } from 'react-i18next';

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
 */
export function ChartConfigForm({
  widget,
  onChange,
}: WidgetConfigFormProps<ChartWidgetDefinition>) {
  const { t } = useTranslation();
  return (
    <div data-slot="chart-config-form" className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Chart.QueryName.Label')}
        </span>
        <input
          type="text"
          data-slot="chart-query-name"
          value={widget.queryName}
          onChange={(event) => onChange({ ...widget, queryName: event.target.value })}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Chart.GroupBy.Label')}
        </span>
        <input
          type="text"
          data-slot="chart-group-by"
          value={widget.groupBy}
          onChange={(event) => onChange({ ...widget, groupBy: event.target.value })}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
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
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
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
        <input
          type="text"
          data-slot="chart-field"
          value={widget.field ?? ''}
          onChange={(event) =>
            onChange({ ...widget, field: event.target.value === '' ? null : event.target.value })
          }
          disabled={widget.aggregation === 'Count'}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm disabled:opacity-50"
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
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
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
