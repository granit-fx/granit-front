import { useTranslation } from 'react-i18next';

import {
  CONTROL_CLASS,
  MetaMultiFieldInput,
  QueryNameCombobox,
  useQueryFieldMetadata,
} from './query-field-controls';

import type { TableWidgetDefinition } from '@granit/analytics';
import type { WidgetConfigFormProps } from '@granit/react-dashboard-editor';

/**
 * Built-in config form for {@link TableWidgetDefinition}. Edits the
 * query binding, visible columns + page size.
 *
 * Under a `<QueryCatalogProvider>` the query field is a catalogue-backed
 * combobox and the visible-columns picker is a multi-select sourced from the
 * query's columns; otherwise both degrade to free-text (comma-separated for
 * columns). Apps wanting a richer column-picker dialog register their own form
 * via `composeWidgetConfigFormRegistries`.
 */
export function TableConfigForm({
  widget,
  onChange,
}: WidgetConfigFormProps<TableWidgetDefinition>) {
  const { t } = useTranslation();
  const { catalogEntries, hasCatalog, columnOptions } = useQueryFieldMetadata(widget.queryName);

  return (
    <div data-slot="table-config-form" className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Table.QueryName.Label')}
        </span>
        <QueryNameCombobox
          slot="table-query-name"
          datalistId="table-query-name-options"
          value={widget.queryName}
          onChange={(value) => onChange({ ...widget, queryName: value })}
          entries={catalogEntries}
          hasCatalog={hasCatalog}
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
          {t('Dashboard:Widget.Table.PageSize.Label')}
        </span>
        <input
          type="number"
          data-slot="table-page-size"
          min={1}
          value={widget.pageSize}
          onChange={(event) =>
            onChange({ ...widget, pageSize: Number.parseInt(event.target.value, 10) || 1 })
          }
          className={CONTROL_CLASS}
        />
      </label>
    </div>
  );
}
