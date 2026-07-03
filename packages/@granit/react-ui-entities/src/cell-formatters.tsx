// Data-table cell rendering for the generic workspace entity list.
//
// A column picks its renderer from three signals, in descending priority:
//   1. `column.valueKind` — semantic cell kind emitted by the backend query
//      metadata (Granit.QueryEngine.Meta.ColumnDefinition.ValueKind).
//   2. manifest `component` — the form-widget hint joined by column name.
//   3. CLR `column.type` — ISO-date detection, then a plain text fallback.
//
// Every signal is optional and purely additive: a column with no `valueKind`
// and no matching component degrades to the legacy CLR/text behaviour.

import type { ColumnDefinition } from '@granit/query-engine';
import type { ReactNode } from 'react';

export type DateFormatter = (date: string | Date) => string;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function formatDateValue(
  value: string,
  formatDate: DateFormatter,
  formatDateTime: DateFormatter,
  withTime: boolean
): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  // Timezone-aware (user PreferredTimezone) via useDateFormatter, not raw Intl.
  return withTime ? formatDateTime(value) : formatDate(value);
}

function tryFormatDateCell(
  value: unknown,
  component: string | undefined,
  columnType: string,
  formatDate: DateFormatter,
  formatDateTime: DateFormatter
): string | null {
  if (typeof value !== 'string') return null;
  if (component === 'date' || component === 'datetime') {
    return formatDateValue(value, formatDate, formatDateTime, component === 'datetime');
  }
  if (columnType === 'DateTime' || columnType === 'DateTimeOffset') {
    return formatDateValue(value, formatDate, formatDateTime, false);
  }
  if (ISO_DATE_RE.test(value)) {
    return formatDateValue(value, formatDate, formatDateTime, false);
  }
  return null;
}

// Monetary amounts arrive in minor units (cents); scale to the major unit.
// When no ISO code resolves, fall back to a plain locale number (no symbol).
function formatMoney(value: number, currency: string | undefined, locale: string): string {
  const options: Intl.NumberFormatOptions = currency ? { style: 'currency', currency } : {};
  return new Intl.NumberFormat(locale, options).format(value / 100);
}

// Currency ISO code precedence for a `Currency` column:
//   1. column.currencyCode  — fixed design-time constant
//   2. row[currencyCodeField] — sibling column, per row (multi-currency)
//   3. undefined            — locale/number fallback
function resolveColumnCurrency(
  column: ColumnDefinition,
  row: Readonly<Record<string, unknown>>
): string | undefined {
  if (column.currencyCode) return column.currencyCode;
  if (column.currencyCodeField) {
    const code = row[column.currencyCodeField];
    if (typeof code === 'string' && code.length > 0) return code;
  }
  return undefined;
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;

function formatBytes(value: number, locale: string): string {
  let size = value;
  let unit = 0;
  while (Math.abs(size) >= 1024 && unit < BYTE_UNITS.length - 1) {
    size /= 1024;
    unit += 1;
  }
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(size);
  return `${formatted} ${BYTE_UNITS[unit]}`;
}

// Humanizes a duration given in seconds to `1h 05m` / `12m 03s` / `45s`.
function formatDuration(totalSeconds: number): string {
  const seconds = Math.floor(Math.abs(totalSeconds));
  const sign = totalSeconds < 0 ? '-' : '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${sign}${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes > 0) return `${sign}${minutes}m ${String(secs).padStart(2, '0')}s`;
  return `${sign}${secs}s`;
}

type LinkKind = 'url' | 'email' | 'phone';

function formatLinkCell(value: unknown, kind: LinkKind): ReactNode {
  if (typeof value !== 'string' || value.length === 0) return null;
  const href = kind === 'email' ? `mailto:${value}` : kind === 'phone' ? `tel:${value}` : value;
  const external = kind === 'url';
  return (
    <a
      href={href}
      className="text-primary underline underline-offset-2"
      onClick={(e) => e.stopPropagation()}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {value}
    </a>
  );
}

/**
 * Cell-level rendering context threaded to every valueKind formatter. A `null`
 * return from a formatter means "cannot render this value" — {@link formatCell}
 * then falls through to the manifest-component / CLR path.
 */
export interface CellFormatterContext {
  readonly row: Readonly<Record<string, unknown>>;
  readonly column: ColumnDefinition;
  readonly component: string | undefined;
  readonly currencyResolver: (row: Readonly<Record<string, unknown>>) => string;
  readonly locale: string;
  readonly formatDate: DateFormatter;
  readonly formatDateTime: DateFormatter;
}

type CellFormatter = (value: unknown, ctx: CellFormatterContext) => ReactNode;

function formatDateKind(value: unknown, ctx: CellFormatterContext, withTime: boolean): ReactNode {
  if (typeof value !== 'string') return null;
  return formatDateValue(value, ctx.formatDate, ctx.formatDateTime, withTime);
}

function formatNumberKind(value: unknown, locale: string): ReactNode {
  if (typeof value !== 'number') return null;
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * `valueKind` → cell formatter. Tier 1+2 kinds render here; unmapped kinds
 * (`Enum`, `Color`, `Image`, `Json`, `Markdown`, `Tags`, `Rating`)
 * intentionally have no entry and fall through to the manifest-component / CLR
 * text path. Wire keys are the .NET `ValueKind` enum member names verbatim.
 */
export const VALUE_KIND_FORMATTERS: Readonly<Record<string, CellFormatter>> = Object.freeze({
  Currency: (value, ctx) =>
    typeof value === 'number'
      ? formatMoney(value, resolveColumnCurrency(ctx.column, ctx.row), ctx.locale)
      : null,
  Percentage: (value, ctx) =>
    typeof value === 'number'
      ? `${new Intl.NumberFormat(ctx.locale, { maximumFractionDigits: 2 }).format(value)}%`
      : null,
  Number: (value, ctx) => formatNumberKind(value, ctx.locale),
  Count: (value, ctx) => formatNumberKind(value, ctx.locale),
  Bytes: (value, ctx) => (typeof value === 'number' ? formatBytes(value, ctx.locale) : null),
  Duration: (value) => (typeof value === 'number' ? formatDuration(value) : null),
  Url: (value) => formatLinkCell(value, 'url'),
  Email: (value) => formatLinkCell(value, 'email'),
  Phone: (value) => formatLinkCell(value, 'phone'),
  Date: (value, ctx) => formatDateKind(value, ctx, false),
  DateTime: (value, ctx) => formatDateKind(value, ctx, true),
  Time: (value, ctx) => formatDateKind(value, ctx, true),
  RelativeTime: (value, ctx) => formatDateKind(value, ctx, true),
  Boolean: (value) =>
    typeof value === 'boolean' ? (
      <span data-granit-cell-boolean={String(value)}>{value ? '✓' : '✗'}</span>
    ) : null,
  Identifier: (value) => (
    <code className="font-mono text-xs">{typeof value === 'object' ? '—' : String(value)}</code>
  ),
});

/**
 * Renders one data-table cell with graceful degradation across the three
 * signals described at the top of this module.
 */
export function formatCell(ctx: CellFormatterContext): ReactNode {
  const { row, column, component, currencyResolver, locale, formatDate, formatDateTime } = ctx;
  const value = row[column.name];
  if (value === null || value === undefined) return '—';

  if (column.valueKind) {
    const formatter = VALUE_KIND_FORMATTERS[column.valueKind];
    if (formatter) {
      const rendered = formatter(value, ctx);
      if (rendered !== null) return rendered;
    }
  }

  if (component === 'money' && typeof value === 'number') {
    return formatMoney(value, currencyResolver(row), locale);
  }

  const formattedDate = tryFormatDateCell(
    value,
    component,
    column.type,
    formatDate,
    formatDateTime
  );
  if (formattedDate !== null) return formattedDate;

  if (typeof value === 'object') return JSON.stringify(value);
  return String(value); // NOSONAR: remaining types (symbol, function) stringify safely
}
