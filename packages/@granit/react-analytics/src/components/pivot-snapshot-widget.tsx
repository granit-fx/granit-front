import { isPivotSnapshotEnvelope } from '@granit/analytics';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { PivotWidgetSnapshot } from '@granit/analytics';
import type { DashboardRenderedWidget } from '@granit/dashboards';

/**
 * Snapshot-driven renderer for the `'Pivot'` widget kind. Pivots the flat
 * `(rowKeys × columnKeys × value)` cell list emitted by the backend into a
 * row-major matrix client-side — see `PivotWidgetSnapshot` (B3-6).
 *
 * Currency-aware (B3-8b): when `snapshot.currency` is set, every cell value
 * formats via `Intl.NumberFormat({ style: 'currency', currency })` with the
 * active locale. All cells share the same currency since they aggregate
 * the same value field.
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
  const { rowFields, columnFields, valueField, aggregation, cells, currency } = snapshot;

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

  const formatValue = (value: number) =>
    currency
      ? new Intl.NumberFormat(i18n.language, {
          style: 'currency',
          currency,
        }).format(value)
      : value.toLocaleString(i18n.language);

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
      <div className="flex-1 overflow-auto">
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
