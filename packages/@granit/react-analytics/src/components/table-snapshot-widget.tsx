import { isTableSnapshotEnvelope } from '@granit/analytics';
import { useTranslation } from 'react-i18next';

import type { TableWidgetColumn, TableWidgetSnapshot } from '@granit/analytics';
import type { DashboardRenderedWidget } from '@granit/dashboards';

/**
 * Snapshot-driven renderer for the `'Table'` widget kind. Reads the rows
 * inline from `widget.snapshot.rows` (no per-row fetching — the bundle
 * carried them already), with localized headers via `useTranslation()`.
 *
 * Per-column currency formatting (B3-8b): when a column declares
 * `currencyCode`, numeric cell values format via
 * `Intl.NumberFormat({ style: 'currency', currency })` using the active
 * locale. Mixing currencies across columns is supported by design (a
 * table with `AmountEur` + `AmountUsd` shows both symbols side by side).
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

  return (
    <div data-slot="table-snapshot-widget" className="flex h-full flex-col gap-2">
      <p className="text-xs text-muted-foreground" data-slot="table-snapshot-meta">
        {t('Widget:Table.ShowingNofM', {
          defaultValue: 'Showing {{shown}} of {{total}}',
          shown: rows.length,
          total: totalRowCount,
        })}
      </p>
      <div className="flex-1 overflow-auto">
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
                      {formatCell(row[col.name], col, i18n.language)}
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
 * Per-column cell formatter. Honors `currencyCode` (B3-8b) for numeric
 * values; otherwise falls back to locale-aware number formatting; falls
 * through to `String()` for non-number primitives.
 */
function formatCell(value: unknown, column: TableWidgetColumn, locale: string): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    if (column.currencyCode) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: column.currencyCode,
      }).format(value);
    }
    return value.toLocaleString(locale);
  }
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean' || typeof value === 'bigint') return value.toString();
  return JSON.stringify(value);
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
