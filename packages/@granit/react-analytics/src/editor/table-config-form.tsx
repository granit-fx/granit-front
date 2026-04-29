import { useTranslation } from 'react-i18next';

import type { TableWidgetDefinition } from '@granit/analytics';
import type { WidgetConfigFormProps } from '@granit/react-dashboard-editor';

/**
 * Built-in config form for {@link TableWidgetDefinition}. Edits the
 * query binding + page size. Column visibility (`visibleColumns`) is
 * left as comma-separated input — apps wanting a column-picker dialog
 * register their own form via `composeWidgetConfigFormRegistries`.
 */
export function TableConfigForm({
  widget,
  onChange,
}: WidgetConfigFormProps<TableWidgetDefinition>) {
  const { t } = useTranslation();
  const visibleColumnsValue = widget.visibleColumns?.join(', ') ?? '';

  return (
    <div data-slot="table-config-form" className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Table.QueryName.Label')}
        </span>
        <input
          type="text"
          data-slot="table-query-name"
          value={widget.queryName}
          onChange={(event) => onChange({ ...widget, queryName: event.target.value })}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Table.VisibleColumns.Label')}
        </span>
        <input
          type="text"
          data-slot="table-visible-columns"
          value={visibleColumnsValue}
          placeholder="leave empty for all columns"
          onChange={(event) => {
            const raw = event.target.value.trim();
            const next =
              raw === ''
                ? null
                : raw
                    .split(',')
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0);
            onChange({ ...widget, visibleColumns: next });
          }}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
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
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </label>
    </div>
  );
}
