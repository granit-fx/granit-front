import { isPivotSnapshotEnvelope } from '@granit/analytics';
import { createDefaultCellDateFormatters, formatCell } from '@granit/react-query-engine';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { PivotWidgetSnapshot } from '@granit/analytics';
import type { DashboardRenderedWidget } from '@granit/dashboards';
import type { ColumnDefinition } from '@granit/query-engine';
import type { ReactNode } from 'react';

/**
 * Snapshot-driven renderer for the `'Pivot'` widget kind. Pivots the flat
 * `(rowKeys × columnKeys × value)` cell list emitted by the backend into a
 * row-major matrix client-side — see `PivotWidgetSnapshot` (B3-6).
 *
 * Cells render through the shared query-engine `formatCell`: every cell shares
 * the snapshot's `valueKind` (`Count`, `Currency`, `Percentage`, `Bytes`, …)
 * and `currency`, so a pivot formats its aggregate the same way the query grids
 * format that measure — currency symbol, `%`, humanized bytes, or a locale
 * number fallback.
 *
 * The renderer stays narrow on purpose — drilling into a cell or
 * repositioning row/column dimensions belongs to a richer admin variant
 * apps can register on top of this default.
 */
export function PivotSnapshotWidget({ widget }: { readonly widget: DashboardRenderedWidget }) {
  if (!isPivotSnapshotEnvelope(widget) || !widget.snapshot) return null;
  return <PivotBody snapshot={widget.snapshot} />;
}

function PivotBody({ snapshot }: { readonly snapshot: PivotWidgetSnapshot }) {
  const { t, i18n } = useTranslation();
  const { rowFields, columnFields, valueField, aggregation, cells, currency, valueKind } = snapshot;
  const locale = i18n.language || 'en-US';

  // Pivot the flat cell list into a row-major matrix. Memoised so a parent
  // re-render that doesn't change the snapshot identity skips the work.
  const { rowTuples, columnTuples, cellByKey } = useMemo(() => {
    const rowSeen = new Set<string>();
    const colSeen = new Set<string>();
    const rows: (readonly string[])[] = [];
    const cols: (readonly string[])[] = [];
    const byKey = new Map<string, number | null>();
    for (const cell of cells) {
      const rowKey = cell.rowKeys.join('');
      const colKey = cell.columnKeys.join('');
      if (!rowSeen.has(rowKey)) {
        rowSeen.add(rowKey);
        rows.push(cell.rowKeys);
      }
      if (!colSeen.has(colKey)) {
        colSeen.add(colKey);
        cols.push(cell.columnKeys);
      }
      byKey.set(`${rowKey}::${colKey}`, cell.value);
    }
    return { rowTuples: rows, columnTuples: cols, cellByKey: byKey };
  }, [cells]);

  const aggregationLabel = valueField ? `${aggregation}(${valueField})` : aggregation;

  // Every cell shares the measure's valueKind + currency, so build one
  // synthetic column and format each value through the shared query formatter.
  const dateFormatters = useMemo(() => createDefaultCellDateFormatters(locale), [locale]);
  const cellColumn = useMemo<ColumnDefinition>(
    () => ({
      name: 'value',
      label: aggregationLabel,
      type: '',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: true,
      valueKind: valueKind ?? undefined,
      currencyCode: currency ?? undefined,
    }),
    [aggregationLabel, valueKind, currency]
  );
  const formatValue = (value: number): ReactNode =>
    formatCell({
      row: { value },
      column: cellColumn,
      locale,
      formatDate: dateFormatters.formatDate,
      formatDateTime: dateFormatters.formatDateTime,
    });

  return (
    <div data-slot="pivot-snapshot-widget" className="flex h-full flex-col gap-2">
      <p className="text-xs text-muted-foreground" data-slot="pivot-snapshot-meta">
        {aggregationLabel}
        {currency ? ` · ${currency}` : ''}
        {' · '}
        {t('Widget:Pivot.Rows', { defaultValue: 'rows: {{fields}}', fields: rowFields.join(', ') })}
        {' · '}
        {t('Widget:Pivot.Columns', {
          defaultValue: 'columns: {{fields}}',
          fields: columnFields.join(', ') || '—',
        })}
      </p>
      <div className="scrollbar-overlay flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="py-1 pr-3 text-left font-medium">{rowFields.join(' / ')}</th>
              {columnTuples.map((tuple) => (
                <th
                  key={tuple.join('|')}
                  data-column-tuple={tuple.join('|')}
                  className="py-1 pr-3 text-right font-medium"
                >
                  {tuple.join(' / ') || '—'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowTuples.length === 0 ? (
              <tr>
                <td
                  colSpan={columnTuples.length + 1}
                  className="py-3 text-center text-xs text-muted-foreground"
                  data-slot="pivot-snapshot-empty"
                >
                  {t('Widget:Pivot.NoData', { defaultValue: 'No data' })}
                </td>
              </tr>
            ) : (
              rowTuples.map((rowTuple) => (
                <tr
                  key={rowTuple.join('|')}
                  data-slot="pivot-snapshot-row"
                  data-row-tuple={rowTuple.join('|')}
                  className="border-b last:border-0"
                >
                  <td className="py-1 pr-3">{rowTuple.join(' / ')}</td>
                  {columnTuples.map((colTuple) => {
                    const value = cellByKey.get(`${rowTuple.join('')}::${colTuple.join('')}`);
                    return (
                      <td
                        key={colTuple.join('|')}
                        data-column-tuple={colTuple.join('|')}
                        className="py-1 pr-3 text-right tabular-nums"
                      >
                        {value === undefined || value === null ? '—' : formatValue(value)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
