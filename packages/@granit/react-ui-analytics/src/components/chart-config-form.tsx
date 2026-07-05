import { useQueryFieldMetadata } from '@granit/react-analytics';
import { Button, Checkbox } from '@granit/react-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  EnumSelect,
  MetaFieldInput,
  QueryNameCombobox,
  RequiredMark,
} from './query-field-controls';

import type {
  ChartComboSeries,
  ChartType,
  ChartWidgetDefinition,
  ComboRenderAs,
} from '@granit/analytics';
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
  'Combo',
];
const AGGREGATIONS: readonly AggregateFunction[] = ['Count', 'Sum', 'Avg', 'Min', 'Max'];
const COMBO_RENDER_AS: readonly ComboRenderAs[] = ['Bar', 'Line'];
const DEFAULT_COMBO_MEASURE: ChartComboSeries = {
  field: null,
  aggregation: 'Sum',
  renderAs: 'Bar',
};

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
 * Stable per-row keys for the combo measures. `ChartComboSeries` mirrors a backend
 * DTO and carries no id, so we mint client-side keys and keep them aligned with the
 * list through structural edits — the array index would misassign React per-row
 * control state when a measure is removed from the middle of the list.
 */
function useMeasureKeys(count: number) {
  const [keys, setKeys] = useState<string[]>(() =>
    Array.from({ length: count }, () => crypto.randomUUID())
  );
  // Reconcile if the list length changed outside our handlers (e.g. widget reload).
  if (keys.length !== count) {
    setKeys((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push(crypto.randomUUID());
      return next;
    });
  }
  return {
    keys,
    added: () => setKeys((prev) => [...prev, crypto.randomUUID()]),
    removed: (index: number) => setKeys((prev) => prev.filter((_, i) => i !== index)),
  };
}

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
  const isCombo = widget.chartType === 'Combo';
  const supportsSeries = SERIES_CAPABLE.has(widget.chartType);
  const supportsStacking = STACK_CAPABLE.has(widget.chartType);
  const seriesRequired = widget.chartType === 'Heatmap';
  const hasSeriesBy = widget.seriesBy != null && widget.seriesBy !== '';

  const measures = widget.comboSeries ?? [];
  const measureKeys = useMeasureKeys(measures.length);
  const setMeasures = (next: readonly ChartComboSeries[]) =>
    onChange({ ...widget, comboSeries: next });
  const updateMeasure = (index: number, patch: Partial<ChartComboSeries>) =>
    setMeasures(measures.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  const addMeasure = () => {
    setMeasures([...measures, DEFAULT_COMBO_MEASURE]);
    measureKeys.added();
  };
  const removeMeasure = (index: number) => {
    setMeasures(measures.filter((_, i) => i !== index));
    measureKeys.removed(index);
  };

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
      {/* Group-by is the (shared) category axis for every type except Scatter (which plots raw points). */}
      {!isScatter && (
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
      )}
      {/* Combo replaces the single aggregation/field with a list of measures (below). */}
      {!isScatter && !isCombo && (
        <>
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
      {/* Combo measures — each an aggregation drawn as a bar or line on the shared category axis. */}
      {isCombo && (
        <div data-slot="chart-combo-series" className="space-y-2">
          <span className="block text-sm text-muted-foreground">
            {t('Dashboard:Widget.Chart.ComboSeries.Label')}
            <RequiredMark />
          </span>
          {measures.map((measure, index) => {
            const measureIsCount = measure.aggregation === 'Count';
            return (
              <div
                key={measureKeys.keys[index]}
                className="flex items-center gap-1"
                data-slot="chart-combo-measure"
              >
                <EnumSelect
                  slot="combo-aggregation"
                  value={measure.aggregation}
                  options={AGGREGATIONS}
                  onChange={(value) =>
                    updateMeasure(index, {
                      aggregation: value as AggregateFunction,
                      field: value === 'Count' ? null : measure.field,
                    })
                  }
                />
                <MetaFieldInput
                  slot="combo-field"
                  value={measure.field ?? ''}
                  options={fieldOptions}
                  disabled={measureIsCount}
                  allowEmpty
                  required={!measureIsCount}
                  onChange={(value) => updateMeasure(index, { field: value === '' ? null : value })}
                />
                <EnumSelect
                  slot="combo-render-as"
                  value={measure.renderAs}
                  options={COMBO_RENDER_AS}
                  onChange={(value) => updateMeasure(index, { renderAs: value as ComboRenderAs })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t('Dashboard:Widget.Chart.ComboSeries.Remove', {
                    defaultValue: 'Remove measure',
                  })}
                  disabled={measures.length <= 1}
                  onClick={() => removeMeasure(index)}
                >
                  ×
                </Button>
              </div>
            );
          })}
          <Button type="button" variant="outline" size="xs" onClick={addMeasure}>
            {t('Dashboard:Widget.Chart.ComboSeries.Add', { defaultValue: 'Add measure' })}
          </Button>
        </div>
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
            const combo = chartType === 'Combo';
            // Combo needs at least one measure to render — seed one when switching in.
            let comboSeries: readonly ChartComboSeries[] | null = null;
            if (combo) {
              comboSeries = measures.length ? measures : [DEFAULT_COMBO_MEASURE];
            }
            onChange({
              ...widget,
              chartType,
              seriesBy: SERIES_CAPABLE.has(chartType) ? widget.seriesBy : null,
              stacked: STACK_CAPABLE.has(chartType) ? widget.stacked : false,
              xField: scatter ? widget.xField : null,
              yField: scatter ? widget.yField : null,
              comboSeries,
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
