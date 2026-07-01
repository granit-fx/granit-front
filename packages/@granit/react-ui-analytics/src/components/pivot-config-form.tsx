import { useQueryFieldMetadata } from '@granit/react-analytics';
import { useTranslation } from 'react-i18next';

import {
  EnumSelect,
  MetaFieldInput,
  MetaMultiFieldInput,
  QueryNameCombobox,
  RequiredMark,
} from './query-field-controls';

import type { PivotWidgetDefinition } from '@granit/analytics';
import type { AggregateFunction } from '@granit/dashboards';
import type { WidgetConfigFormProps } from '@granit/react-dashboard-editor';

const AGGREGATIONS: readonly AggregateFunction[] = ['Count', 'Sum', 'Avg', 'Min', 'Max'];

/**
 * Built-in config form for {@link PivotWidgetDefinition}. Edits the
 * query binding, the row + column dimension lists, the aggregated value
 * field, and the aggregation function.
 *
 * Under a `<QueryCatalogProvider>` the query field is a catalogue-backed
 * combobox, the row/column dimensions are multi-selects sourced from the
 * query's group-by fields, and the value field is a numeric-column dropdown;
 * otherwise everything degrades to free-text. Column-pickers / drag-and-drop
 * dimension reorder ship via custom forms registered downstream.
 */
export function PivotConfigForm({
  widget,
  onChange,
}: WidgetConfigFormProps<PivotWidgetDefinition>) {
  const { t } = useTranslation();
  const { catalogEntries, groupByOptions, fieldOptions } = useQueryFieldMetadata(widget.queryName);

  const isCount = widget.valueAggregation === 'Count';

  return (
    <div data-slot="pivot-config-form" className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Pivot.QueryName.Label')}
          <RequiredMark />
        </span>
        <QueryNameCombobox
          slot="pivot-query-name"
          value={widget.queryName}
          onChange={(value) => onChange({ ...widget, queryName: value })}
          entries={catalogEntries}
          required
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Pivot.RowFields.Label')}
          <RequiredMark />
        </span>
        <MetaMultiFieldInput
          slot="pivot-row-fields"
          values={widget.rowFields}
          options={groupByOptions}
          onChange={(values) => onChange({ ...widget, rowFields: values })}
          required
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Pivot.ColumnFields.Label')}
        </span>
        <MetaMultiFieldInput
          slot="pivot-column-fields"
          values={widget.columnFields}
          options={groupByOptions}
          onChange={(values) => onChange({ ...widget, columnFields: values })}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Pivot.ValueField.Label')}
          {!isCount && <RequiredMark />}
        </span>
        <MetaFieldInput
          slot="pivot-value-field"
          value={widget.valueField ?? ''}
          options={fieldOptions}
          disabled={isCount}
          allowEmpty
          required={!isCount}
          onChange={(value) => onChange({ ...widget, valueField: value === '' ? null : value })}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Pivot.ValueAggregation.Label')}
        </span>
        <EnumSelect
          slot="pivot-value-aggregation"
          value={widget.valueAggregation}
          options={AGGREGATIONS}
          onChange={(value) =>
            onChange({ ...widget, valueAggregation: value as AggregateFunction })
          }
        />
      </label>
    </div>
  );
}
