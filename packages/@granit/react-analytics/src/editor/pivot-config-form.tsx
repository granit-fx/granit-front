import { useTranslation } from 'react-i18next';

import type { PivotWidgetDefinition } from '@granit/analytics';
import type { AggregateFunction } from '@granit/dashboards';
import type { WidgetConfigFormProps } from '@granit/react-dashboard-editor';

const AGGREGATIONS: readonly AggregateFunction[] = ['Count', 'Sum', 'Avg', 'Min', 'Max'];

const splitFields = (raw: string) =>
  raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

/**
 * Built-in config form for {@link PivotWidgetDefinition}. Edits the
 * query binding, the row + column dimension lists (comma-separated), the
 * aggregated value field, and the aggregation function. v1 keeps fields
 * as plain text — column-pickers / drag-and-drop dimension reorder ship
 * via custom forms registered downstream.
 */
export function PivotConfigForm({
  widget,
  onChange,
}: WidgetConfigFormProps<PivotWidgetDefinition>) {
  const { t } = useTranslation();
  return (
    <div data-slot="pivot-config-form" className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Pivot.QueryName.Label')}
        </span>
        <input
          type="text"
          data-slot="pivot-query-name"
          value={widget.queryName}
          onChange={(event) => onChange({ ...widget, queryName: event.target.value })}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Pivot.RowFields.Label')}
        </span>
        <input
          type="text"
          data-slot="pivot-row-fields"
          value={widget.rowFields.join(', ')}
          onChange={(event) => onChange({ ...widget, rowFields: splitFields(event.target.value) })}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Pivot.ColumnFields.Label')}
        </span>
        <input
          type="text"
          data-slot="pivot-column-fields"
          value={widget.columnFields.join(', ')}
          onChange={(event) =>
            onChange({ ...widget, columnFields: splitFields(event.target.value) })
          }
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Pivot.ValueField.Label')}
        </span>
        <input
          type="text"
          data-slot="pivot-value-field"
          value={widget.valueField ?? ''}
          onChange={(event) =>
            onChange({
              ...widget,
              valueField: event.target.value === '' ? null : event.target.value,
            })
          }
          disabled={widget.valueAggregation === 'Count'}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm disabled:opacity-50"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Pivot.ValueAggregation.Label')}
        </span>
        <select
          data-slot="pivot-value-aggregation"
          value={widget.valueAggregation}
          onChange={(event) =>
            onChange({ ...widget, valueAggregation: event.target.value as AggregateFunction })
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
    </div>
  );
}
