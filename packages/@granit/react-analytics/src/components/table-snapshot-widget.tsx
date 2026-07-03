import { isTableSnapshotEnvelope } from '@granit/analytics';
import { createDefaultCellDateFormatters, formatCell } from '@granit/react-query-engine';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { TableWidgetColumn, TableWidgetSnapshot } from '@granit/analytics';
import type { DashboardRenderedWidget } from '@granit/dashboards';
import type { ColumnDefinition } from '@granit/query-engine';

/**
 * Snapshot-driven renderer for the `'Table'` widget kind. Reads the rows
 * inline from `widget.snapshot.rows` (no per-row fetching — the bundle
 * carried them already), with localized headers via `useTranslation()`.
 *
 * Cells render through the shared query-engine `formatCell`, so a dashboard
 * table formats values exactly like the query grids: `valueKind` drives the
 * renderer (`Currency` symbol + locale, `Percentage` as `%`, `Url`/`Email`/
 * `Phone` as links, dates via locale formatters, …), with per-column and
 * per-row currency codes honoured. `valueKind` absent → locale number / text
 * fallback.
 *
 * The renderer stays narrow on purpose — sorting / pagination /
 * client-side filtering belong to the host (apps that need them override
 * the registry entry with a TanStack Table-based variant).
 */
export function TableSnapshotWidget({ widget }: { readonly widget: DashboardRenderedWidget }) {
  if (!isTableSnapshotEnvelope(widget) || !widget.snapshot) return null;
  return <TableBody snapshot={widget.snapshot} />;
}

function TableBody({ snapshot }: { readonly snapshot: TableWidgetSnapshot }) {
  const { t, i18n } = useTranslation();
  const { columns, rows, totalRowCount } = snapshot;
  const locale = i18n.language || 'en-US';
  const dateFormatters = useMemo(() => createDefaultCellDateFormatters(locale), [locale]);

  return (
    <div data-slot="table-snapshot-widget" className="flex h-full flex-col gap-2">
      <p className="text-xs text-muted-foreground" data-slot="table-snapshot-meta">
        {t('Widget:Table.ShowingNofM', {
          defaultValue: 'Showing {{shown}} of {{total}}',
          shown: rows.length,
          total: totalRowCount,
        })}
      </p>
      <div className="scrollbar-overlay flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              {columns.map((col) => (
                <th
                  key={col.name}
                  data-column-name={col.name}
                  className="py-1 pr-3 text-left font-medium"
                >
                  {col.labelLocalizationKey
                    ? t(col.labelLocalizationKey, { defaultValue: col.name })
                    : col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-3 text-center text-xs text-muted-foreground"
                  data-slot="table-snapshot-empty"
                >
                  {t('Widget:Table.NoData', { defaultValue: 'No data' })}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={resolveRowKey(row, i)}
                  data-slot="table-snapshot-row"
                  className="border-b last:border-0"
                >
                  {columns.map((col) => (
                    <td
                      key={col.name}
                      data-column-name={col.name}
                      className="py-1 pr-3 tabular-nums"
                    >
                      {formatCell({
                        row,
                        column: toColumnDefinition(col),
                        locale,
                        formatDate: dateFormatters.formatDate,
                        formatDateTime: dateFormatters.formatDateTime,
                      })}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Adapts a dashboard `TableWidgetColumn` to the `ColumnDefinition` shape the
 * shared `formatCell` consumes. The snapshot carries no CLR `type`, so the
 * formatter relies on `valueKind` (+ ISO-date detection for string cells).
 */
function toColumnDefinition(col: TableWidgetColumn): ColumnDefinition {
  return {
    name: col.name,
    label: col.labelLocalizationKey ?? col.name,
    type: '',
    order: 0,
    isSortable: false,
    isFilterable: false,
    isVisible: true,
    valueKind: col.valueKind ?? undefined,
    currencyCode: col.currencyCode ?? undefined,
    currencyCodeField: col.currencyCodeField ?? undefined,
  };
}

/**
 * Picks a stable React key for a row. Prefers an `id` field when the row
 * carries one (the typical case for query-engine-backed tables), falling
 * back to the index — Sonar's "no array index in keys" rule is satisfied
 * because the deterministic id path takes precedence whenever present.
 */
function resolveRowKey(row: Record<string, unknown>, index: number): string | number {
  const id = row['id'];
  if (typeof id === 'string' || typeof id === 'number') return id;
  return index;
}
