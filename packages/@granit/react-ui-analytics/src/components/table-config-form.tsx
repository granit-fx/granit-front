import { useQueryFieldMetadata } from '@granit/react-analytics';
import { Input } from '@granit/react-ui';
import { useTranslation } from 'react-i18next';

import {
  EnumSelect,
  MetaFieldInput,
  MetaMultiFieldInput,
  QueryNameCombobox,
  RequiredMark,
} from './query-field-controls';

import type { TableWidgetDefinition } from '@granit/analytics';
import type { WidgetConfigFormProps } from '@granit/react-dashboard-editor';

/**
 * Built-in config form for {@link TableWidgetDefinition}. Edits the
 * query binding, visible columns, sort (server-side) + row limit.
 *
 * The table renders a single page (top N) — the row limit caps the rows the
 * backend returns; there is no pagination. The sort field / direction are
 * applied server-side before that truncation, so they choose which N rows show;
 * leaving the sort field empty falls back to the query's default sort.
 *
 * Under a `<QueryCatalogProvider>` the query field is a catalogue-backed
 * combobox and the column / sort pickers are sourced from the query's metadata;
 * otherwise they degrade to free-text (comma-separated for columns). Apps
 * wanting a richer column-picker dialog register their own form via
 * `composeWidgetConfigFormRegistries`.
 */
export function TableConfigForm({
  widget,
  onChange,
}: WidgetConfigFormProps<TableWidgetDefinition>) {
  const { t } = useTranslation();
  const { catalogEntries, columnOptions, sortableFieldOptions } = useQueryFieldMetadata(
    widget.queryName
  );

  return (
    <div data-slot="table-config-form" className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Table.QueryName.Label')}
          <RequiredMark />
        </span>
        <QueryNameCombobox
          slot="table-query-name"
          value={widget.queryName}
          onChange={(value) => onChange({ ...widget, queryName: value })}
          entries={catalogEntries}
          required
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Table.VisibleColumns.Label')}
        </span>
        <MetaMultiFieldInput
          slot="table-visible-columns"
          values={widget.visibleColumns ?? []}
          options={columnOptions}
          placeholder="leave empty for all columns"
          onChange={(values) =>
            onChange({ ...widget, visibleColumns: values.length > 0 ? values : null })
          }
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Table.SortField.Label')}
        </span>
        <MetaFieldInput
          slot="table-sort-field"
          value={widget.sortField ?? ''}
          options={sortableFieldOptions}
          allowEmpty
          onChange={(value) => onChange({ ...widget, sortField: value.length > 0 ? value : null })}
        />
      </label>
      {widget.sortField ? (
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">
            {t('Dashboard:Widget.Table.SortDirection.Label')}
          </span>
          <EnumSelect
            slot="table-sort-direction"
            value={widget.sortDirection ?? 'asc'}
            options={[
              { value: 'asc', label: t('Dashboard:Widget.Table.SortDirection.Asc') },
              { value: 'desc', label: t('Dashboard:Widget.Table.SortDirection.Desc') },
            ]}
            onChange={(value) =>
              onChange({ ...widget, sortDirection: value === 'desc' ? 'desc' : 'asc' })
            }
          />
        </label>
      ) : null}
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Table.RowLimit.Label')}
        </span>
        <Input
          type="number"
          data-slot="table-page-size"
          min={1}
          value={widget.pageSize}
          onChange={(event) =>
            onChange({ ...widget, pageSize: Number.parseInt(event.target.value, 10) || 1 })
          }
        />
      </label>
    </div>
  );
}
