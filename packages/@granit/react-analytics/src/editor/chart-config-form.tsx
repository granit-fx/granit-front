import { useQueryCatalog, useQueryMetaAt } from '@granit/react-query-engine';
import { useTranslation } from 'react-i18next';

import type { ChartType, ChartWidgetDefinition } from '@granit/analytics';
import type { AggregateFunction } from '@granit/dashboards';
import type { WidgetConfigFormProps } from '@granit/react-dashboard-editor';

const CHART_TYPES: readonly ChartType[] = ['Bar', 'HorizontalBar', 'Line', 'Area', 'Pie', 'Donut'];
const AGGREGATIONS: readonly AggregateFunction[] = ['Count', 'Sum', 'Avg', 'Min', 'Max'];

/** CLR type names eligible for numeric aggregation (Sum/Avg/Min/Max). */
const NUMERIC_CLR_TYPES = new Set([
  'Byte',
  'SByte',
  'Int16',
  'UInt16',
  'Int32',
  'UInt32',
  'Int64',
  'UInt64',
  'Single',
  'Double',
  'Decimal',
]);

const CONTROL_CLASS =
  'w-full rounded-md border bg-background px-3 py-1.5 text-sm disabled:opacity-50';

interface FieldOption {
  readonly name: string;
  readonly label?: string;
}

/**
 * Renders a `<select>` over query-metadata field options, or falls back to a
 * free-text `<input>` when no metadata is available (no catalogue provider, an
 * unrouted query, or a query whose meta has not loaded). The current `value` is
 * always preserved as an option even when absent from `options`, so switching
 * queries never silently drops a previously bound field.
 */
function MetaFieldInput({
  slot,
  value,
  options,
  onChange,
  disabled = false,
  allowEmpty = false,
}: {
  readonly slot: string;
  readonly value: string;
  readonly options: readonly FieldOption[];
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly allowEmpty?: boolean;
}) {
  if (options.length === 0) {
    return (
      <input
        type="text"
        data-slot={slot}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={CONTROL_CLASS}
      />
    );
  }

  const knownValue = value === '' || options.some((option) => option.name === value);
  return (
    <select
      data-slot={slot}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={CONTROL_CLASS}
    >
      {allowEmpty && <option value="">—</option>}
      {!knownValue && <option value={value}>{value}</option>}
      {options.map((option) => (
        <option key={option.name} value={option.name}>
          {option.label ?? option.name}
        </option>
      ))}
    </select>
  );
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

  const { data: catalog } = useQueryCatalog();
  const selectedEntry = catalog?.find((entry) => entry.name === widget.queryName) ?? null;
  const { data: meta } = useQueryMetaAt(selectedEntry?.basePath ?? null);

  const groupByOptions: readonly FieldOption[] = meta?.groupByFields ?? [];
  const fieldOptions: readonly FieldOption[] = (meta?.columns ?? [])
    .filter((column) => NUMERIC_CLR_TYPES.has(column.type))
    .map((column) => ({ name: column.name, label: column.label }));

  const isCount = widget.aggregation === 'Count';
  const hasCatalog = catalog != null && catalog.length > 0;

  return (
    <div data-slot="chart-config-form" className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Chart.QueryName.Label')}
        </span>
        <input
          type="text"
          data-slot="chart-query-name"
          list={hasCatalog ? 'chart-query-name-options' : undefined}
          value={widget.queryName}
          onChange={(event) => onChange({ ...widget, queryName: event.target.value })}
          className={CONTROL_CLASS}
        />
        {hasCatalog && (
          <datalist id="chart-query-name-options">
            {catalog.map((entry) => (
              <option key={entry.name} value={entry.name}>
                {entry.label}
              </option>
            ))}
          </datalist>
        )}
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
