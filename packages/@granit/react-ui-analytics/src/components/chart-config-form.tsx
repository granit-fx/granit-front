import { useQueryFieldMetadata } from '@granit/react-analytics';
import { Checkbox } from '@granit/react-ui';
import { useTranslation } from 'react-i18next';

import {
  EnumSelect,
  MetaFieldInput,
  QueryNameCombobox,
  RequiredMark,
} from './query-field-controls';

import type { ChartType, ChartWidgetDefinition } from '@granit/analytics';
import type { AggregateFunction } from '@granit/dashboards';
import type { WidgetConfigFormProps } from '@granit/react-dashboard-editor';

const CHART_TYPES: readonly ChartType[] = [
  'Bar',
  'HorizontalBar',
  'Line',
  'Area',
  'Pie',
  'Donut',
  'Radar',
  'Funnel',
  'Treemap',
  'Heatmap',
  'Scatter',
];
const AGGREGATIONS: readonly AggregateFunction[] = ['Count', 'Sum', 'Avg', 'Min', 'Max'];

/** Chart types that accept a second `seriesBy` dimension (multi-series / point colour). */
const SERIES_CAPABLE: ReadonlySet<ChartType> = new Set([
  'Bar',
  'HorizontalBar',
  'Line',
  'Area',
  'Heatmap',
  'Scatter',
]);
/** Chart types where `stacked` (vs grouped) is meaningful. */
const STACK_CAPABLE: ReadonlySet<ChartType> = new Set(['Bar', 'HorizontalBar', 'Line', 'Area']);

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
  const { catalogEntries, groupByOptions, fieldOptions } = useQueryFieldMetadata(widget.queryName);

  const isCount = widget.aggregation === 'Count';
  const isScatter = widget.chartType === 'Scatter';
  const supportsSeries = SERIES_CAPABLE.has(widget.chartType);
  const supportsStacking = STACK_CAPABLE.has(widget.chartType);
  const seriesRequired = widget.chartType === 'Heatmap';
  const hasSeriesBy = widget.seriesBy != null && widget.seriesBy !== '';

  return (
    <div data-slot="chart-config-form" className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Chart.QueryName.Label')}
          <RequiredMark />
        </span>
        <QueryNameCombobox
          slot="chart-query-name"
          value={widget.queryName}
          onChange={(value) => onChange({ ...widget, queryName: value })}
          entries={catalogEntries}
          required
        />
      </label>
      {/* Scatter ignores the aggregation-centric fields — it plots raw x/y points instead. */}
      {!isScatter && (
        <>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              {t('Dashboard:Widget.Chart.GroupBy.Label')}
              <RequiredMark />
            </span>
            <MetaFieldInput
              slot="chart-group-by"
              value={widget.groupBy}
              options={groupByOptions}
              onChange={(value) => onChange({ ...widget, groupBy: value })}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              {t('Dashboard:Widget.Chart.Aggregation.Label')}
            </span>
            <EnumSelect
              slot="chart-aggregation"
              value={widget.aggregation}
              options={AGGREGATIONS}
              onChange={(value) => onChange({ ...widget, aggregation: value as AggregateFunction })}
            />
          </label>
          {/* Field is required for everything except Count (then it must be empty). */}
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              {t('Dashboard:Widget.Chart.Field.Label')}
              {!isCount && <RequiredMark />}
            </span>
            <MetaFieldInput
              slot="chart-field"
              value={widget.field ?? ''}
              options={fieldOptions}
              disabled={isCount}
              allowEmpty
              required={!isCount}
              onChange={(value) => onChange({ ...widget, field: value === '' ? null : value })}
            />
          </label>
        </>
      )}
      {/* Scatter's two numeric axes — raw point coordinates, sourced from the numeric fields. */}
      {isScatter && (
        <>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              {t('Dashboard:Widget.Chart.XField.Label')}
              <RequiredMark />
            </span>
            <MetaFieldInput
              slot="chart-x-field"
              value={widget.xField ?? ''}
              options={fieldOptions}
              allowEmpty
              required
              onChange={(value) => onChange({ ...widget, xField: value === '' ? null : value })}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              {t('Dashboard:Widget.Chart.YField.Label')}
              <RequiredMark />
            </span>
            <MetaFieldInput
              slot="chart-y-field"
              value={widget.yField ?? ''}
              options={fieldOptions}
              allowEmpty
              required
              onChange={(value) => onChange({ ...widget, yField: value === '' ? null : value })}
            />
          </label>
        </>
      )}
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Chart.ChartType.Label')}
        </span>
        <EnumSelect
          slot="chart-type"
          value={widget.chartType}
          options={CHART_TYPES}
          onChange={(value) => {
            // Sanitise the second-dimension fields when the new type can't use
            // them, so a switched-away config never persists a stale seriesBy /
            // stacked (the backend also zeroes stacked, but keep the DTO clean).
            const chartType = value as ChartType;
            const scatter = chartType === 'Scatter';
            onChange({
              ...widget,
              chartType,
              seriesBy: SERIES_CAPABLE.has(chartType) ? widget.seriesBy : null,
              stacked: STACK_CAPABLE.has(chartType) ? widget.stacked : false,
              xField: scatter ? widget.xField : null,
              yField: scatter ? widget.yField : null,
            });
          }}
        />
      </label>
      {/* Optional second dimension — grouped/stacked/multi-line/heatmap. Required for Heatmap. */}
      {supportsSeries && (
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">
            {t('Dashboard:Widget.Chart.SeriesBy.Label')}
            {seriesRequired && <RequiredMark />}
          </span>
          <MetaFieldInput
            slot="chart-series-by"
            value={widget.seriesBy ?? ''}
            options={groupByOptions}
            allowEmpty
            required={seriesRequired}
            onChange={(value) => onChange({ ...widget, seriesBy: value === '' ? null : value })}
          />
        </label>
      )}
      {/* Stacking is only meaningful once a series dimension is chosen, and only for bar/line/area. */}
      {supportsStacking && hasSeriesBy && (
        <label className="flex items-center gap-2 text-sm" data-slot="chart-stacked">
          <Checkbox
            checked={widget.stacked ?? false}
            onCheckedChange={(checked) => onChange({ ...widget, stacked: checked === true })}
          />
          <span className="text-muted-foreground">{t('Dashboard:Widget.Chart.Stacked.Label')}</span>
        </label>
      )}
    </div>
  );
}
